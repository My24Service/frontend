import { format } from 'date-fns'

/**
 * A stand-in for `@vuepic/vue-datepicker`, whose real widget has no meaningful
 * DOM under happy-dom. It takes `model-type` so a pick can honour it.
 */
export const datePickerStub = {
  props: ['modelValue', 'modelType'],
  emits: ['update:modelValue'],
  template: '<div class="datepicker-stub" />',
}

/**
 * A pick as the real picker emits it: the Date itself, unless `model-type` asks
 * for that format instead. A stub that emits the form's own string hides a form
 * that binds a string field without `model-type`.
 */
export function pick(picker, date) {
  const {modelType} = picker.props()
  picker.vm.$emit('update:modelValue', modelType ? format(date, modelType) : date)
}
