<template>
  <b-row>
    <b-col cols="6">
      <span class="total-text">{{ $trans('Total') }}</span>
    </b-col>
    <b-col cols="3">
      <span class="total-text items-total">{{ items_total }}</span>
    </b-col>
    <b-col cols="3">
      <TotalsInputs
        :total="total"
        :is-final-total="true"
        :vat="total_vat"
      />
    </b-col>
  </b-row>
</template>

<script>
import TotalsInputs from "../../../components/TotalsInputs";

export default {
  name: "TotalRow",
  components: {
    TotalsInputs,
  },
  props: {
    items_total: {
      type: [String, Number],
      default: null
    },
    total: {
      type: [Object],
      default: null
    },
    total_vat: {
      type: [Object],
      default: null
    },
  }
}
</script>

<style scoped>
.total-text {
  font-size: 14px;
  font-weight: bold;
}
</style>
