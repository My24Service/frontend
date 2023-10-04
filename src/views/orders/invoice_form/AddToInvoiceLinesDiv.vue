<template>
  <div class="use-on-invoice-container">
    <h4>{{ $trans("What to add as invoice lines")}}</h4>
    <b-form-group>
      <b-form-radio-group
        v-model="useOnInvoiceSelected"
        :options="useOnInvoiceOptions"
      ></b-form-radio-group>
    </b-form-group>
    <b-button
      @click="() => { createInvoiceLines() }"
      class="btn btn-primary update-button"
      type="button"
      variant="primary"
    >
      {{ $trans("Create invoice lines") }}
    </b-button>
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
