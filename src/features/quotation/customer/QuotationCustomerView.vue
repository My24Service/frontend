<template>
  <b-container>
    <h6>
      <IBiBuilding></IBiBuilding> {{ $trans('Customer') }}
    </h6>
    <b-row v-for="row in rows" :key="row.label">
      <b-col cols="4">
        {{ row.label }}
      </b-col>
      <b-col cols="8">
        <p class="value">{{ row.value }}</p>
      </b-col>
    </b-row>
  </b-container>
</template>

<script setup lang="ts">
/** The customer fields a quotation carries, read-only; a blank one shows as '-'. */
type QuotationCustomer = Pick<Api.Quotation,
  | 'quotation_name' | 'customer_id' | 'quotation_address' | 'quotation_country_code' | 'quotation_postal'
  | 'quotation_city' | 'quotation_contact' | 'quotation_email' | 'quotation_mobile' | 'quotation_tel'>

const props = defineProps<{
  quotation: QuotationCustomer
}>()

const orDash = (value: string | null | undefined) => value || '-'

const rows = computed(() => {
  const quotation = props.quotation
  return [
    {label: $trans('Customer'), value: orDash(quotation.quotation_name)},
    {label: $trans('Customer ID'), value: orDash(quotation.customer_id)},
    {label: $trans('Address'), value: orDash(quotation.quotation_address)},
    {label: $trans('Postal'), value: `${quotation.quotation_country_code ?? ''}-${orDash(quotation.quotation_postal)}`},
    {label: $trans('City'), value: orDash(quotation.quotation_city)},
    {label: $trans('Contacts'), value: orDash(quotation.quotation_contact)},
    {label: $trans('Email'), value: orDash(quotation.quotation_email)},
    {label: $trans('Mobile'), value: orDash(quotation.quotation_mobile)},
    {label: $trans('Phone'), value: orDash(quotation.quotation_tel)},
  ]
})
</script>

<style scoped>
p.value {
  width: 100%;
  border-bottom: 1px dotted gray;
}
</style>
