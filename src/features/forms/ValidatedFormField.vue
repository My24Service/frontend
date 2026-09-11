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
      :model-value="modelValue"
      :autofocus="autofocus"
      :readonly="readonly"
      :disabled="disabled"
      :type="type"
      :rows="textarea ? rows : undefined"
      :state="state"
      @update:model-value="$emit('update:modelValue', $event)"
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

const props = withDefaults(defineProps<{
  id: string
  label: string
  modelValue: string | number | null | undefined
  /** The field's error, when there is one. Pass `undefined` before submit. */
  error?: string
  /** The copy shown while the field simply sits empty (`FIELD_MESSAGES.x()`). */
  placeholder?: string
  /** True once the form has been submitted at least once. */
  submitted?: boolean
  labelCols?: string | number
  textarea?: boolean
  rows?: string | number
  type?: string
  readonly?: boolean
  disabled?: boolean
  autofocus?: boolean
}>(), {
  rows: '5',
})

defineEmits<{(event: 'update:modelValue', value: unknown): void}>()

const hasFeedback = computed(() => props.error !== undefined || props.placeholder !== undefined)

const state = computed(() => (props.submitted ? !props.error : null))
</script>
