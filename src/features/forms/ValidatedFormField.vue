<template>
  <BFormGroup
    :label-cols="labelCols"
    label-size="sm"
    :label="label"
    :label-for="id"
  >
    <component
      :is="textarea ? BFormTextarea : BFormInput"
      :id="id"
      :size="textarea ? undefined : 'sm'"
      v-model="value"
      :autofocus="autofocus"
      :readonly="readonly"
      :disabled="disabled"
      :type="type"
      :autocomplete="autocomplete"
      :rows="textarea ? rows : undefined"
      :state="state"
    />
    <!-- Anything the field needs between the input and its feedback: the
         customer id's "generate new" link, a hint, a second control. -->
    <slot />
    <b-form-invalid-feedback
      v-if="hasFeedback"
      :state="state"
    >{{ error || placeholder }}</b-form-invalid-feedback>
  </BFormGroup>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BFormInput, BFormTextarea } from 'bootstrap-vue-next'

import { useValidatedForm, type FieldValue } from './validated-form-context'

/**
 * One field of a form: a label, an input, and the copy under it.
 *
 * Inside a ValidatedForm the field names itself — `<ValidatedFormField name="city" />`
 * — and the form answers for its id, value, error, copy and submitted state. Any
 * prop passed explicitly wins over the form's, which is how the exceptions are
 * said. The name is a prop rather than the tag's `key`, which belongs to Vue's
 * diff and which a `v-for` needs for its own purpose.
 *
 * Outside a form every prop below is passed explicitly, exactly as before.
 */
const props = withDefaults(defineProps<{
  /** The field's name on the form object. The form answers for this name. */
  name?: string
  /** The field's id. Defaults to the form's name and the field's, joined. */
  id?: string
  /** The field's label. Defaults to the form's FIELD_LABELS entry. */
  label?: string
  /** The field's value. Defaults to the form object's own key. */
  modelValue?: FieldValue
  /** The field's error, when there is one. Pass `undefined` before submit. */
  error?: string
  /** The copy shown while the field simply sits empty (FIELD_MESSAGES.x()). */
  placeholder?: string
  /** True once the form has been submitted at least once. */
  submitted?: boolean
  labelCols?: string | number
  textarea?: boolean
  rows?: string | number
  type?: string
  /** The browser's autofill hint, for the one input underneath. */
  autocomplete?: string
  readonly?: boolean
  disabled?: boolean
  autofocus?: boolean
}>(), {
  rows: '5',
  // Spelled out as `undefined` because an absent Boolean prop would otherwise
  // cast to `false`, and the form's own `submitted` could never answer for this
  // field: `false ?? form.submitted` is `false`.
  submitted: undefined,
})

const emit = defineEmits<{(event: 'update:modelValue', value: unknown): void}>()

const form = useValidatedForm()

const named = computed(() => (form === null ? null : props.name ?? null))

if (import.meta.env.DEV && form !== null && named.value !== null && !form.hasField(named.value)) {
  // A field name the form object does not carry would read and write a key
  // nothing else knows.
  console.warn(
    '<ValidatedFormField name="' + named.value + '"> names a field the "'
    + form.name + '" form does not have.',
  )
}

const id = computed(() =>
  props.id ?? (named.value === null ? undefined : form?.idOf(named.value)))

const label = computed(() =>
  props.label ?? (named.value === null ? '' : form?.labelOf(named.value) ?? ''))

const error = computed(() =>
  props.error ?? (named.value === null ? undefined : form?.errorOf(named.value)))

const placeholder = computed(() =>
  props.placeholder ?? (named.value === null ? undefined : form?.messageOf(named.value)))

const submitted = computed(() => props.submitted ?? form?.submitted ?? false)

const value = computed<FieldValue>({
  get: () => (named.value === null ? props.modelValue : form?.valueOf(named.value)),
  set: (next) => {
    if (named.value !== null) form?.setValue(named.value, next)
    emit('update:modelValue', next)
  },
})

const hasFeedback = computed(() => error.value !== undefined || placeholder.value !== undefined)

const state = computed(() => (submitted.value ? !error.value : null))

</script>
