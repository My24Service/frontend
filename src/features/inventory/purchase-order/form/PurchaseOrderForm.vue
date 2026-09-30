
<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiFileEarmarkMedical />
          <span
            class="backlink"
            @click="cancelForm"
          >{{ $trans('Purchase orders') }}</span> /
          <span v-if="isCreate">{{ $trans('New purchase order') }}</span>
          <span v-else>{{ $trans('Edit purchase order') }}</span>
        </h3>
        <div class="flex-columns">
          <BButton
            class="btn btn-secondary"
            type="button"
            variant="secondary"
            @click="cancelForm"
          >
            {{ $trans('Cancel') }}
          </BButton>
          <BButton
            :disabled="buttonDisabled"
            class="btn btn-primary"
            type="button"
            variant="primary"
            @click="submitForm"
          >
            {{ $trans('Submit') }}
          </BButton>
        </div>
      </div>
    </header>
    <div class="page-detail">
      <b-overlay
        :show="isLoading"
        rounded="sm"
      >
        <b-form class="flex-columns">
          <PurchaseOrderSupplierFields
            v-model="values"
            :errors="errors"
            :submitted="submitClicked"
            :is-create="isCreate"
            @select-supplier="selectSupplier"
            @select-reservation="selectReservation"
          />
          <MaterialRowsPanel
            :staging="materialRows"
            :supplier-chosen="values.supplier !== null"
            :placeholder="$trans('Select a supplier or reservation')"
          />
        </b-form>
      </b-overlay>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useResourceForm } from '@/features/forms'
import { MaterialRowsPanel, newRowFromRecord, rowFromRecord, useAutocompleteProductSearch, useMaterialRows } from '../../material-rows'
import PurchaseOrderSupplierFields from './PurchaseOrderSupplierFields.vue'
import {
  applySupplier,
  emptyPurchaseOrder,
  parsePurchaseOrder,
  purchaseOrderFromRecord,
  validatePurchaseOrder,
  type PurchaseOrderFieldErrors,
  type PurchaseOrderFormValues,
  type PurchaseOrderWithMaterialsBody,
} from './schemas'

const props = withDefaults(defineProps<{
  pk?: string | number | null
  /**
   * Supplied by the `purchaseorder-add-from-reservation` route
   * (`/inventory/purchaseorders/from/reservation/:reservation_pk`). Nothing
   * reads it yet, so that route renders an ordinary empty create form and the
   * reservation is ignored, as it always was. Declared so it stays a prop
   * rather than falling through to `$attrs` onto the root element.
   */
  reservation_pk?: string | number | null
}>(), {
  pk: null,
  reservation_pk: null,
})

const {
  values,
  errors,
  submitClicked,
  isCreate,
  record,
  isLoading,
  buttonDisabled,
  submitForm,
  cancelForm,
} = useResourceForm<
  PurchaseOrderFormValues,
  Api.PurchaseOrderDetail,
  PurchaseOrderWithMaterialsBody,
  PurchaseOrderFieldErrors
>({
  pk: () => props.pk,
  // The pair is written by hand: the order and its materials are one request,
  // and a resource's own `create`/`update` are the plain order endpoints, which
  // carry no materials. The create is the with-materials action, the update
  // the resource's with-materials PATCH; neither is a member of the resource
  // `useResourceForm` would otherwise wire.
  retrieve: (id) => Api.InventoryPurchaseorder.retrieveOptions(id),
  create: Api.InventoryPurchaseorderWithMaterials.create.mutation(),
  update: Api.InventoryPurchaseorder.extras.withMaterialsPartialUpdate.mutation(),
  invalidate: (queryClient) => Api.InventoryPurchaseorder.invalidate(queryClient),
  empty: emptyPurchaseOrder,
  fromRecord: purchaseOrderFromRecord,
  validate: validatePurchaseOrder,
  parse: (formValues, context) => parsePurchaseOrder(formValues, materialRows.materialsBody(), context),
  copy: {
    fetchError: $trans('Error fetching purchase order'),
    created: $trans('Created'),
    createdDetail: $trans('Purchase order has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Purchase order has been updated'),
    createError: $trans('Error creating purchase order'),
    updateError: $trans('Error updating purchase order'),
  },
})

const materialRows = useMaterialRows({products: useAutocompleteProductSearch(() => values.value.supplier)})

// The stored products come with the order. The set is the form's from then on:
// what is added, edited and removed is sent back whole on the save.
watch(record, (stored) => {
  if (stored) materialRows.setRows(stored.materials.map(rowFromRecord))
}, {immediate: true})

function selectSupplier(supplier: Api.SupplierAutocomplete) {
  applySupplier(values.value, supplier)
  // Products are supplier-specific, so anything picked for the previous
  // supplier no longer applies.
  materialRows.setRows([])
}

function selectReservation(reservation: Api.SupplierReservationAutocomplete) {
  values.value.supplier_reservation = reservation.id
  applySupplier(values.value, reservation.supplier)
  // The reservation's products become new rows of this order. Its own rows'
  // ids are not this order's to address, so none of them comes along.
  materialRows.setRows(reservation.products.map(newRowFromRecord))
}
</script>
