<template>
  <div class="use-on-invoice-container">
    <h5>{{ $trans("Add call out costs on infolines")}}</h5>

    <b-form-group>
      <div class="flex-columns">
        <b-form-radio-group
          v-model="useOnInvoiceSelected"
          :options="useOnInvoiceOptions"
        ></b-form-radio-group>
        <b-button
          @click="() => { createInvoiceLines() }"
          class="btn btn-sm update-button"
          type="button"
        >
          {{ $trans("Create invoice lines") }}
        </b-button>
      </div>
    </b-form-group>
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
