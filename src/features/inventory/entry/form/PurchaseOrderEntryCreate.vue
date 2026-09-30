<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiReceipt />
          <span class="backlink" @click="cancelForm">{{ $trans('Entries') }}</span> /
          <span>{{ $trans('New entry') }}</span>
        </h3>
        <BButton-toolbar>
          <BButton class="btn btn-secondary" type="button" variant="secondary" @click="cancelForm">
            {{ $trans('Cancel') }}
          </BButton>
          <BButton
            class="btn btn-primary"
            type="button"
            variant="primary"
            :disabled="createMutation.isPending.value"
            @click="submit"
          >
            {{ $trans('Submit') }}
          </BButton>
        </BButton-toolbar>
      </div>
    </header>
    <div class="page-details panel">
      <b-overlay :show="isLoading" rounded="sm">
        <div class="container app-form">
          <b-form>
            <b-row>
              <b-col cols="12" role="group">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Purchase order')"
                  label-for="purchaseorder-entry-order-search"
                >
                  <VueMultiselect
                    id="purchaseorder-entry-order-search"
                    track-by="id"
                    :placeholder="$trans('Type to search')"
                    open-direction="bottom"
                    :options="staging.orderSearch.options.value"
                    :multiple="false"
                    :loading="staging.orderSearch.loading.value"
                    :internal-search="false"
                    :clear-on-select="true"
                    :close-on-select="true"
                    :options-limit="30"
                    :limit="10"
                    :max-height="600"
                    :show-no-results="false"
                    :hide-selected="true"
                    :custom-label="purchaseOrderLabel"
                    @search-change="(term: string) => { staging.orderSearch.term.value = term }"
                    @select="staging.selectOrder"
                  >
                    <template #noResult>
                      {{ $trans('Oops! No elements found. Consider changing the search query.') }}
                    </template>
                  </VueMultiselect>
                </BFormGroup>
              </b-col>
            </b-row>

            <b-row>
              <b-col cols="1" role="group">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Order ID')"
                  label-for="purchaseorder-entry-order-id"
                >
                  <BFormInput id="purchaseorder-entry-order-id" :model-value="order?.purchase_order_id ?? ''" readonly size="sm" />
                </BFormGroup>
              </b-col>
              <b-col cols="3" role="group">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Supplier')"
                  label-for="purchaseorder-entry-supplier"
                >
                  <BFormInput id="purchaseorder-entry-supplier" :model-value="order?.order_name ?? ''" readonly size="sm" />
                </BFormGroup>
              </b-col>
              <b-col cols="3" role="group">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('City')"
                  label-for="purchaseorder-entry-city"
                >
                  <BFormInput id="purchaseorder-entry-city" :model-value="order?.order_city ?? ''" readonly size="sm" />
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Expected entry date')"
                  label-for="purchaseorder-entry-expected_entry_date"
                >
                  <BFormInput
                    id="purchaseorder-entry-expected_entry_date"
                    :model-value="order?.expected_entry_date ?? ''"
                    readonly
                    size="sm"
                  />
                </BFormGroup>
              </b-col>
              <b-col cols="3" role="group">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Default location')"
                  label-for="purchaseorder-entry-default-location"
                >
                  <BFormSelect
                    id="purchaseorder-entry-default-location"
                    v-model="staging.defaultLocation.value"
                    :options="stockLocations"
                    size="sm"
                    value-field="id"
                    text-field="name"
                  />
                </BFormGroup>
              </b-col>
            </b-row>

            <EntryRowsPanel :staging="staging" :stock-locations="stockLocations" />
          </b-form>
        </div>
      </b-overlay>
    </div>
  </div>
</template>

<script setup lang="ts">
import VueMultiselect from 'vue-multiselect'

import { invalidateEntryWrites } from '../invalidation'
import EntryRowsPanel from './EntryRowsPanel.vue'
import { useEntryRows } from './use-entry-rows'
import { useStockLocations } from './use-stock-locations'

/**
 * Receiving a purchase order: pick the order, and its ordered products are
 * staged as entries to adjust and book in, all of them in one atomic request
 * to the bulk endpoint. The staged rows are `useEntryRows`'; a create with none
 * stages nothing to send and goes back without a request or a toast.
 */
const { toast, queryClient } = useCommon()
const router = useRouter()

const { stockLocations, isLoading: locationsLoading } = useStockLocations()
const staging = useEntryRows(() => stockLocations.value)
const order = staging.selectedOrder

const createMutation = useMutation(Api.InventoryPurchaseorderEntryBulk.create.mutation())

const isLoading = computed(() => createMutation.isPending.value || staging.isLoading.value || locationsLoading.value)

const purchaseOrderLabel = (option: Api.PurchaseOrderList) =>
  interpolate($trans('%(order)s - %(name)s, %(city)s (materials: %(count)s)'), {
    order: option.purchase_order_id ?? '',
    name: option.order_name ?? '',
    city: option.order_city ?? '',
    count: option.num_materials,
  })

async function submit() {
  if (createMutation.isPending.value) return
  // What the open row editor shows is what the user means to book in: the
  // legacy editor was bound to its row. An invalid edit stops the save and
  // says why.
  if (staging.isEditing.value && !staging.commitEdit()) return
  if (staging.rows.value.length === 0) {
    router.go(-1)
    return
  }

  try {
    await createMutation.mutateAsync({body: staging.bulkBody()})
  } catch {
    errorToast(toast, $trans('Error creating entry'))
    return
  }
  infoToast(toast, $trans('Created'), $trans('Entry has been created'))
  await invalidateEntryWrites(queryClient)
  router.go(-1)
}

function cancelForm() {
  router.go(-1)
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
