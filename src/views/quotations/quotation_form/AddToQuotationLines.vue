<template>
  <div class="use-on-invoice-container">
    <h5>{{ $trans("What to add as quotation lines")}}</h5>
    <BFormGroup>
      <BFormRadioGroup
        v-model="useOnQuotationSelected"
        :options="useOnQuotationOptions"
      ></BFormRadioGroup>
    </BFormGroup>
    <BButton
      @click="() => { createQuotationLines() }"
      class="btn btn-primary update-button"
      type="button"
      variant="primary"
    >
      {{ $trans("Create quotation lines") }}
    </BButton>
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
