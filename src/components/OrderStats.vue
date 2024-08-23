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
          id="bar-chart-order-types"
          :chart-data="chartdataCountsBar"
          :options="options"
        />
      </b-col>
      <b-col cols="6">
        <pie-chart
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
          id="bar-chart-order-types"
          :chart-data="chartdataOrderTypesBar"
          :options="options"
        />
      </b-col>
      <b-col cols="6">
        <pie-chart
          id="pie-chart-order-types"
          :chart-data="chartdataOrderTypesPie"
          :options="pieOptions"
        />
      </b-col>
    </b-row>
  </div>
</template>

<script>
import moment from 'moment/min/moment-with-locales'
import ChartJsPluginDataLabels from "chartjs-plugin-datalabels";

import BarChart from "./BarChart.vue"
import PieChart from "./PieChart.vue"

Chart.defaults.global.datasets.bar.categoryPercentage = 0.5;
Chart.defaults.global.datasets.bar.barPercentage = 1

export default {
  components: {
    BarChart,
    PieChart,
    ChartJsPluginDataLabels,
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
      colors: {},
      colorsOrderTypes: {},
      options: {
        plugins: {
          datalabels: {
            formatter: (value, ctx) => {
              return ""
            },
            color: '#fff',
          }
        },
        responsive: true,
        maintainAspectRatio: false,
      },
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
      pieOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
            formatter: (value, ctx) => {
              return `${value}%`
            },
            color: '#fff',
          }
        }
      },
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
    getRandomColorOrderType(txt) {
      if (!(txt in this.colorsOrderTypes)) {
        this.colorsOrderTypes[txt] = `#${Math.floor(Math.random()*16777215).toString(16)}`
      }

      return this.colorsOrderTypes[txt]
    },
    render(orderTypeStatsData, monthsStatsData, orderTypesMonthStatsData, countsYearOrdertypeStats) {
      const threshold = .07
      this.isLoading = true

      // first graph, year
      let datasetsYear = [], labelsYear = []
      this.leftOutYear = {
        count: 0,
        data: {}
      }
      for (let j=0; j<countsYearOrdertypeStats.order_types.length; j++) {
        const order_type = countsYearOrdertypeStats.order_types[j]
        let dataOk = true

        let data = []
        for (let i=countsYearOrdertypeStats.min_year; i<countsYearOrdertypeStats.max_year+1; i++) {
          const yearText = `${i}`
          if (labelsYear.indexOf(yearText) === -1) {
            labelsYear.push(yearText)
          } else {

          }
          if (yearText in countsYearOrdertypeStats.order_counts) {
            if (order_type in countsYearOrdertypeStats.order_counts[yearText]) {
              if (parseFloat(countsYearOrdertypeStats.order_counts[yearText][order_type].perc) < threshold) {
                if (!(yearText in this.leftOutYear.data)) {
                  this.leftOutYear.data[yearText] = []
                }
                this.leftOutYear.count++;
                this.leftOutYear.data[yearText].push({
                  order_type: order_type,
                  data: countsYearOrdertypeStats.order_counts[yearText][order_type]})
                dataOk = false
                break
              }

              data.push(countsYearOrdertypeStats.order_counts[yearText][order_type].count)
            } else
              data.push(0)
          } else {
            data.push(0)
          }
        }

        if (dataOk) {
          datasetsYear.push({
            label: order_type,
            backgroundColor: this.getRandomColorOrderType(order_type),
            data
          })
        }
      }
      // console.log('left out year', this.leftOutYear)

      this.chartdataCountsYearOrdertypesBar = {
        labels: labelsYear,
        datasets: datasetsYear
      }

      // second graph, month
      let datasets = [], labelsMonth = []
      this.leftOutMonth = {
        count: 0,
        data: {}
      }
      for (let j=0; j<orderTypesMonthStatsData.order_types.length; j++) {
        const order_type = orderTypesMonthStatsData.order_types[j]
        let dataOk = true

        let data = []
        for (let i=1; i<13; i++) {
          const monthText = `${i}`
          const date = this.$moment(`2022-${monthText}-1`, 'D-MM-YYYY')
          const monthTextLong = date.format('MMMM')
          if (monthText in orderTypesMonthStatsData.order_counts) {
            if (order_type in orderTypesMonthStatsData.order_counts[monthText]) {
              if (parseFloat(orderTypesMonthStatsData.order_counts[monthText][order_type].perc) < threshold) {
                if (!(monthText in this.leftOutMonth.data)) {
                  this.leftOutMonth.data[monthText] = []
                }
                this.leftOutMonth.count++;
                this.leftOutMonth.data[monthText].push({
                  order_type: order_type,
                  month: monthText,
                  data: orderTypesMonthStatsData.order_counts[monthText][order_type]}
                )
                dataOk = false
                break
              }
              if (labelsMonth.indexOf(monthTextLong) === -1) {
                labelsMonth.push(monthTextLong)
              }
              data.push(orderTypesMonthStatsData.order_counts[monthText][order_type].count)
            } else
              data.push(0)
          } else {
            data.push(0)
          }
        }

        if (dataOk) {
          datasets.push({
            label: order_type,
            backgroundColor: this.getRandomColorOrderType(order_type),
            data
          })
        }
      }
      // console.log('left out month', this.leftOutMonth)

      this.chartdataCountsOrderTypesBar = {
        labels: labelsMonth,
        datasets
      }

      // third graph, orders per month
      let monthDataBar = [], monthDataPie = [], colors = [], labels = []
      for (let i=1; i<13; i++) {
        const monthText =  `${i}`
        const date = this.$moment(`2022-${monthText}-1`, 'D-MM-YYYY')
        const monthTextLong = date.format('MMMM')
        labels.push(monthTextLong)
        colors.push(this.getRandomColorOrderType(monthText))
        if (monthText in monthsStatsData.order_counts) {
          monthDataBar.push(monthsStatsData.order_counts[monthText].count)
          monthDataPie.push(monthsStatsData.order_counts[monthText].perc)
        } else {
          monthDataBar.push(0)
          monthDataPie.push("0.00")
        }
      }

      this.chartdataCountsBar = {
        labels,
        datasets: [{
          // label: this.$trans('Total orders per month'),
          data: monthDataBar,
          backgroundColor: 'blue',
        }]
      }

      this.chartdataCountsPie = {
        labels,
        datasets: [{
          data: monthDataPie,
          backgroundColor: colors,
        }]
      }

      // fourth graph, order types
      let orderTypesDataBar = [], orderTypesDataPie = [], orderTypesLabels = [], orderTypesColors = []
      this.leftOutOrderTypes = {
        count: 0,
        data: {}
      }
      const thresholdOrderType = .15
      for (const [orderType, _data] of Object.entries(orderTypeStatsData.order_types)) {
        if (parseFloat(_data.perc) > thresholdOrderType) {
          orderTypesLabels.push(orderType)
          orderTypesColors.push(this.getRandomColorOrderType(orderType))
          orderTypesDataPie.push(_data.perc)
          orderTypesDataBar.push(_data.count)
        } else {
          if (!(orderType in this.leftOutOrderTypes.data)) {
            this.leftOutOrderTypes.data[orderType] = []
          }
          this.leftOutOrderTypes.count++;
          this.leftOutOrderTypes.data[orderType].push({
            order_type: orderType,
            data: _data
          })
        }
      }
      // console.log('left out order types', this.leftOutOrderTypes)

      this.chartdataOrderTypesBar = {
        labels: orderTypesLabels,
        datasets: [{
          // label: this.$trans('Order types'),
          data: orderTypesDataBar,
          backgroundColor: orderTypesColors,
        }]
      }

      this.chartdataOrderTypesPie = {
        labels: orderTypesLabels,
        datasets: [{
          data: orderTypesDataPie,
          backgroundColor: orderTypesColors,
        }]
      }


      this.isLoading = false
    }
  },
  async mounted () {
    const lang = this.$store.getters.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)

  }
}
</script>

<style scoped>

</style>
