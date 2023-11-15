<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><b-icon icon="file-earmark-bar-graph-fill"></b-icon>Order Stats</h3>
        <div class="flex-columns">
          view 
          <router-link class="btn button" to="./year-stats">year</router-link>
          <router-link class="btn button" to="./month-stats" disabled>month</router-link>
        </div>
      </div>
    </header>
    <div class="panel">
      <b-row align-v="center">
        <b-col cols="2">
          <b-link @click.prevent="backMonth" v-bind:title="$trans('Month back')">
            <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
          </b-link>
        </b-col>
        <b-col cols="8" class="text-center">
          <h4>{{ $trans('Total orders in ') }} {{ monthTxt }} {{ year }}</h4>
          <b-row>
            <b-col cols="3">
            </b-col>
            <b-col cols="2">
              {{ $trans('Order type') }}:
            </b-col>
            <b-col cols="4">
              <OrderTypesSelect
                :order-type.sync="orderType"
                :include-all="true"
              />
            </b-col>
            <b-col cols="3">
            </b-col>
          </b-row>
        </b-col>
        <b-col cols="2">
          <div class="float-right">
            <b-link @click.prevent="nextMonth" v-bind:title="$trans('Next month') ">
              <b-icon-arrow-right font-scale="1.8"></b-icon-arrow-right>
            </b-link>
          </div>
        </b-col>
      </b-row>

      <div class="app-grid">
        <b-row>
          <b-col cols="6">
            <bar-chart
              v-if="loaded && !isLoading"
              :chart-data="chartdataMonthBar"
              :options="options"
            />
          </b-col>
          <b-col cols="6">
            <pie-chart
              id="pie-chart-year"
              v-if="!isLoading"
              :chart-data="chartdataMonthPie"
              :options="pieOptions"
            />
          </b-col>
        </b-row>
      </div>

      <div class="app-grid">
        <b-row v-for="(charts, week) in this.weekChartData" :key="week" class="chart-section">
          <b-col cols="6">
            <bar-chart
              :id="`bar-chart-order-types-${week}`"
              v-if="!isLoading"
              :chart-data="charts.bar"
              :options="options"
            />
          </b-col>
          <b-col cols="6">
            <pie-chart
              :id="`pie-chart-order-types-${week}`"
              v-if="!isLoading"
              :chart-data="charts.pie"
              :options="pieOptions"
            />
          </b-col>
        </b-row>
      </div>

      <div class="app-grid">
        <b-row v-for="(charts, week) in this.weekChartDataAssignedOrders" :key="week" class="chart-section">
          <b-col cols="6">
            <bar-chart
              :id="`bar-chart-assigned-orders-${week}`"
              v-if="!isLoading"
              :chart-data="charts.bar"
              :options="options"
            />
          </b-col>
          <b-col cols="6">
            <pie-chart
              :id="`pie-chart-assigned-orders-${week}`"
              v-if="!isLoading"
              :chart-data="charts.pie"
              :options="pieOptions"
            />
          </b-col>
        </b-row>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment/min/moment-with-locales'

import monthModel from '@/models/orders/Month.js'

import BarChart from "@/components/BarChart.vue"
import PieChart from "@/components/PieChart.vue"
import OrderStatusColorSpan from '@/components/OrderStatusColorSpan.vue'
import OrderTypesSelect from '@/components/OrderTypesSelect.vue'
import ChartJsPluginDataLabels from 'chartjs-plugin-datalabels'

