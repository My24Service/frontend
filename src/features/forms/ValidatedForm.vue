<template>
  <slot />
</template>

<script setup lang="ts" generic="TValues extends object">
import {
  provideValidatedForm,
  type FieldValue,
  type FieldLabels,
  type ValidatedFormContext,
} from './validated-form-context'
import { requiredMessage, type FieldMessages } from './validation'

/**
 * The form the fields in its slot belong to. It renders only that slot — every
 * b-row, b-col and widget stays where the view put it — and hands the fields the
 * four facts each of them would otherwise repeat: the id prefix, the values
 * object, the errors, the copy.
 *
 *   <ValidatedForm name="member" v-model="member" :errors="errors"
 *                  :messages="FIELD_MESSAGES" :labels="FIELD_LABELS"
 *                  :submitted="submitClicked">
 *     <ValidatedFormField name="address" />
 *   </ValidatedForm>
 */
const props = defineProps<{
  /** Prefixes every field id. Omitted when the ids carry no prefix. */
  name?: string
  /**
   * The values' path on the enclosing form. A form that models a sub-object —
   * the register form's `student_user` — sets it, because `fieldErrors` keys an
   * error by the field's whole path (`student_user.mobile`), and the nested
   * form's fields are named relative to the sub-object.
   */
  path?: string
  /**
   * The form's errors, keyed by the field's path. A nested form's keys carry
   * the `path` prefix; a top-level form's are the field names themselves.
   */
  errors?: Partial<Record<string, string | undefined>>
  /** The form's FIELD_MESSAGES: the copy shown under each field. */
  messages?: FieldMessages<keyof TValues & string>
  /** The form's FIELD_LABELS: what each field is called. */
  labels?: FieldLabels<keyof TValues & string>
  /** True once the form has been submitted at least once. */
  submitted?: boolean
}>()

const values = defineModel<TValues>({ required: true })

// A form's values are its own type — `student_user` nests — so this is the one
// place that reads them as a plain bag of fields.
const bag = computed(() => values.value as unknown as Record<string, FieldValue>)

provideValidatedForm({
  get name() {
    return props.name ?? ''
  },
  idOf: (field) => (props.name ? props.name + '_' + field : field),
  valueOf: (field) => bag.value[field],
  setValue: (field, value) => {
    bag.value[field] = value
  },
  errorOf: (field) => props.errors?.[props.path ? `${props.path}.${field}` : field],
  messageOf: (field) => {
    const message = props.messages?.[field as keyof TValues & string]
    if (typeof message === 'function') return message()
    // With no copy of its own, a field's placeholder is its required line.
    const label = props.labels?.[field as keyof TValues & string]
    return label ? requiredMessage(label()) : undefined
  },
  labelOf: (field) => props.labels?.[field as keyof TValues & string]?.() ?? field,
  hasField: (field) => Object.prototype.hasOwnProperty.call(values.value, field),
  get submitted() {
    return props.submitted ?? false
  },
} satisfies ValidatedFormContext)
</script>
