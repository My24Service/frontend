<template>
  <Doughnut :chart-data="chartData" :options="options" />
</template>
<script>
import {Doughnut} from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(ArcElement, Tooltip, Legend)

export default {
  name: 'PieChart',
  components: {Doughnut },
  props: {
    options: {
      type: Object,
      default: null
    },
    chartData: {
      type: Object,
      default: null
    },
  }
}
</script>
