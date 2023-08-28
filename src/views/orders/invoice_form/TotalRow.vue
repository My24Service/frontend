<template>
  <b-row>
    <b-col cols="8">
      <span class="total-text">{{ $trans('Total') }}</span>
    </b-col>
    <b-col cols="2">
      <span class="total-text items-total">{{ items_total }}</span>
    </b-col>
    <b-col cols="2">
      <Totals
        :total="total"
        :is-final-total="true"
        :vat="total_vat"
      />
    </b-col>
  </b-row>
</template>

<script>
import Totals from "./Totals";

export default {
  name: "TotalRow",
  components: {
    Totals,
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
