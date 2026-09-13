<template>
  <div class="expiry-condition">
    <h6>{{ $trans('Expiry condition') }}</h6>
    <b-row>
      <b-col cols="4" role="group">
        <BFormGroup
          label-size="sm"
          :label="$trans('field')"
          label-for="statuscode_num_days_model_field"
        >
          <BFormInput
            id="statuscode_num_days_model_field"
            size="sm"
            :model-value="modelField"
            @update:model-value="$emit('update:modelField', $event)"
          />
        </BFormGroup>
      </b-col>
      <b-col cols="4" role="group">
        <BFormGroup
          label-size="sm"
          :label="$trans('operator')"
          label-for="statuscode_num_days_operator"
        >
          <BFormSelect
            id="statuscode_num_days_operator"
            size="sm"
            :model-value="operator"
            :options="OPERATORS"
            @update:model-value="$emit('update:operator', $event)"
          />
        </BFormGroup>
      </b-col>
      <b-col cols="4" role="group">
        <BFormGroup
          label-size="sm"
          :label="$trans('Number of days')"
          label-for="statuscode_num_days"
        >
          <BFormInput
            id="statuscode_num_days"
            type="number"
            size="sm"
            :model-value="numDays"
            :state="submitted ? !error : null"
            @update:model-value="$emit('update:numDays', $event)"
          />
          <b-form-invalid-feedback :state="submitted ? !error : null">
            {{ error || $trans('Please enter a valid integer') }}
          </b-form-invalid-feedback>
        </BFormGroup>
      </b-col>
    </b-row>
  </div>
</template>

<script lang="ts" setup>
import type { NumDaysOperatorEnum } from '@/api/types.gen'
import { vNumDaysOperatorEnum } from '@/api/valibot.gen'
import { $trans } from '@/services/i18n'

/**
 * A quotation statuscode's expiry condition: "`num_days` after
 * `num_days_model_field`, compared with `num_days_operator`". Three fields
 * of the statuscode form, bound to the form's own state — the legacy
 * component kept a copy and emitted it on every keystroke.
 */
defineProps<{
  numDays: number | string | null | undefined
  operator: NumDaysOperatorEnum | undefined
  modelField: string | null | undefined
  error?: string
  submitted?: boolean
}>()

defineEmits<{
  (event: 'update:numDays', value: unknown): void
  (event: 'update:operator', value: unknown): void
  (event: 'update:modelField', value: unknown): void
}>()

const OPERATORS = vNumDaysOperatorEnum.options
</script>

<style scoped>
h6 {
  margin-top: 2rem;
}
</style>
