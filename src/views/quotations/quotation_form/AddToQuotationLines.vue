<template>
  <div class="use-on-invoice-container">
    <h4>{{ $trans("What to add as quotation lines")}}</h4>
    <b-form-group>
      <b-form-radio-group
        v-model="useOnQuotationSelected"
        :options="useOnQuotationOptions"
      ></b-form-radio-group>
    </b-form-group>
    <b-button
      @click="() => { createQuotationLines() }"
      class="btn btn-primary update-button"
      type="button"
      variant="primary"
    >
      {{ $trans("Create quotation lines") }}
    </b-button>
  </div>
</template>

<script>
export default {
  name: "AddToQuotationLines",
  emits: ['buttonClicked'],
  props: {
    value: {
      type: [String],
      default: null
    },
    useOnQuotationOptions: {
      type: [Array],
      default: null
    },
  },
  created() {
    this.useOnQuotationSelected = this.value
  },
  data() {
    return {
      useOnQuotationSelected: null
    }
  },
  methods: {
    createQuotationLines() {
      this.$emit('buttonClicked', this.useOnQuotationSelected)
    }
  }
}
</script>
