<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiFileLock />
          <span
            class="backlink"
            @click="cancelForm"
          >{{ $trans('Reservations') }}</span> /
          <span v-if="isCreate">{{ $trans('New reservation') }}</span>
          {{ pk }} <span
            v-if="!isCreate"
            class="dimmed"
          >{{ $trans('edit') }}</span>
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
            @click="submit"
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
          <div class="panel col-1-3">
            <h6>{{ $trans('Supplier') }}</h6>
            <fieldset>
              <BFormGroup
                label-size="sm"
                label-cols="12"
                label-cols-md="3"
                :label="$trans('Search supplier')"
                label-for="supplier-reservation-supplier-search"
              >
                <VueMultiselect
                  id="supplier-reservation-supplier-search"
                  track-by="id"
                  :placeholder="$trans('Type to search')"
                  open-direction="bottom"
                  :options="supplierOptions"
                  :multiple="false"
                  :loading="searchingSuppliers"
                  :internal-search="false"
                  :clear-on-select="true"
                  :close-on-select="true"
                  :options-limit="30"
                  :limit="10"
                  :max-height="600"
                  :show-no-results="false"
                  :hide-selected="true"
                  :custom-label="supplierLabel"
                  @search-change="(value: string) => { supplierTerm = value }"
                  @select="selectSupplier"
                >
                  <template #noResult>
                    {{ $trans('Oops! No elements found. Consider changing the search query.') }}
                  </template>
                </VueMultiselect>
              </BFormGroup>

              <!-- The chosen supplier's details are read-only: they change by
                   picking another supplier, so a missing one is reported on each. -->
              <BFormGroup
                v-for="field in supplierFields"
                :key="field.key"
                label-size="sm"
                label-cols="12"
                label-cols-md="3"
                :label="field.label"
                :label-for="`supplier-reservation-supplier-${field.key}`"
              >
                <BFormInput
                  :id="`supplier-reservation-supplier-${field.key}`"
                  :model-value="selectedSupplier?.[field.key]"
                  readonly
                  size="sm"
                  :state="submitClicked ? !errors.supplier : null"
                />
                <b-form-invalid-feedback :state="submitClicked ? !errors.supplier : null">
                  {{ errors.supplier }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </fieldset>
          </div>
          <MaterialRowsPanel
            :staging="materialRows"
            :products="products"
            :supplier-chosen="values.supplier !== null"
            :placeholder="$trans('Select a supplier')"
          />
        </b-form>
      </b-overlay>
    </div>
  </div>
</template>

<script setup lang="ts">
import VueMultiselect from 'vue-multiselect'

import { useResourceForm, useSearch } from '@/features/forms'
import { MaterialRowsPanel, rowFromRecord, useMaterialRows, type MaterialOption } from '../material-rows'
import {
  emptyReservation,
  materialRowSchema,
  parseReservation,
  reservationFromRecord,
  validateReservation,
  type ReservationFieldErrors,
  type ReservationFormValues,
  type ReservationWithMaterialsBody,
} from './schemas'

const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
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
  ReservationFormValues,
  Api.SupplierReservation,
  ReservationWithMaterialsBody,
  ReservationFieldErrors
>({
  pk: () => props.pk,
  // Written by hand for the reason the purchase order form is: the reservation
  // and its products are one request, and neither half is a member of the
  // resource `useResourceForm` would otherwise wire.
  retrieve: (id) => Api.InventorySupplierReservation.retrieveOptions(id),
  create: Api.InventorySupplierReservationWithMaterials.create.mutation(),
  update: Api.InventorySupplierReservation.extras.withMaterialsPartialUpdate.mutation(),
  invalidate: (queryClient) => Api.InventorySupplierReservation.invalidate(queryClient),
  empty: emptyReservation,
  fromRecord: reservationFromRecord,
  validate: validateReservation,
  parse: (formValues, context) => parseReservation(formValues, materialRows.materialsBody(), context),
  copy: {
    fetchError: $trans('Error fetching reservation'),
    created: $trans('Created'),
    createdDetail: $trans('Reservation has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Reservation has been updated'),
    createError: $trans('Error creating reservation'),
    updateError: $trans('Error updating reservation'),
  },
})

const materialRows = useMaterialRows(materialRowSchema)

/**
 * What the open row editor shows is what the user means to save: the legacy
 * editor was bound to its row. An invalid edit stops the save and says why.
 */
function submit() {
  if (buttonDisabled.value) return
  if (materialRows.isEditing.value && !materialRows.commitEdit()) return
  void submitForm()
}

/**
 * The product search: the supplier's catalogue itself, as the legacy
 * reservation form searched it. Not the autocomplete the purchase order form
 * reads, which answers only materials with a price row for this year, and so
 * would hide part of the catalogue from a reservation.
 */
const products = useSearch(
  (q) => Api.InventoryMaterial.list.options({
    query: {q, supplier_relation: values.value.supplier ?? undefined, page: 1},
  }),
  () => values.value.supplier !== null,
  $trans('Error fetching products'),
  (data): MaterialOption[] => data.results ?? [],
)

/** The supplier shown in the read-only block: the stored one, or the one just picked. */
const selectedSupplier = ref<Partial<Record<'name' | 'address' | 'city' | 'email', string | null>> | null>(null)

// The stored products, and the stored supplier they belong to, come with the
// reservation. The set is the form's from then on.
watch(record, (stored) => {
  if (!stored) return
  selectedSupplier.value = stored.supplier_view
  materialRows.setRows(stored.materials.map(rowFromRecord))
}, {immediate: true})

const {term: supplierTerm, options: supplierOptions, loading: searchingSuppliers} = useSearch(
  (q) => Api.InventorySupplierAutocomplete.list.options({query: {q}}),
  () => true,
  $trans('Error fetching suppliers'),
  (found) => found,
)

const supplierFields = [
  {key: 'name', label: $trans('Supplier')},
  {key: 'address', label: $trans('Address')},
  {key: 'city', label: $trans('City')},
  {key: 'email', label: $trans('Email')},
] as const

const supplierLabel = ({name, city}: {name?: string | null; city?: string | null}) => `${name}, - ${city}`

function selectSupplier(supplier: Api.SupplierAutocomplete) {
  values.value.supplier = supplier.id
  selectedSupplier.value = supplier
  // Products are supplier-specific, so anything picked for the previous
  // supplier no longer applies.
  materialRows.setRows([])
}
</script>
