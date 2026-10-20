
<template>
  <div class="panel col-1-3">
    <h6>{{ $trans('Supplier') }}</h6>
    <b-row v-if="isCreate">
      <b-col
        cols="6"
        role="group"
      >
        <BFormGroup
          label-size="sm"
          label-class="form-group-no-bottom"
          :label="$trans('Search suppliers')"
          label-for="purchaseorder-supplier-search"
        >
          <VueMultiselect
            id="purchaseorder-supplier-search"
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
            @select="(option: Api.SupplierAutocomplete) => emit('select-supplier', option)"
          >
            <template #noResult>
              {{ $trans('Oops! No elements found. Consider changing the search query.') }}
            </template>
          </VueMultiselect>
        </BFormGroup>
      </b-col>
      <b-col
        cols="6"
        role="group"
      >
        <BFormGroup
          label-size="sm"
          label-class="form-group-no-bottom"
          :label="$trans('Search reservations')"
          label-for="purchaseorder-reservation-search"
        >
          <VueMultiselect
            id="purchaseorder-reservation-search"
            track-by="id"
            :placeholder="$trans('Type to search')"
            open-direction="bottom"
            :options="reservationOptions"
            :multiple="false"
            :loading="searchingReservations"
            :internal-search="false"
            :clear-on-select="true"
            :close-on-select="true"
            :options-limit="30"
            :limit="10"
            :max-height="600"
            :show-no-results="false"
            :hide-selected="true"
            :custom-label="reservationLabel"
            @search-change="(value: string) => { reservationTerm = value }"
            @select="(option: Api.SupplierReservationAutocomplete) => emit('select-reservation', option)"
          >
            <template #noResult>
              {{ $trans('Oops! No elements found. Consider changing the search query.') }}
            </template>
          </VueMultiselect>
        </BFormGroup>
      </b-col>
    </b-row>

    <ValidatedForm
      v-model="values"
      name="purchaseorder"
      :errors="errors"
      :labels="FIELD_LABELS"
      :submitted="submitted"
    >
      <!-- The copy of the supplier's details is read-only: they change by
           picking another supplier, so a missing one is reported on each. -->
      <ValidatedFormField
        name="order_name"
        label-cols="3"
        readonly
        :error="errors.supplier"
      />
      <ValidatedFormField
        name="order_address"
        label-cols="3"
        readonly
        :error="errors.supplier"
      />
      <ValidatedFormField
        name="order_postal"
        label-cols="3"
        readonly
        :error="errors.supplier"
      />
      <ValidatedFormField
        name="order_city"
        label-cols="3"
        readonly
        :error="errors.supplier"
      />
      <ValidatedFormField
        name="order_country_code"
        label-cols="3"
        readonly
        :error="errors.supplier"
      />
      <ValidatedFormField
        name="order_reference"
        label-cols="3"
      />
      <ValidatedFormField
        name="order_mobile"
        label-cols="3"
      />
      <ValidatedFormField
        name="order_tel"
        label-cols="3"
      />

      <BFormGroup
        label-size="sm"
        label-cols="3"
        :label="$trans('Expected entry date')"
        label-for="expected_entry_date"
      >
        <VueDatePicker
          id="expected_entry_date"
          v-model="values.expected_entry_date"
          size="sm"
          class="p-sm-0"
          :placeholder="$trans('Choose a date')"
          :state="submitted ? !errors.expected_entry_date : null"
          :locale="nl"
          auto-apply
          arrow-navigation
          :formats="{ input: 'dd/MM/yyyy' }"
        />
        <b-form-invalid-feedback :state="submitted ? !errors.expected_entry_date : null">
          {{ errors.expected_entry_date }}
        </b-form-invalid-feedback>
      </BFormGroup>

      <hr>

      <ValidatedFormField
        name="order_contact"
        label-cols="3"
        textarea
        rows="2"
      />
      <ValidatedFormField
        name="description"
        label-cols="3"
        textarea
        rows="2"
      />
      <ValidatedFormField
        name="supplier_remarks"
        label-cols="3"
        textarea
        rows="2"
      />
    </ValidatedForm>
  </div>
</template>

<script setup lang="ts">
import { nl } from 'date-fns/locale'
import VueMultiselect from 'vue-multiselect'

import { useSearch, ValidatedForm, ValidatedFormField } from '@/features/forms'
import { FIELD_LABELS, type PurchaseOrderFieldErrors, type PurchaseOrderFormValues } from './schemas'

/**
 * Who the order is placed with: a supplier (or a reservation, which brings its
 * supplier and products along) searched and picked, the copy of the supplier's
 * address that fills in, and the contact fields, which stay editable. What a
 * pick does to the order is the form's to decide, so it is only announced.
 */
defineProps<{
  errors: PurchaseOrderFieldErrors
  submitted: boolean
  /** Only a new order picks its supplier; an edit keeps the one it has. */
  isCreate: boolean
}>()

const emit = defineEmits<{
  (event: 'select-supplier', supplier: Api.SupplierAutocomplete): void
  (event: 'select-reservation', reservation: Api.SupplierReservationAutocomplete): void
}>()

const values = defineModel<PurchaseOrderFormValues>({required: true})

const {term: supplierTerm, options: supplierOptions, loading: searchingSuppliers} = useSearch(
  (q) => Api.InventorySupplierAutocomplete.list.options({query: {q}}),
  () => true,
  $trans('Error fetching suppliers'),
  (found) => found,
)

const {term: reservationTerm, options: reservationOptions, loading: searchingReservations} = useSearch(
  (q) => Api.InventorySupplierReservationAutocomplete.list.options({query: {q}}),
  () => true,
  $trans('Error searching reservations'),
  (found) => found,
)

const supplierLabel = ({name, city}: {name?: string | null; city?: string | null}) => `${name} - ${city}`
const reservationLabel = ({supplier}: {supplier: {name?: string | null}}) => `${supplier.name}`
</script>
