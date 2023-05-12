<template>
  <div class="app-grid">
    <b-row align-h="center">
      <h3>{{ $trans("Per order type per year")}}</h3>
    </b-row>
    <b-row>
      <b-col cols="12">
        <bar-chart
          id="bar-chart-order-types-year"
          v-if="!isLoading"
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
          v-if="!isLoading"
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
          v-if="!isLoading"
          :chart-data="chartdataCountsBar"
          :options="options"
        />
      </b-col>
      <b-col cols="6">
        <pie-chart
          id="pie-chart-order-types"
          v-if="!isLoading"
          :chart-data="chartdataCountsPie"
          :options="pieOptions"
        />
      </b-col>
    </b-row>

    <b-row align-h="center">
      <h3>{{ $trans("Orders types")}}</h3>
    </b-row>
    <b-row>
      <b-col cols="6">
        <bar-chart
          id="bar-chart-order-types"
          v-if="!isLoading"
          :chart-data="chartdataOrderTypesBar"
          :options="options"
        />
      </b-col>
      <b-col cols="6">
        <pie-chart
          id="pie-chart-order-types"
          v-if="!isLoading"
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
  name: "OrderStats",
  data() {
    return {
      isLoading: false,
      chartdataOrderTypesBar: {},
      chartdataOrderTypesPie: {},
      chartdataCountsOrderTypesBar: {},
      chartdataCountsOrderTypesPie: {},
      chartdataCountsBar: {},
      chartdataCountsPie: {},
      chartdataCountsYearOrdertypesBar: {},
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
      optionsStacked: {
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
  methods: {
    getRandomColorOrderType(txt) {
      if (!(txt in this.colorsOrderTypes)) {
        this.colorsOrderTypes[txt] = `#${Math.floor(Math.random()*16777215).toString(16)}`
      }

      return this.colorsOrderTypes[txt]
    },
    render(orderTypeStatsData, monthsStatsData, orderTypesMonthStatsData, countsYearOrdertypeStats) {
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
      } // chartdataCountsOrderTypesBar

      this.chartdataCountsBar = {
        labels,
        datasets: [{
          label: this.$trans('Total orders per month'),
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

      let monthDataOrderTypesBar = [], monthDataOrderTypesPie = [], orderTypesLabels = [], orderTypesColors = []
      for (const [orderType, _data] of Object.entries(orderTypeStatsData.order_types)) {
        orderTypesLabels.push(orderType)
        orderTypesColors.push(this.getRandomColorOrderType(orderType))
        monthDataOrderTypesPie.push(_data.perc)
        monthDataOrderTypesBar.push(_data.count)
      }

      this.chartdataOrderTypesBar = {
        labels: orderTypesLabels,
        datasets: [{
          label: this.$trans('Order types'),
          data: monthDataOrderTypesBar,
          backgroundColor: orderTypesColors,
        }]
      }

      this.chartdataOrderTypesPie = {
        labels: orderTypesLabels,
        datasets: [{
          data: monthDataOrderTypesPie,
          backgroundColor: orderTypesColors,
        }]
      }

      let datasets = []
      for (let j=0; j<orderTypesMonthStatsData.order_types.length; j++) {
        const order_type = orderTypesMonthStatsData.order_types[j]

        let data = []
        for (let i=1; i<13; i++) {
          const monthText = `${i}`
          if (monthText in orderTypesMonthStatsData.order_counts) {
            if (order_type in orderTypesMonthStatsData.order_counts[monthText]) {
              data.push(orderTypesMonthStatsData.order_counts[monthText][order_type].count)
            } else
              data.push(0)
          } else {
            data.push(0)
          }
        }

        datasets.push({
          label: order_type,
          backgroundColor: this.getRandomColorOrderType(order_type),
          data
        })
      }

      this.chartdataCountsOrderTypesBar = {
        labels,
        datasets
      }

      //chartdataCountsYearOrdertypesBar
      let datasetsYear = [], labelsYear = []
      for (let j=0; j<countsYearOrdertypeStats.order_types.length; j++) {
        const order_type = countsYearOrdertypeStats.order_types[j]

        let data = []
        for (let i=countsYearOrdertypeStats.min_year; i<countsYearOrdertypeStats.max_year+1; i++) {
          const yearText = `${i}`
          // 2023
          // 2020
          // diff = 3
          if (labelsYear.length <= countsYearOrdertypeStats.max_year - countsYearOrdertypeStats.min_year) {
            labelsYear.push(yearText)
          }
          if (yearText in countsYearOrdertypeStats.order_counts) {
            if (order_type in countsYearOrdertypeStats.order_counts[yearText]) {
              data.push(countsYearOrdertypeStats.order_counts[yearText][order_type].count)
            } else
              data.push(0)
          } else {
            data.push(0)
          }
        }

        datasetsYear.push({
          label: order_type,
          backgroundColor: this.getRandomColorOrderType(order_type),
          data
        })
      }

      this.chartdataCountsYearOrdertypesBar = {
        labels: labelsYear,
        datasets: datasetsYear
      }
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
