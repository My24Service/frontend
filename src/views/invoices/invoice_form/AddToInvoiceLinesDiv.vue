<template>
  <div class="use-on-invoice-container">
    <h5>{{ $trans("Add costs on infolines")}}</h5>

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
          {{ $trans("Create invoice lines") }}
        </BButton>
      </div>
    </BFormGroup>
  </div>
</template>

<script>
export default {
  name: "AddToInvoiceLinesDiv",
  emits: ['buttonClicked'],
  props: {
    value: {
      type: [String],
      default: null
    },
    useOnInvoiceOptions: {
      type: [Array],
      default: null
    },
  },
  created() {
    this.useOnInvoiceSelected = this.value
  },
  data() {
    return {
      useOnInvoiceSelected: null
    }
  },
  methods: {
    createInvoiceLines() {
      this.$emit('buttonClicked', this.useOnInvoiceSelected)
    }
  }
}
</script>

<style scoped>

</style>
