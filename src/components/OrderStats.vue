<template>
  <div class="app-grid">
    <BRow align-h="center">
      <h3>{{ $trans("Per order type per year")}}</h3>
    </BRow>
    <BRow>
      <BCol cols="12">
        <BarChart
          v-if="chartdataCountsYearOrdertypesBar"
          id="bar-chart-order-types-year"
          :chart-data="chartdataCountsYearOrdertypesBar"
          :options="optionsStacked"
        />
      </BCol>
    </BRow>

    <BRow align-h="center">
      <h3>{{ $trans("Per order type per month")}}</h3>
    </BRow>
    <BRow>
      <BCol cols="12">
        <BarChart
          v-if="chartdataCountsOrderTypesBar"
          id="bar-chart-order-types-month"
          :chart-data="chartdataCountsOrderTypesBar"
          :options="optionsStacked"
        />
      </BCol>
    </BRow>

    <BRow align-h="center">
      <h3>{{ $trans("Orders per month")}}</h3>
    </BRow>
    <BRow>
      <BCol cols="6">
        <BarChart
          v-if="chartdataCountsBar"
          id="bar-chart-order-types"
          :chart-data="chartdataCountsBar"
          :options="options"
        />
      </BCol>
      <BCol cols="6">
        <PieChart
          v-if="chartdataCountsPie"
          id="pie-chart-order-types"
          :chart-data="chartdataCountsPie"
          :options="pieOptions"
        />
      </BCol>
    </BRow>

    <BRow align-h="center">
      <h3>{{ $trans("Order types")}}</h3>
    </BRow>
    <BRow>
      <BCol cols="6">
        <BarChart
          v-if="chartdataOrderTypesBar"
          id="bar-chart-order-types"
          :chart-data="chartdataOrderTypesBar"
          :options="options"
        />
      </BCol>
      <BCol cols="6">
        <PieChart
          v-if="chartdataOrderTypesPie"
          id="pie-chart-order-types"
          :chart-data="chartdataOrderTypesPie"
          :options="pieOptions"
        />
      </BCol>
    </BRow>
  </div>
</template>

<script setup lang="ts">
import { BarChart } from '@/features/shared'
import { PieChart } from '@/features/shared'
import { useMainStore } from '@/stores/main'
import { $trans } from '@/services/i18n'
import type { ChartData, SliceTally } from '@/features/order'
import {
  buildMonthTotals,
  buildOrderTypeTotals,
  buildStackedDatasets,
  createLabelColors,
  hiddenLabelBarOptions,
  monthName,
  percentPieOptions,
} from '@/features/order'

/**
 * The four stats payloads `OrderStats` reads off its `dataIn`. The callers
 * hand it partial payloads while their reads are in flight, so each field the
 * render fills from is optional.
 */
interface OrderTypeStatsData {
  order_types?: Record<string, SliceTally>
}

interface MonthsStatsData {
  order_counts?: Record<string, SliceTally>
}

interface OrderTypesMonthStatsData {
  order_types?: string[]
  order_counts?: Record<string, Record<string, SliceTally>>
}

interface CountsYearOrdertypeStatsData {
  min_year?: number
  max_year?: number
  order_types?: string[]
  order_counts?: Record<string, Record<string, SliceTally>>
}

interface StatsData {
  orderTypeStatsData?: OrderTypeStatsData
  monthsStatsData?: MonthsStatsData
  orderTypesMonthStatsData?: OrderTypesMonthStatsData
  countsYearOrdertypeStats?: CountsYearOrdertypeStatsData
}

const props = defineProps<{
  dataIn?: StatsData
}>()

const mainStore = useMainStore()

