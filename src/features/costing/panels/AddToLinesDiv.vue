<template>
  <div class="use-on-invoice-container">
    <h5>{{ title }}</h5>

    <BFormGroup>
      <div class="flex-columns">
        <BFormRadioGroup
          v-model="useOnInvoiceSelected"
          :options="useOnInvoiceOptions"
        ></BFormRadioGroup>
        <BButton
          @click="() => { createInvoiceLines() }"
          class="btn btn-sm update-button"
          type="button"
        >
          {{ buttonLabel }}
        </BButton>
      </div>
    </BFormGroup>
  </div>
</template>

<script setup lang="ts">
import type { InvoiceLineOption } from '../calculations'

const props = withDefaults(defineProps<{
  value?: InvoiceLineOption | null
  useOnInvoiceOptions?: { value: InvoiceLineOption; text: string }[]
  /** The heading above the options; the invoice and quotation word it differently. */
  title?: string
  /** The label of the button that creates the lines. */
  buttonLabel?: string
}>(), {
  value: null,
  useOnInvoiceOptions: () => [],
  title: () => $trans('Add costs on infolines'),
  buttonLabel: () => $trans('Create invoice lines'),
})
const emit = defineEmits<{ buttonClicked: [value: InvoiceLineOption | null] }>()
const useOnInvoiceSelected = ref(props.value ?? props.useOnInvoiceOptions[0]?.value ?? null)
watch(() => props.value, (value) => {
  useOnInvoiceSelected.value = value ?? props.useOnInvoiceOptions[0]?.value ?? null
})
watch(() => props.useOnInvoiceOptions, (options) => {
  if (useOnInvoiceSelected.value == null && options.length > 0) {
    useOnInvoiceSelected.value = options[0].value
  }
}, { immediate: true })
function createInvoiceLines() {
  emit('buttonClicked', useOnInvoiceSelected.value)
}
</script>

<style scoped>

</style>