export default {
  data() {
    return {
      isLoading: false,
      customerData: null,
      weekTotals: null,
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            },
            gridLines: {
              display: false
            }
          }],
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
              let datasets = ctx.chart.data.datasets;
              if (datasets.indexOf(ctx.dataset) === datasets.length - 1) {
                return `${value}%`
              }
            },
            color: '#fff',
          }
        }
      },
      loaded: false,
      orderType: 'all',
      today: null,
      month: null,
      year: null,
      monthTxt: null,
      statuscodes: null,
      weekChartData: {},
      weekChartDataAssignedOrders: {},
      assignedColors: {},
      chartdataMonthPie: {},
      chartdataMonthBar: {}
    }
  },
  components: {
    BarChart,
    PieChart,
    OrderStatusColorSpan,
    OrderTypesSelect,
    ChartJsPluginDataLabels,
  },
  watch: {
    orderType: function(val) {
      this.setOrderType(val)
      this.loadData()
    }
  },
  methods: {
    setOrderType(order_type) {
      this.orderType = order_type
    },
    nextMonth() {
      this.today.add(1, 'month')

      this.month = this.today.month() + 1
      this.monthTxt = this.today.format('MMMM')
      this.year = this.today.year()

      this.loadData()
    },
    backMonth() {
      this.today.subtract(1, 'month')

      this.month = this.today.month() + 1
      this.monthTxt = this.today.format('MMMM')
      this.year = this.today.year()

      this.loadData()
    },
    getRandomColor(numAssigned) {
      if (!(numAssigned in this.assignedColors)) {
        this.assignedColors[numAssigned] = `#${Math.floor(Math.random()*16777215).toString(16)}`
      }

      return this.assignedColors[numAssigned]
    },
    async loadData() {
      this.isLoading = true
      this.weekChartData = {}
      this.weekChartDataAssignedOrders = {}

      try {
        monthModel.setListArgs(`order_type=${this.orderType}&year=${this.year}&month=${this.month}`)
        const {monthData, statusesData, assignedOrdersData } = await monthModel.getMonthData(this.statuscodes)
        const weeks = Object.keys(monthData.items)

        // fill bar graph data and set labels/fields
        let monthDataBar = [], monthDataPie = [], labels = [], colors = []
        for (const week of weeks) {
          const weekText =  `${this.$trans("week")} ${week}`
          labels.push(weekText)
          colors.push(this.getRandomColor(weekText))
          if (week in monthData.items) {
            monthDataBar.push(monthData.items[week].count)
            monthDataPie.push(monthData.items[week].perc)
          } else {
            monthDataBar.push(0)
            monthDataPie.push("0.00")
          }
        }

        this.chartdataMonthBar = {
          labels,
          datasets: [{
            label: `Total orders for order type: ${this.orderType} (Total: ${monthData['total']})`,
            data: monthDataBar,
            backgroundColor: colors,
          }]
        }

        this.chartdataMonthPie = {
          labels,
          datasets: [{
            label: `Total orders for order type: ${this.orderType}`,
            data: monthDataPie,
            backgroundColor: colors,
          }]
        }

        // for each week, gather order statuses and create stats data
        for (const [week, statuscodes_data] of Object.entries(statusesData)) {
          let pieGraphDataOrderStatuses = [], barGraphDataOrderStatuses = [],
            labelsOrderStatuses = [], colors = [];

          for (const [statuscode, _data] of Object.entries(statuscodes_data.items)) {
            labelsOrderStatuses.push(statuscode)
            pieGraphDataOrderStatuses.push(_data.perc)
            barGraphDataOrderStatuses.push(_data.count)
            colors.push(_data.color)
          }

          this.weekChartData[week] = {
            pie: {
              labels: labelsOrderStatuses,
              datasets: [{
                data: pieGraphDataOrderStatuses,
                backgroundColor: colors,
              }]
            },
            bar: {
              labels: labelsOrderStatuses,
              datasets: [{
                label: `Order statuses in week ${week} (Total: ${statusesData[week]['total']})`,
                data: barGraphDataOrderStatuses,
                backgroundColor: colors,
              }]
            }
          }
        }

        // for each week, gather assigned orders and create stats data
        for (const [week, _assignedOrdersData] of Object.entries(assignedOrdersData)) {
          let pieGraphDataAssignedOrders = [], barGraphDataAssignedOrders = [],
            labelsAssignedOrders = [], colors = [];

          for (const [numAssigned, _data] of Object.entries(_assignedOrdersData.items)) {
            const color = this.getRandomColor(numAssigned)
            labelsAssignedOrders.push(`${numAssigned} x`)
            pieGraphDataAssignedOrders.push(_data.perc)
            barGraphDataAssignedOrders.push(_data.count)
            colors.push(color)
          }

          if (!barGraphDataAssignedOrders.length) {
            continue
          }

          this.weekChartDataAssignedOrders[week] = {
            pie: {
              labels: labelsAssignedOrders,
              datasets: [{
                data: pieGraphDataAssignedOrders,
                backgroundColor: colors,
              }]
            },
            bar: {
              labels: labelsAssignedOrders,
              datasets: [{
                label: `# assigned orders in week ${week} (Total: ${assignedOrdersData[week]['total']})`,
                data: barGraphDataAssignedOrders,
                backgroundColor: colors,
              }]
            }
          }
        }

        this.loaded = true
        this.isLoading = false
       } catch(error) {
        console.log('error fetching month data', error)
      }
    }
  },
  async mounted () {
    const lang = this.$store.getters.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)

    this.today = this.$moment()

    this.month = this.today.month() + 1
    this.monthTxt = this.today.format('MMMM')
    this.year = this.today.year()

    // get statuscodes and load orders
    this.statuscodes = await this.$store.dispatch('getStatuscodes')
    await this.loadData()
  }
}
</script>
<style scoped>
.chart-section {
  padding-top: 10px;
  padding-bottom: 10px;
}
</style>