const isLoading = ref(false)
const chartdataOrderTypesBar = ref<ChartData | null>(null)
const chartdataOrderTypesPie = ref<ChartData | null>(null)
const chartdataCountsOrderTypesBar = ref<ChartData | null>(null)
const chartdataCountsOrderTypesPie = ref<ChartData | null>(null)
const chartdataCountsBar = ref<ChartData | null>(null)
const chartdataCountsPie = ref<ChartData | null>(null)
const chartdataCountsYearOrdertypesBar = ref<ChartData | null>(null)
const getColor = createLabelColors()
const options = hiddenLabelBarOptions
const total = ref(0)
const optionsStacked: Record<string, unknown> = {
  tooltips: {
    callbacks: {
      afterTitle: () => {
        total.value = 0
      },
      label: (tooltipItem: {datasetIndex: number; index: number}, data: {datasets: Array<{label?: string; data: Array<number | string>}>}) => {
        const value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]
        const key = data.datasets[tooltipItem.datasetIndex].label
        total.value = data.datasets.reduce((a, dataset) => a + parseInt(String(dataset.data[tooltipItem.index])), 0)
        return `${key} ${value}`
      },
      footer: () => {
        return `${$trans("Total") }: ${total.value}`
      }
    }
  },
  plugins: {
    datalabels: {
      formatter: (value: number) => {
        return value === 0 ? "" : value
      },
      color: '#fff',
    }
  },
  scales: {
    xAxes: [{
      stacked: true,
    }],
    yAxes: [{
      stacked: true
    }]
  },
  responsive: true,
  maintainAspectRatio: false,
}
const pieOptions = percentPieOptions

watch(() => props.dataIn, render, {deep: true})

function render(data: StatsData | undefined) {
  if (!data) return

  const orderTypeStatsData = data.orderTypeStatsData ?? {}
  const monthsStatsData = data.monthsStatsData ?? {}
  const orderTypesMonthStatsData = data.orderTypesMonthStatsData ?? {}
  const countsYearOrdertypeStats = data.countsYearOrdertypeStats ?? {}

  isLoading.value = true
  const lang = mainStore.getCurrentLanguage || 'nl'

  // first graph, year
  const labelsYear: string[] = []
  const minYear = countsYearOrdertypeStats.min_year ?? 0
  const maxYear = countsYearOrdertypeStats.max_year ?? minYear
  for (let i = minYear; i < maxYear + 1; i++) {
    labelsYear.push(`${i}`)
  }
  const year = buildStackedDatasets(
    countsYearOrdertypeStats.order_types ?? [],
    labelsYear,
    countsYearOrdertypeStats.order_counts ?? {},
    getColor,
  )

  chartdataCountsYearOrdertypesBar.value = {
    labels: labelsYear,
    datasets: year.datasets
  }

  // second graph, month
  const monthBuckets = Array.from({length: 12}, (_, index) => `${index + 1}`)
  const labelsMonth = monthBuckets.map((bucket) => monthName(Number(bucket), lang))
  const month = buildStackedDatasets(
    orderTypesMonthStatsData.order_types ?? [],
    monthBuckets,
    orderTypesMonthStatsData.order_counts ?? {},
    getColor,
  )

  chartdataCountsOrderTypesBar.value = {
    labels: labelsMonth,
    datasets: month.datasets
  }

  // third graph, orders per month
  const totals = buildMonthTotals(monthsStatsData.order_counts ?? {}, getColor, lang)

  chartdataCountsBar.value = totals.bar

  chartdataCountsPie.value = totals.pie

  // fourth graph, order types
  const orderTypes = buildOrderTypeTotals(orderTypeStatsData.order_types ?? {}, getColor)

  chartdataOrderTypesBar.value = {
    labels: orderTypes.labels,
    datasets: [{
      // label: $trans('Order types'),
      data: orderTypes.counts,
      backgroundColor: orderTypes.colors,
    }]
  }

  chartdataOrderTypesPie.value = {
    labels: orderTypes.labels,
    datasets: [{
      data: orderTypes.percentages,
      backgroundColor: orderTypes.colors,
    }]
  }

  isLoading.value = false
}
</script>

<style scoped>

</style>
