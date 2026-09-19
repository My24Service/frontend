<template>
  <div class='panel col-1-3'>
    <h6>{{ $trans('Legal & Financial') }}</h6>
    <BFormGroup
      label-size="sm"
      label-cols="6"
      v-bind:label="$trans('Maintenance contract')"
      label-for="customer_maintenance_contract"
    >
      <BFormTextarea
        id="customer_maintenance_contract"
        v-model="values.maintenance_contract"
        rows="5"
      ></BFormTextarea>
    </BFormGroup>
    <BFormGroup
      label-cols="6"
      label-size="sm"
      v-bind:label="$trans('Standard hours/mins.')"
      label-for="customer_standard_hours_hour"
    >
      <b-input-group>

        <BFormInput
          id="customer_standard_hours_hour"
          size="sm"
          v-model="standardHoursHour"
          type="number"
        ></BFormInput>

        <template #append>
          <BFormSelect v-model="values.standard_hours_minute" :options="minutes" size="sm"></BFormSelect>
        </template>
      </b-input-group>
    </BFormGroup>

    <BFormGroup
      label-size="sm"
      label-cols="6"
      v-bind:label="$trans('Products without tax?')"
      label-for="customer_products_without_tax"
    >
      <BFormCheckbox
        id="customer_products_without_tax"
        v-model="values.products_without_tax"
      >
      </BFormCheckbox>
    </BFormGroup>

    <BFormGroup
      label-size="sm"
      label-cols="6"
      v-bind:label="$trans('Hourly rate engineer')"
      label-for="customer_hourly_rate_engineer"
    >
      <PriceInput
        v-model="values.hourly_rate_engineer"
        :currency="values.hourly_rate_engineer_currency"
        :allow-empty="isCreate"
        @priceChanged="(dinero) => applyPrice('hourly_rate_engineer', dinero)"
      />
    </BFormGroup>

    <BFormGroup
      label-size="sm"
      label-cols="6"
      v-bind:label="$trans('Call out costs')"
      label-for="customer_hourly_rate_engineer"
    >
      <PriceInput
        v-model="values.call_out_costs"
        :currency="values.call_out_costs_currency"
        :allow-empty="isCreate"
        @priceChanged="(dinero) => applyPrice('call_out_costs', dinero)"
      />
    </BFormGroup>

    <DocumentsComponent
      v-if="values.id"
      :customer="values"
      :is-view="false"
    />
  </div>
</template>

<script lang="ts" setup>
import type Dinero from 'dinero.js'

import DocumentsComponent from '../document/DocumentPanel.vue'
import { $trans } from '@/services/i18n'
import type { CurrencyEnum } from '@/api/types.gen'
import type { CustomerFormValues } from './schemas'

const values = defineModel<CustomerFormValues>('values', { required: true })

const props = defineProps<{
  isCreate: boolean
}>()

const minutes = [
  {value: 0, text: '00'},
  {value: 15, text: '15'},
  {value: 30, text: '30'},
  {value: 45, text: '45'},
]

const standardHoursHour = computed({
  get: () => values.value.standard_hours_hour,
  set: (value: string | number | null) => {
    const parsed = Number(value)
    values.value.standard_hours_hour = value === '' || value === null || Number.isNaN(parsed)
      ? undefined
      : parsed
  },
})

function applyPrice(field: 'hourly_rate_engineer' | 'call_out_costs', dinero: Dinero.Dinero) {
  values.value[field] = dinero.toFormat('0.00')
  values.value[`${field}_currency` as 'hourly_rate_engineer_currency' | 'call_out_costs_currency'] =
    dinero.getCurrency() as CurrencyEnum
}
</script>
