<template>
  <b-row class="chart-section">
    <b-col cols="6">
      <BarChart
        :id="`bar-chart-${id}`"
        :chart-data="pair.bar"
        :options="barOptions"
      />
    </b-col>
    <b-col cols="6">
      <PieChart
        :id="`pie-chart-${id}`"
        :chart-data="pair.pie"
        :options="pieOptions"
      />
    </b-col>
  </b-row>
</template>

<script lang="ts" setup>
import {
  BarChart,
  PieChart,
} from '@/features/shared'
import {
  type ChartPair,
  percentPieOptions,
} from './chart-data'

/** A bar chart of counts beside a pie of percentages, as every stats block draws. */
defineProps<{
  id: string
  pair: ChartPair
}>()

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
}

const pieOptions = percentPieOptions
</script>

<style scoped>
.chart-section {
  padding-top: 10px;
  padding-bottom: 10px;
}
</style>
