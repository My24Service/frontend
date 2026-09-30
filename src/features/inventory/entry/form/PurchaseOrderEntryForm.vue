<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiReceipt />
          <span class="backlink" @click="form.cancelForm">{{ $trans('Entries') }}</span> /
          <span v-if="isCreate">{{ $trans('New entry') }}</span>
          <span v-else>{{ $trans('Edit entry') }}</span>
        </h3>
        <BButton-toolbar>
          <BButton class="btn btn-secondary" type="button" variant="secondary" @click="form.cancelForm">
            {{ $trans('Cancel') }}
          </BButton>
          <BButton
            class="btn btn-primary"
            type="button"
            variant="primary"
            :disabled="form.buttonDisabled.value"
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
            <b-row v-if="isCreate">
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
                  <BFormInput id="purchaseorder-entry-order-id" :model-value="orderInfo.id" readonly size="sm" />
                </BFormGroup>
              </b-col>
              <b-col cols="3" role="group">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Supplier')"
                  label-for="purchaseorder-entry-supplier"
                >
                  <BFormInput id="purchaseorder-entry-supplier" :model-value="orderInfo.supplier" readonly size="sm" />
                </BFormGroup>
              </b-col>
              <template v-if="isCreate">
                <b-col cols="3" role="group">
                  <BFormGroup
                    label-size="sm"
                    :label="$trans('City')"
                    label-for="purchaseorder-entry-city"
                  >
                    <BFormInput id="purchaseorder-entry-city" :model-value="orderInfo.city" readonly size="sm" />
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
                      :model-value="orderInfo.expectedEntryDate"
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
              </template>
            </b-row>

            <EntryRowsPanel
              v-if="isCreate"
              :staging="staging"
              :stock-locations="stockLocations"
              :submitted="form.submitClicked.value"
            />
            <EntryFields
              v-else
              v-model="form.values.value"
              :stock-locations="stockLocations"
              :errors="form.errors.value"
              :submitted="form.submitClicked.value"
            />
          </b-form>
        </div>
      </b-overlay>
    </div>
  </div>
</template>

<script setup lang="ts">
import VueMultiselect from 'vue-multiselect'

import { useResourceForm } from '@/features/forms'
import EntryFields from './EntryFields.vue'
import EntryRowsPanel from './EntryRowsPanel.vue'
import {
  emptyEntry,
  entryErrors,
  entryFromRecord,
  parseEntryPatch,
  type EntryFieldErrors,
  type EntryValues,
} from './schemas'
import { useEntryRows, useStockLocations } from './use-entry-rows'

/**
 * Receiving a purchase order: the create books in the whole order's entries
 * at once, the edit changes one stored entry.
 *
 * The skeleton - the pk split, the entry read, the toasts, the guards and the
 * exit - is `useResourceForm`'s, wired by hand rather than through a resource
 * because the create is not the entry resource's: it posts the staged rows to
 * the bulk endpoint as one atomic request, where the edit PATCHes the entry.
 * The staged rows are `useEntryRows`'; a create with none stages nothing to
 * send and goes back without a request or a toast.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`. A create has none. */
  pk?: string | number | null
}>(), {
  pk: null,
})

const router = useRouter()

const { stockLocations, isLoading: locationsLoading } = useStockLocations()
const staging = useEntryRows(() => stockLocations.value)

const form = useResourceForm<EntryValues, Api.InventoryPurchaseorderEntry.Record, ReturnType<typeof staging.bulkBody> | ReturnType<typeof parseEntryPatch>, EntryFieldErrors>({
  pk: () => props.pk,
  retrieve: (id) => Api.InventoryPurchaseorderEntry.retrieveOptions(id),
  create: Api.InventoryPurchaseorderEntryBulk.create.mutation(),
  update: Api.InventoryPurchaseorderEntry.update.mutation(),
  // A booked-in entry moves the order's counts and its materials' entries too.
  invalidate: async (queryClient) => {
    await Promise.all([
      Api.InventoryPurchaseorderEntry.invalidate(queryClient),
      Api.InventoryPurchaseorder.invalidate(queryClient),
      Api.InventoryPurchaseorderMaterial.invalidate(queryClient),
    ])
  },
  empty: emptyEntry,
  fromRecord: entryFromRecord,
  // The create validates nothing: the rows were checked as they were added.
  validate: (values, context) => (context.isCreate ? {} : entryErrors(values)),
  parse: (values, context) => (context.isCreate ? staging.bulkBody() : parseEntryPatch(values)),
  copy: {
    fetchError: $trans('Error fetching entry'),
    created: $trans('Created'),
    createdDetail: $trans('Entry has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Entry has been updated'),
    createError: $trans('Error creating entry'),
    updateError: $trans('Error updating entry'),
  },
})

const { isCreate, record } = form
const isLoading = computed(() => form.isLoading.value || staging.isLoading.value || locationsLoading.value)

// The order the entries are for: the picked one on a create, the stored entry's on an edit.
const orderInfo = computed(() => {
  const picked = staging.selectedOrder.value
  if (isCreate.value) {
    return {
      id: picked?.purchase_order_id ?? '',
      supplier: picked?.order_name ?? '',
      city: picked?.order_city ?? '',
      expectedEntryDate: picked?.expected_entry_date ?? '',
    }
  }
  return {id: record.value?.order_id ?? '', supplier: record.value?.supplier ?? '', city: '', expectedEntryDate: ''}
})

// The label carries the order's own numbers, so it is a literal, not translated.
const purchaseOrderLabel = (order: Api.PurchaseOrderList) =>
  `${order.purchase_order_id} - ${order.order_name}, ${order.order_city} (materials: ${order.num_materials})`

async function submit() {
  if (isCreate.value && staging.rows.value.length === 0) {
    router.go(-1)
    return
  }
  await form.submitForm()
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
