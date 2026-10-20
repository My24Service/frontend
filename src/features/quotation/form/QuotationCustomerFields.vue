<template>
  <div>
    <h5>{{ $trans('Customer') }}</h5>
    <BFormGroup
      label-size="sm"
      label-class="p-sm-0"
      :label="$trans('Search existing address')"
      label-for="quotation-customer-search"
    >
      <VueMultiselect
        id="quotation-customer-search"
        track-by="id"
        :placeholder="$trans('Type to search')"
        open-direction="bottom"
        :options="options"
        :multiple="false"
        :loading="loading"
        :internal-search="false"
        :options-limit="30"
        :limit="10"
        :max-height="600"
        :hide-selected="true"
        :custom-label="addressLabel"
        @search-change="(value: string) => { term = value }"
        @select="fillCustomer"
      >
        <template #noResult>{{ $trans('Nothing found.') }}</template>
      </VueMultiselect>
    </BFormGroup>

    <BFormGroup :label="$trans('Customer')" label-for="quotation_quotation_name" label-cols="3">
      <b-input-group>
        <BFormInput
          id="quotation_quotation_name"
          v-model="values.quotation_name"
          :state="state('quotation_name')"
        />
        <BFormInput
          id="quotation_customer_id"
          v-model="values.customer_id"
          readonly
          :title="$trans('Customer ID')"
          style="max-width: 9ch"
          :state="state('customer_id')"
        />
      </b-input-group>
      <b-form-invalid-feedback :state="state('quotation_name') ?? state('customer_id')">
        {{ errors.quotation_name ?? errors.customer_id }}
      </b-form-invalid-feedback>
    </BFormGroup>

    <div v-if="values.customer_id">
      <ValidatedFormField name="quotation_address" label-cols="3" />
      <ValidatedFormField name="quotation_postal" label-cols="3" />
      <BFormGroup :label="$trans('Country')" label-for="quotation_quotation_country_code" label-cols="3">
        <BFormSelect id="quotation_quotation_country_code" v-model="values.quotation_country_code" :options="countries" />
      </BFormGroup>
      <ValidatedFormField name="quotation_city" label-cols="3" />
      <ValidatedFormField name="quotation_contact" label-cols="3" />
      <ValidatedFormField name="quotation_email" label-cols="3" />
      <ValidatedFormField name="quotation_mobile" label-cols="3" />
      <ValidatedFormField name="quotation_tel" label-cols="3" />
    </div>
  </div>
</template>

<script setup lang="ts">
import VueMultiselect from 'vue-multiselect'

import { useSearch, ValidatedFormField } from '@/features/forms'
import type { QuotationFieldErrors, QuotationFormValues } from './schemas'

/**
 * Who the quotation is for: a customer searched and picked, which fills the
 * address block below; the block stays editable, the customer id does not.
 * Rendered inside the form's `ValidatedForm`.
 */
const props = defineProps<{
  errors: QuotationFieldErrors
  submitted: boolean
}>()
const values = defineModel<QuotationFormValues>({required: true})

const { mainStore } = useCommon()
const countries = computed(() => mainStore.getCountries ?? [])

const {term, options, loading} = useSearch(
  (q) => Api.CustomerCustomerAutocomplete.list.options({query: {q}}),
  () => true,
  $trans('Error fetching customers'),
  (rows) => rows,
)

const addressLabel = ({name, address, city}: {name?: string | null; address?: string | null; city?: string | null}) =>
  `${name ?? ''} - ${address ?? ''} - ${city ?? ''}`

function fillCustomer(customer: Api.CustomerAutocomplete) {
  Object.assign(values.value, {
    customer_relation: customer.id,
    customer_id: customer.customer_id ?? null,
    quotation_name: customer.name ?? null,
    quotation_address: customer.address ?? null,
    quotation_city: customer.city ?? null,
    quotation_postal: customer.postal ?? null,
    quotation_country_code: customer.country_code ?? null,
    quotation_tel: customer.tel ?? null,
    quotation_mobile: customer.mobile ?? null,
    quotation_email: customer.email ?? null,
    quotation_contact: customer.contact ?? null,
  })
}

function state(field: keyof QuotationFieldErrors) {
  return props.submitted ? !props.errors[field] : null
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
