<template>
  <Bar :chart-data="barData" :chart-options="barOptions" :height="height" />
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import './chart-setup'

/**
 * The builders hand the charts counts and percentage strings; chart.js parses
 * those to numbers itself, so the wrapper accepts the loose array and the
 * computed below normalises it to the numeric data `Bar` types expect.
 */
type BarData = ChartData<'bar', Array<number | string>, string>

const props = withDefaults(defineProps<{
  chartData: BarData | null
  options?: ChartOptions<'bar'> | null
  height?: number
}>(), {
  chartData: null,
  options: null,
  height: undefined,
})

const barData = computed<ChartData<'bar', number[], string>>(() => ({
  ...props.chartData,
  datasets: (props.chartData?.datasets ?? []).map((dataset) => ({
    ...dataset,
    data: dataset.data.map((value) => Number(value)),
  })),
}))

const barOptions = computed(() => props.options ?? undefined)
</script>
