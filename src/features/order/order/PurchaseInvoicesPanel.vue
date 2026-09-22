<template>
  <b-modal
    id="delete-purchase-invoice-modal"
    ref="delete-purchase-invoice-modal"
    :title="$trans('Delete?')"
    @ok="handleDeleteOk"
  >
    <p class="my-4">{{ $trans('Are you sure you want to delete this purchase invoice?') }}</p>
  </b-modal>

  <b-modal
    id="add-purchase-invoice-modal"
    ref="add-purchase-invoice-modal"
    :title="$trans('Add purchase invoice')"
    @ok="handleAddOk"
  >
    <form ref="add-purchase-invoice-form">
      <b-container>
        <b-row>
          <b-col cols="6">
            <BFormGroup
              :label="$trans('VAT')"
              label-for="add-purchase-invoice-vat"
            >
              <PriceInput
                id="add-purchase-invoice-vat"
                v-model="draft.vat"
                :currency="currency"
                @priceChanged="(dinero: Dinero.Dinero) => (draft.vat = dinero.toFormat('0.00'))"
              />
            </BFormGroup>
          </b-col>
          <b-col cols="6">
            <BFormGroup
              :label="$trans('Total')"
              label-for="add-purchase-invoice-total"
            >
              <PriceInput
                id="add-purchase-invoice-total"
                v-model="draft.total"
                :currency="currency"
                @priceChanged="(dinero: Dinero.Dinero) => (draft.total = dinero.toFormat('0.00'))"
              />
            </BFormGroup>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4">
            <BFormGroup
              :label="$trans('Reference')"
              label-for="add-purchase-invoice-reference"
            >
              <BFormInput
                id="add-purchase-invoice-reference"
                v-model="draft.reference"
                size="sm"
              />
            </BFormGroup>
          </b-col>
          <b-col cols="8">
            <BFormGroup
              :label="$trans('Description')"
              label-for="add-purchase-invoice-description"
            >
              <BFormTextarea
                id="add-purchase-invoice-description"
                v-model="draft.description"
                rows="1"
              />
            </BFormGroup>
          </b-col>
        </b-row>
      </b-container>
    </form>
  </b-modal>

  <div class="purchase-invoices-table">
    <h6>{{ $trans('Purchase invoices') }}</h6>
    <table
      id="purchase-invoices-table"
      class="table table-sm data-table overflow-x-auto"
    >
      <thead>
        <tr>
          <th>{{ $trans('Reference') }}</th>
          <th>{{ $trans('Description') }}</th>
          <th>{{ $trans('VAT') }}</th>
          <th>{{ $trans('Total') }}</th>
          <th>
            <div class="float-right">
              <BButton-toolbar>
                <BButton-group class="mr-1">
                  <RowAction icon="plus" header
                    :method="openAdd"
                    :title="$trans('New purchase invoice')"
                  />
                </BButton-group>
              </BButton-toolbar>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="isLoading">
          <td colspan="5" class="text-center">
            <b-spinner small class="align-middle" />&nbsp;&nbsp;<strong>{{ $trans('Loading...') }}</strong>
          </td>
        </tr>
        <tr
          v-for="row in rows"
          :key="row.id"
        >
          <td>{{ row.reference || $trans('(n/a)') }}</td>
          <td>{{ row.description || $trans('(n/a)') }}</td>
          <td>{{ money(row.vat, row.vat_currency) }}</td>
          <td>{{ money(row.total, row.total_currency) }}</td>
          <td>
            <div class="h2 float-right">
              <RowAction icon="delete"
                :title="$trans('Delete')"
                :method="() => confirmDelete(row.id)"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import type Dinero from 'dinero.js'

import {
  invoicePurchaseCreateMutation,
  invoicePurchaseDestroyMutation,
  invoicePurchaseListOptions,
  invoicePurchaseListQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import type { PurchaseRequest } from '@/api/types.gen'
import RowAction from '@/components/RowAction.vue'
import {
  useConfirmedAction,
  WHOLE_COLLECTION_PAGE_SIZE,
} from '@/features/table'
import { useQueryErrorToast } from '@/features/forms'
import { toDinero } from '@/services/money'
/**
 * The purchase invoices booked against an order — a branch tenant's own
 * costs on a partner's order. A table with an add modal and a delete
 * confirmation, both writing through the generated `/invoice/purchase/`
 * ops and refetching the list.
 */
const props = defineProps<{
  orderId: number
}>()

// A detail table with no page control asks for the whole collection: 1000
// is the API's own ceiling (`My24Pagination.max_page_size`), see
// src/features/customer/README.md, "The whole-collection bound".

const mainStore = useMainStore()
const currency = computed(() => mainStore.getDefaultCurrency)

const queryClient = useQueryClient()
const {create} = useToast()

const listQuery = useQuery(() => invoicePurchaseListOptions({
  query: {order: props.orderId, page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE},
}))
const rows = computed(() => listQuery.data.value?.results ?? [])
const isLoading = computed(() => listQuery.isLoading.value)
useQueryErrorToast(listQuery.error, $trans('Error loading purchase invoices'))

function invalidate() {
  return queryClient.invalidateQueries({queryKey: invoicePurchaseListQueryKey({query: {order: props.orderId}})})
}

function money(amount: string | undefined, rowCurrency: string): string {
  const dinero = toDinero(amount ?? '0.00', rowCurrency || currency.value)
  return dinero ? dinero.toFormat('$0.00') : ''
}

const {confirm: confirmDelete, handleOk: handleDeleteOk} = useConfirmedAction({
  mutationOptions: () => ({
    ...invoicePurchaseDestroyMutation(),
    onSuccess: invalidate,
    onError: () => errorToast(create, $trans('Error deleting purchase invoice')),
  }),
  modalRefName: 'delete-purchase-invoice-modal',
})

function blankDraft(): PurchaseRequest {
  return {order: props.orderId, vat: '0.00', total: '0.00', reference: '', description: ''}
}

const draft = reactive<PurchaseRequest>(blankDraft())
const addModal = useTemplateRef<{show: () => void; hide: () => void}>('add-purchase-invoice-modal')

function openAdd() {
  Object.assign(draft, blankDraft())
  addModal.value?.show()
}

const createMutation = useMutation({
  ...invoicePurchaseCreateMutation(),
  onSuccess: invalidate,
  onError: () => errorToast(create, $trans('Error creating purchase invoice')),
})

async function handleAddOk(event: {preventDefault: () => void}) {
  event.preventDefault()
  try {
    await createMutation.mutateAsync({body: {...draft, order: props.orderId}})
    addModal.value?.hide()
  } catch {
    // the toast said what happened; the modal stays open with the draft
  }
}
</script>

<style scoped>
.purchase-invoices-table {
  padding-top: 10px;
}
</style>
