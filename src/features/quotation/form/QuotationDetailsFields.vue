<template>
  <div>
    <h5>{{ $trans('Details') }}</h5>

    <div v-if="!isView">
      <BFormGroup :label="$trans('ID')" label-for="quotation_quotation_id" label-cols="3">
        <BFormInput disabled :model-value="values.quotation_id ?? ''" id="quotation_quotation_id" size="sm" />
      </BFormGroup>
      <ValidatedFormField name="name" label-cols="3" />
      <ValidatedFormField name="quotation_reference" label-cols="3" />
      <ValidatedFormField name="quotation_expire_days" type="number" label-cols="3" />
      <ValidatedFormField name="description" textarea rows="1" label-cols="3" />

      <footer class="modal-footer" v-if="!hasRecord">
        <i>{{ $trans('Save quotation to start adding chapters') }}</i>
      </footer>
    </div>
    <b-container v-else>
      <b-row v-for="row in viewRows" :key="row.label">
        <b-col cols="4">{{ row.label }}</b-col>
        <b-col cols="8"><p class="value">{{ row.value }}</p></b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script setup lang="ts">
import { ValidatedFormField } from '@/features/forms'
import type { QuotationFormValues } from './schemas'

/** The quotation's own details: editable, or read-only rows on the view. Rendered inside the form's `ValidatedForm`. */
const props = withDefaults(defineProps<{
  values: QuotationFormValues
  hasRecord: boolean
  isView?: boolean
}>(), {isView: false})

const orDash = (value: string | number | null | undefined) => value === null || value === undefined || value === '' ? '-' : value

const viewRows = computed(() => [
  {label: $trans('Name'), value: orDash(props.values.name)},
  {label: $trans('Reference'), value: orDash(props.values.quotation_reference)},
  {label: $trans('Expiry days'), value: orDash(props.values.quotation_expire_days)},
  {label: $trans('Description'), value: orDash(props.values.description)},
])
</script>

<style scoped>
p.value {
  width: 100%;
  border-bottom: 1px dotted gray;
}
</style>
