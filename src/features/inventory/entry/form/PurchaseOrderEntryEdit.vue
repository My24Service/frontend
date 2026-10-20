<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiReceipt />
          <span class="backlink" @click="form.cancelForm">{{ $trans('Entries') }}</span> /
          <span>{{ $trans('Edit entry') }}</span>
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
            @click="form.submitForm"
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
              <b-col cols="1" role="group">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Order ID')"
                  label-for="purchaseorder-entry-order-id"
                >
                  <BFormInput id="purchaseorder-entry-order-id" :model-value="record?.order_id ?? ''" readonly size="sm" />
                </BFormGroup>
              </b-col>
              <b-col cols="3" role="group">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Supplier')"
                  label-for="purchaseorder-entry-supplier"
                >
                  <BFormInput id="purchaseorder-entry-supplier" :model-value="record?.supplier ?? ''" readonly size="sm" />
                </BFormGroup>
              </b-col>
            </b-row>

            <EntryFields
              v-model="form.values.value"
              :stock-locations="stockLocations"
              :errors="form.errors.value"
              :show-errors="form.submitClicked.value"
            />
          </b-form>
        </div>
      </b-overlay>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useResourceForm } from '@/features/forms'
import { invalidateEntryWrites } from '../invalidation'
import EntryFields from './EntryFields.vue'
import {
  emptyEntry,
  entryErrors,
  entryFromRecord,
  parseEntryPatch,
  type EntryFieldErrors,
  type EntryValues,
} from './schemas'
import { useStockLocations } from './use-stock-locations'

/**
 * Change one stored entry: its amount, date and location. Its order and
 * product show read-only; a stored entry keeps both.
 */
const props = defineProps<{
  /** The route's `:pk`. */
  pk: string | number
}>()

const { stockLocations, isLoading: locationsLoading } = useStockLocations()

const form = useResourceForm<EntryValues, Api.InventoryPurchaseorderEntry.Record, ReturnType<typeof parseEntryPatch>, EntryFieldErrors>({
  pk: () => props.pk,
  resource: Api.InventoryPurchaseorderEntry,
  invalidate: invalidateEntryWrites,
  empty: emptyEntry,
  fromRecord: entryFromRecord,
  validate: entryErrors,
  parse: parseEntryPatch,
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

const { record } = form
const isLoading = computed(() => form.isLoading.value || locationsLoading.value)
</script>
