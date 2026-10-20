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
/**
 * A quotation statuscode's expiry condition: "`num_days` from
 * `num_days_model_field`, compared with `num_days_operator`", with the field
 * typed. Three fields of the statuscode form, bound to the form's own state —
 * the legacy component kept a copy and emitted it on every keystroke. The
 * order date trigger is on the action form (`../action/DateTriggerFields.vue`).
 */
defineProps<{
  numDays: number | string | null | undefined
  operator: Api.NumDaysOperatorEnum | undefined
  modelField: string | null | undefined
  error?: string
  submitted?: boolean
}>()

const emit = defineEmits<{
  /** What the number input typed: the integer the wire wants, or as typed so the schema can refuse it. */
  (event: 'update:numDays', value: number | string | null): void
  (event: 'update:operator', value: Api.NumDaysOperatorEnum | undefined): void
  (event: 'update:modelField', value: string | null | undefined): void
}>()

/**
 * What the free-typed field produced. The input types a string; its declared
 * type is looser than that, so the number half is read as one.
 */
function onModelFieldInput(value: string | number | null): void {
  emit('update:modelField', typeof value === 'number' ? String(value) : value)
}

const OPERATORS = schemas.vNumDaysOperatorEnum.options
</script>

<style scoped>
h6 {
  margin-top: 2rem;
}
</style>
