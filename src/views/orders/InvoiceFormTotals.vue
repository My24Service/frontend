<template>
  <b-container>
    <b-row>
      <b-col cols="4">
        <span class="value-container">{{ $trans("Total") }}</span>
      </b-col>
      <b-col cols="8">
        <b-form-input
          readonly
          :value="total.toFormat('$0.00')"
          size="sm"
          class="input-total-used"
        ></b-form-input>
      </b-col>
    </b-row>
    <b-row v-if="showMargin">
      <b-col cols="4">
        <span class="value-container">{{ $trans("Margin") }}</span>
      </b-col>
      <b-col cols="8">
        <b-form-input
          readonly
          :value="margin.toFormat('$0.00')"
          size="sm"
          class="input-total-used"
        ></b-form-input>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="4">
        <span class="value-container">{{ $trans("VAT") }}</span>
      </b-col>
      <b-col cols="8">
        <b-form-input
          readonly
          :value="vat.toFormat('$0.00')"
          size="sm"
          class="input-total-used"
        ></b-form-input>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
export default {
  name: "InvoiceFormTotals",
  props: {
    vat: {
      type: [Object],
      default: null
    },
    margin: {
      type: [Object],
      default: null
    },
    total: {
      type: [Object],
      default: null
    },
    showMargin: {
      type: [Boolean],
      default: true
    }
  },
}
</script>

<style scoped>
.value-container {
  padding-top: 4px;
  padding-right: 4px;
  padding-left: 4px;
}
.input-total-used {
  width: 90px;
  padding: 1px;
  margin: 1px;
  text-align: right;
}
</style>
