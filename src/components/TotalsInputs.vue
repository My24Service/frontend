<template>
  <div>
    <div class="d-flex justify-content-between">
      <span v-if="!isFinalTotal" class="value-container">{{ $trans("Total") }}</span>
      <span v-else class="value-container-bold">{{ $trans("Total") }}</span>
      <div class="d-flex align-items-end">{{ total.toFormat('$0.00') }}</div>
    </div>

    <div class="d-flex justify-content-between">
      <span v-if="!isFinalTotal" class="value-container">{{ $trans("VAT") }}</span>
      <span v-if="isFinalTotal" class="value-container-bold">{{ $trans("VAT") }}</span>
      <div class="d-flex align-items-end">
        {{ vat.toFormat('$0.00') }}
      </div>
    </div>
  </div>
</template>

<script>
import {$trans} from "../utils";

export default {
  name: "TotalsInputs",
  methods: {$trans},
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
}
</script>

<style scoped>
.value-container {
  width: 120px;
  padding-top: 4px;
  padding-right: 4px;
  padding-left: 4px;
}
.value-container-bold {
  width: 120px;
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
