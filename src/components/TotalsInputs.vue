<template>
  <div>
    <div class="flex-columns">

      <div>
        <span v-if="!isFinalTotal" class="value-container">{{ $trans("Total") }}</span>
        <span v-if="isFinalTotal" class="value-container-bold">{{ $trans("Total") }}</span>
      </div>
      
      <b-form-input
        readonly
        disabled
        :value="total.toFormat('$0.00')"
        size="sm"
        :class="totalClass"
      ></b-form-input>

    </div>

    <div class="flex-columns">
        <span v-if="!isFinalTotal" class="value-container">{{ $trans("VAT") }}</span>
        <span v-if="isFinalTotal" class="value-container-bold">{{ $trans("VAT") }}</span>

        <b-form-input
          readonly
          disabled
          :value="vat.toFormat('$0.00')"
          size="sm"
          :class="vatClass"
        ></b-form-input>

    </div>
  </div>
</template>

<script>
export default {
  name: "TotalsInputs",
  props: {
    vat: {
      type: [Object],
      default: null
    },
    total: {
      type: [Object],
      default: null
    },
    isFinalTotal: {
      type: [Boolean],
      default: false
    }
  },
  computed: {
    totalClass() {
      let base = 'input-total-used'
      return this.isFinalTotal ? `${base} total-input-final` : `${base} total-input`
    },
    vatClass() {
      let base = 'input-total-used'
      return this.isFinalTotal ? `${base} vat-input-final` : `${base} vat-input`
    },
  }
}
</script>

<style scoped>
.value-container {
  padding-top: 4px;
  padding-right: 4px;
  padding-left: 4px;
}
.value-container-bold {
  padding-top: 4px;
  padding-right: 4px;
  padding-left: 4px;
  font-size: 14px;
  font-weight: bold;
}

input {
  text-align: end;
}
</style>
