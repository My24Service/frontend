<template>
  <Bar :chart-data="chartDataLocal" :chart-options="options" :height="height" />
</template>
<script>
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

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
  data() {
    return {
      chartDataLocal: this.chartData
    }
  }
}
</script>
