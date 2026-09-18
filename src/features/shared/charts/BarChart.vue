<template>
  <Bar :chart-data="chartData" :chart-options="options" :height="height" />
</template>
<script>
import { Bar } from 'vue-chartjs'
import './chart-setup'

export default {
  name: 'BarChart',
  components: { Bar },
  props: {
    options: {
      type: Object,
      default: null
    },
    chartData: {
      type: Object,
      default: null
    },
    height: {
      type: Number,
      default: undefined
    },
  },
}
</script>
