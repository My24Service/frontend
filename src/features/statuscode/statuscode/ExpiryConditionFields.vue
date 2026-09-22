<template>
  <div class="expiry-condition">
    <h6>{{ heading }}</h6>
    <p
      v-if="codeType === 'order'"
      class="text-muted small"
    >
      {{ $trans('Each morning, every order whose date falls in this window gets this statuscode, once. Attach an email action to send a reminder.') }}
    </p>
    <b-row>
      <b-col cols="4" role="group">
        <BFormGroup
          label-size="sm"
          :label="$trans('field')"
          label-for="statuscode_num_days_model_field"
        >
          <BFormSelect
            v-if="codeType === 'order'"
            id="statuscode_num_days_model_field"
            size="sm"
            :model-value="modelField"
            :options="ORDER_FIELD_OPTIONS"
            @update:model-value="$emit('update:modelField', $event)"
          />
          <BFormInput
            v-else
            id="statuscode_num_days_model_field"
            size="sm"
            :model-value="modelField"
            @update:model-value="onModelFieldInput($event)"
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
            {{ error || $trans('Please enter a whole number') }}
          </b-form-invalid-feedback>
        </BFormGroup>
      </b-col>
    </b-row>
  </div>
</template>

<script lang="ts" setup>
import type { NumDaysOperatorEnum } from '@/api/types.gen'
import { vNumDaysOperatorEnum } from '@/api/valibot.gen'
import type { CodeType } from '../code-types'
import { ORDER_DATE_TRIGGER_FIELDS } from './schemas'

/**
 * A statuscode's date trigger: "`num_days` from `num_days_model_field`,
 * compared with `num_days_operator`". For an order that is when the backend
 * sets the statuscode on the order (a reminder "14 days before
 * `start_date`"), so the field is a pick from the order's date fields; for a
 * quotation it is the expiry condition, with the field typed. Three fields
 * of the statuscode form, bound to the form's own state — the legacy
 * component kept a copy and emitted it on every keystroke.
 */
const props = defineProps<{
  codeType: CodeType
  numDays: number | string | null | undefined
  operator: NumDaysOperatorEnum | undefined
  modelField: string | null | undefined
  error?: string
  submitted?: boolean
}>()

const emit = defineEmits<{
  /** What the number input typed: the integer the wire wants, or as typed so the schema can refuse it. */
  (event: 'update:numDays', value: number | string | null): void
  (event: 'update:operator', value: NumDaysOperatorEnum | undefined): void
  (event: 'update:modelField', value: string | null | undefined): void
}>()

/**
 * What the free-typed field produced. The input types a string; its declared
 * type is looser than that, so the number half is read as one.
 */
function onModelFieldInput(value: string | number | null): void {
  emit('update:modelField', typeof value === 'number' ? String(value) : value)
}

const OPERATORS = vNumDaysOperatorEnum.options

const FIELD_TEXTS: Record<(typeof ORDER_DATE_TRIGGER_FIELDS)[number], () => string> = {
  start_date: () => $trans('Start date'),
  end_date: () => $trans('End date'),
}

const ORDER_FIELD_OPTIONS = [
  { value: null, text: '-' },
  ...ORDER_DATE_TRIGGER_FIELDS.map((field) => ({ value: field, text: FIELD_TEXTS[field]() })),
]

const heading = computed(() => (props.codeType === 'order' ? $trans('Date trigger') : $trans('Expiry condition')))
</script>

<style scoped>
h6 {
  margin-top: 2rem;
}
</style>
