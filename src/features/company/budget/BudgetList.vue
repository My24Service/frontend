<template>
  <div class="app-page">
    <b-modal
      id="model-modal"
      ref="modelModal"
      :title="isEdit ? $trans('Edit budget') : $trans('New budget')"
      @ok.prevent="submitModal"
    >
      <form ref="model-form">
        <b-container v-if="modal">
          <b-row>
            <b-col cols="4">
              <BFormGroup
                :label="$trans('Year')"
                label-for="model-year"
              >
                <BFormInput
                  id="model-year"
                  v-model="modal.year"
                  size="sm"
                  :state="submitClicked ? !modalErrors.year : null"
                />
                <b-form-invalid-feedback :state="submitClicked ? !modalErrors.year : null">
                  {{ modalErrors.year }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-col>
            <b-col cols="8">
              <BFormGroup :label="$trans('Amount')">
                <PriceInput
                  v-model="modal.amount"
                  :currency="modalCurrency"
                  @priceChanged="priceChanged"
                />
                <b-form-invalid-feedback :state="submitClicked ? !modalErrors.amount : null">
                  {{ modalErrors.amount }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <ServerTable
      ref="tableRef"
      v-model:search-draft="searchDraft"
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :title="$trans('Budgets')"
      :search-label="$trans('Search budgets')"
      :label="$trans('Budget')"
      :empty-text="$trans('No budgets found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-modal',
        confirmText: $trans('Are you sure you want to delete this budget?'),
        destroyMutation: companyBudgetDestroyMutation,
        invalidate: invalidateBudgetList,
        deletedDetail: $trans('Budget has been deleted'),
        deleteError: $trans('Error deleting budget'),
      }"
    >
      <template #icon><IBiCreditCard2Front /></template>
      <template #add>
        <button
          class="btn btn-primary"
          @click="showAddModal"
        >
          <IBiPlus />{{ $trans('New budget') }}
        </button>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import {
  companyBudgetCreateMutation,
  companyBudgetDestroyMutation,
  companyBudgetListOptions,
  companyBudgetPartialUpdateMutation,
  companyBudgetRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { Budget, PaginatedBudgetList } from '@/api/types.gen'
import RowAction from '@/components/RowAction.vue'
import { ServerTable, baseListParams, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import { errorToast, infoToast, $trans } from '@/services/i18n'
import { toDinero } from '@/services/money'
import { useMainStore } from '@/stores/main'
import { invalidateBudgetList } from './invalidation'
import {
  budgetModalFromRecord,
  emptyBudget,
  parseBudgetCreate,
  parseBudgetUpdate,
  validateBudgetModal,
  type BudgetModalErrors,
  type BudgetModalValues,
} from './schemas'

/**
 * The budget list with its create/edit modal. The table is the shared
 * server-paged kit; the modal is local state on the equipment list's
 * add-state pattern: it stays open when the save fails, and only a
 * successful write hides it and refetches the list.
 */
type BudgetRow = ListRow<PaginatedBudgetList>

const mainStore = useMainStore()
const queryClient = useQueryClient()
const { create: toast } = useToast()

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')
const modelModal = useTemplateRef<{show: () => void, hide: () => void}>('modelModal')

const helper = createAppColumnHelper<BudgetRow>()

const columns = helper.columns([
  helper.accessor('year', {
    header: $trans('Year'),
    cell: ({ row }) => h(RouterLink, {
      to: { name: 'company-budget-view', params: { pk: row.original.id } },
    }, () => String(row.original.year)),
  }),
  helper.accessor('amount', {
    header: $trans('Budget size'),
    cell: ({ row }) => toDinero(row.original.amount ?? '0', row.original.amount_currency).toFormat('$0.00'),
  }),
  helper.display({
    id: 'icons',
    header: '',
    cell: ({ row }) => h('div', { class: 'h2 float-right' }, [
      h(RowAction, {icon: 'edit',
        method: () => showEditModal(row.original.id),
        title: $trans('Edit'),
      }),
      h(RowAction, {icon: 'delete',
        title: $trans('Delete'),
        method: () => tableRef.value?.showDeleteModal(row.original.id),
      }),
    ]),
  }),
])

const { table, searchDraft, pagination, count, isLoading, isFetching, refresh } = useServerTable<BudgetRow>({
  key: 'budget-table',
  columns,
  // The legacy table offered no sorting, and the endpoint declares no
  // `ordering` - the headers stay non-sortable rather than rendering controls
  // nothing honours.
  enableSorting: false,
  listOptions: (query) => companyBudgetListOptions({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading budgets'),
})

// The modal ---------------------------------------------------------------

const modal = ref<(BudgetModalValues & { id: number | null, currency: string }) | null>(null)
const modalErrors = ref<BudgetModalErrors>({})
const submitClicked = ref(false)
const isEdit = computed(() => modal.value != null && modal.value.id != null)
const modalCurrency = computed(() => modal.value?.currency ?? mainStore.getDefaultCurrency)
const modalSaving = ref(false)

function showAddModal() {
  modal.value = { ...emptyBudget(), id: null, currency: mainStore.getDefaultCurrency }
  modalErrors.value = {}
  submitClicked.value = false
  modelModal.value?.show()
}

async function showEditModal(id: number) {
  const record = await queryClient.fetchQuery(companyBudgetRetrieveOptions({ path: { id } }))
  modal.value = { ...budgetModalFromRecord(record as Budget), id, currency: (record as Budget).amount_currency }
  modalErrors.value = {}
  submitClicked.value = false
  modelModal.value?.show()
}

const createMutation = useMutation(companyBudgetCreateMutation())
const updateMutation = useMutation(companyBudgetPartialUpdateMutation())

/**
 * The modal write, on the add-state pattern: validation and write failures
 * keep the modal open with the copy the user reads; only a success hides it
 * and refetches the list. The legacy modal closed on OK whatever happened,
 * so a failed save looked like a success.
 */
async function submitModal() {
  if (!modal.value || modalSaving.value) return
  modalSaving.value = true

  try {
    submitClicked.value = true
    const found = validateBudgetModal(modal.value)
    modalErrors.value = found
    if (Object.keys(found).length > 0) return

    if (isEdit.value) {
      await updateMutation.mutateAsync({
        path: { id: modal.value.id as number },
        body: parseBudgetUpdate(modal.value),
      })
      infoToast(toast, $trans('Updated'), $trans('Budget modified'))
    } else {
      await createMutation.mutateAsync({ body: parseBudgetCreate(modal.value) })
      infoToast(toast, $trans('Created'), $trans('Budget added'))
    }
    await invalidateBudgetList(queryClient)
    modelModal.value?.hide()
  } catch {
    errorToast(toast, $trans('Error handling budget'))
  } finally {
    modalSaving.value = false
  }
}

function priceChanged(dinero: ReturnType<typeof toDinero>) {
  if (modal.value) modal.value.amount = dinero.toFormat('0.00')
}
</script>
