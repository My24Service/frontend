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

    <DocumentsComponent
      v-if="values.id"
      :customer="values"
      :is-view="false"
    />
  </div>
</template>

<script lang="ts" setup>
import { DocumentPanel as DocumentsComponent } from '@/features/customer/document'
import type { CustomerFormValues } from './schemas'

const values = defineModel<CustomerFormValues>('values', { required: true })

defineProps<{
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
</script>
