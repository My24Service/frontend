<template>
  <div class="app-grid">
    <b-row align-h="center">
      <h3>{{ $trans("Per order type per year")}}</h3>
    </b-row>
    <b-row>
      <b-col cols="12">
        <bar-chart
          v-if="chartdataCountsYearOrdertypesBar"
          id="bar-chart-order-types-year"
          :chart-data="chartdataCountsYearOrdertypesBar"
          :options="optionsStacked"
        />
      </b-col>
    </b-row>

    <b-row align-h="center">
      <h3>{{ $trans("Per order type per month")}}</h3>
    </b-row>
    <b-row>
      <b-col cols="12">
        <bar-chart
          v-if="chartdataCountsOrderTypesBar"
          id="bar-chart-order-types-month"
          :chart-data="chartdataCountsOrderTypesBar"
          :options="optionsStacked"
        />
      </b-col>
    </b-row>

    <b-row align-h="center">
      <h3>{{ $trans("Orders per month")}}</h3>
    </b-row>
    <b-row>
      <b-col cols="6">
        <bar-chart
          v-if="chartdataCountsBar"
          id="bar-chart-order-types"
          :chart-data="chartdataCountsBar"
          :options="options"
        />
      </b-col>
      <b-col cols="6">
        <pie-chart
          v-if="chartdataCountsPie"
          id="pie-chart-order-types"
          :chart-data="chartdataCountsPie"
          :options="pieOptions"
        />
      </b-col>
    </b-row>

    <b-row align-h="center">
      <h3>{{ $trans("Order types")}}</h3>
    </b-row>
    <b-row>
      <b-col cols="6">
        <bar-chart
          v-if="chartdataOrderTypesBar"
          id="bar-chart-order-types"
          :chart-data="chartdataOrderTypesBar"
          :options="options"
        />
      </b-col>
      <b-col cols="6">
        <pie-chart
          v-if="chartdataOrderTypesPie"
          id="pie-chart-order-types"
          :chart-data="chartdataOrderTypesPie"
          :options="pieOptions"
        />
      </b-col>
    </b-row>
  </div>
</template>

<script>
import BarChart from "@/features/shared/charts/BarChart.vue"
import PieChart from "@/features/shared/charts/PieChart.vue"
import {useMainStore} from "@/stores/main";
import componentMixin from "@/mixins/common";
import {
  buildMonthTotals,
  buildOrderTypeTotals,
  buildStackedDatasets,
  createLabelColors,
  hiddenLabelBarOptions,
  monthName,
  percentPieOptions,
} from "@/features/order/stats/chart-data";

// Chart.defaults.global.datasets.bar.categoryPercentage = 0.5;
// Chart.defaults.global.datasets.bar.barPercentage = 1

export default {
  setup() {
    const mainStore = useMainStore()

    return {
      mainStore
    }
  },
  mixins: [componentMixin],
  components: {
    BarChart,
    PieChart,
    // ChartJsPluginDataLabels,
  },
  props: {
    dataIn: {
      type: [Object]
    }
  },
  name: "OrderStats",
  data() {
    return {
      isLoading: false,
      chartdataOrderTypesBar: null,
      chartdataOrderTypesPie: null,
      chartdataCountsOrderTypesBar: null,
      chartdataCountsOrderTypesPie: null,
      chartdataCountsBar: null,
      chartdataCountsPie: null,
      chartdataCountsYearOrdertypesBar: null,
      getColor: createLabelColors(),
      options: hiddenLabelBarOptions,
      total: 0,
      leftOutMonth: {},
      leftOutYear: {},
      leftOutOrderTypes: [],
      optionsStacked: {
        tooltips: {
          callbacks: {
            afterTitle: () => {
              this.total = 0
            },
            label: (tooltipItem, data) => {
              const value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]
              const key = data.datasets[tooltipItem.datasetIndex].label
              this.total = data.datasets.reduce((a, dataset) => a + parseInt(dataset.data[tooltipItem.index]), 0)
              return `${key} ${value}`
            },
            footer: (tooltipItems, data) => {
              return `${this.$trans("Total") }: ${this.total}`
            }
          }
        },
        plugins: {
          datalabels: {
            formatter: (value, ctx) => {
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
      },
      pieOptions: percentPieOptions,
    }
  },
  watch: {
    dataIn: {
      handler(newValue) {
        this.render(newValue.orderTypeStatsData,
          newValue.monthsStatsData,
          newValue.orderTypesMonthStatsData,
          newValue.countsYearOrdertypeStats)
      },
      deep: true
    }
  },
  methods: {
    render(orderTypeStatsData, monthsStatsData, orderTypesMonthStatsData, countsYearOrdertypeStats) {
      this.isLoading = true
      const lang = this.mainStore.getCurrentLanguage || 'nl'

      // first graph, year
      const labelsYear = []
      for (let i = countsYearOrdertypeStats.min_year; i < countsYearOrdertypeStats.max_year + 1; i++) {
        labelsYear.push(`${i}`)
      }
      const year = buildStackedDatasets(
        countsYearOrdertypeStats.order_types,
        labelsYear,
        countsYearOrdertypeStats.order_counts,
        this.getColor,
      )
      this.leftOutYear = year.leftOut

      this.chartdataCountsYearOrdertypesBar = {
        labels: labelsYear,
        datasets: year.datasets
      }

      // second graph, month
      const monthBuckets = Array.from({length: 12}, (_, index) => `${index + 1}`)
      const labelsMonth = monthBuckets.map((bucket) => monthName(Number(bucket), lang))
      const month = buildStackedDatasets(
        orderTypesMonthStatsData.order_types,
        monthBuckets,
        orderTypesMonthStatsData.order_counts,
        this.getColor,
      )
      this.leftOutMonth = month.leftOut

      this.chartdataCountsOrderTypesBar = {
        labels: labelsMonth,
        datasets: month.datasets
      }

      // third graph, orders per month
      const totals = buildMonthTotals(monthsStatsData.order_counts, this.getColor, lang)

      this.chartdataCountsBar = totals.bar

      this.chartdataCountsPie = totals.pie

      // fourth graph, order types
      const orderTypes = buildOrderTypeTotals(orderTypeStatsData.order_types, this.getColor)
      this.leftOutOrderTypes = orderTypes.leftOut

      this.chartdataOrderTypesBar = {
        labels: orderTypes.labels,
        datasets: [{
          // label: $trans('Order types'),
          data: orderTypes.counts,
          backgroundColor: orderTypes.colors,
        }]
      }

      this.chartdataOrderTypesPie = {
        labels: orderTypes.labels,
        datasets: [{
          data: orderTypes.percentages,
          backgroundColor: orderTypes.colors,
        }]
      }


      this.isLoading = false
    }
  },
}
</script>

<style scoped>

</style>
