<template>
  <div class="date-trigger">
    <h4>{{ $trans('Date trigger') }}</h4>
    <p class="text-muted small">
      {{ $trans('With a date field, this action does not run when the status is set. Instead it runs once, on the first morning the date falls in this window, for every record that has had this status at any time.') }}
    </p>
    <b-row>
      <b-col cols="4" role="group">
        <BFormGroup label-size="sm" :label="$trans('field')" label-for="action_num_days_model_field">
          <BFormSelect
            id="action_num_days_model_field"
            size="sm"
            :model-value="modelField ?? null"
            :options="fieldOptions"
            @update:model-value="$emit('update:modelField', $event)"
          />
        </BFormGroup>
      </b-col>
      <b-col cols="4" role="group">
        <BFormGroup label-size="sm" :label="$trans('operator')" label-for="action_num_days_operator">
          <BFormSelect
            id="action_num_days_operator"
            size="sm"
            :disabled="!modelField"
            :model-value="operator"
            :options="OPERATORS"
            @update:model-value="$emit('update:operator', $event)"
          />
        </BFormGroup>
      </b-col>
      <b-col cols="4" role="group">
        <BFormGroup label-size="sm" :label="$trans('Number of days')" label-for="action_num_days">
          <BFormInput
            id="action_num_days"
            type="number"
            size="sm"
            :disabled="!modelField"
            :model-value="numDays"
            :state="submitted && modelField ? !error : null"
            @update:model-value="$emit('update:numDays', $event)"
          />
          <b-form-invalid-feedback :state="submitted && modelField ? !error : null">
            {{ error || $trans('Please enter a whole number') }}
          </b-form-invalid-feedback>
        </BFormGroup>
      </b-col>
    </b-row>
  </div>
</template>

<script lang="ts" setup>
import type { CodeType } from '../code-types'
import { dateTriggerFieldsFor } from './schemas'

/**
 * An action's date trigger (see `DATE_TRIGGER_FIELDS` in `./schemas`): the
 * date field is a pick from the ones the backend accepts for the code type,
 * "-" meaning the action runs when its status is set, as any other.
 */
const props = defineProps<{
  codeType: CodeType
  numDays: number | string | null | undefined
  operator: Api.NumDaysOperatorEnum | undefined
  modelField: string | null | undefined
  error?: string
  submitted?: boolean
}>()

defineEmits<{
  (event: 'update:numDays', value: number | string | null): void
  (event: 'update:operator', value: Api.NumDaysOperatorEnum | undefined): void
  (event: 'update:modelField', value: string | null): void
}>()

const OPERATORS = schemas.vNumDaysOperatorEnum.options

const FIELD_TEXTS: Record<string, () => string> = {
  start_date: () => $trans('Start date'),
  end_date: () => $trans('End date'),
  definitive_date: () => $trans('Definitive date'),
}

const fieldOptions = computed(() => [
  { value: null, text: '-' },
  ...dateTriggerFieldsFor(props.codeType).map((field) => ({
    value: field,
    text: FIELD_TEXTS[field]?.() ?? field,
  })),
])
</script>

<style scoped>
h4 {
  margin-top: 2rem;
}
</style>
