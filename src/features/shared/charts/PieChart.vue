<template>
  <Doughnut :chart-data="pieData" :chart-options="pieOptions" :height="height" />
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import './chart-setup'

/** Same loose shape as `BarChart`: percentages arrive as strings. */
type PieData = ChartData<'doughnut', Array<number | string>, string>

const props = withDefaults(defineProps<{
  chartData: PieData | null
  options?: ChartOptions<'doughnut'> | null
  height?: number
}>(), {
  chartData: null,
  options: null,
  height: undefined,
})

const pieData = computed<ChartData<'doughnut', number[], string>>(() => ({
  ...props.chartData,
  datasets: (props.chartData?.datasets ?? []).map((dataset) => ({
    ...dataset,
    data: dataset.data.map((value) => Number(value)),
  })),
}))

const pieOptions = computed(() => props.options ?? undefined)
</script>
