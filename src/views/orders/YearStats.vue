<template>
  <div class="app-grid">
    <b-row align-v="center">
      <b-col cols="2">
        <b-link @click.prevent="backYear" v-bind:title="$trans('Year back')">
          <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
        </b-link>
      </b-col>
      <b-col cols="8" class="text-center">
        <h4>{{ $trans('Total orders in ' + year ) }}</h4>
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
          <b-link @click.prevent="nextYear" v-bind:title="$trans('Next year') ">
            <b-icon-arrow-right font-scale="1.8"></b-icon-arrow-right>
          </b-link>
        </div>
      </b-col>
    </b-row>

    <bar-chart
      v-if="loaded && !isLoading"
      :chart-data="chartdata"
      :options="options"
    />

    <div class="app-grid">
      <b-row v-for="(charts, month) in this.monthChartData" :key="month" class="chart-section">
        <b-col cols="6">
          <bar-chart
            :id="`bar-chart-order-types-${month}`"
            v-if="!isLoading"
            :chart-data="charts.bar"
            :options="options"
          />
        </b-col>
        <b-col cols="6">
          <pie-chart
            :id="`pie-chart-order-types-${month}`"
            v-if="!isLoading"
            :chart-data="charts.pie"
            :options="pieOptions"
          />
        </b-col>
      </b-row>
    </div>
  </div>
</template>

<script>
import moment from 'moment'

import yearModel from '@/models/orders/Year.js'

import BarChart from "@/components/BarChart.vue"
import PieChart from "@/components/PieChart.vue"
import OrderStatusColorSpan from '@/components/OrderStatusColorSpan.vue'
import OrderTypesSelect from '@/components/OrderTypesSelect.vue'
import ChartJsPluginDataLabels from 'chartjs-plugin-datalabels'

let d = new Date();

export default {
  data() {
    return {
      isLoading: false,
      customerData: null,
      monthTotals: null,
      chartdata: [],
      options: {
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
      customerFields: [],
      loaded: false,
      orderType: 'all',
      year: d.getYear() + 1900,
      statuscodes: null,
      months: [],
      monthChartData: {}
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
    denormalizeOrderType() {
      return this.orderType().replace('_', ' ')
    },
    setOrderType(order_type) {
      this.orderType = order_type
    },
    nextYear() {
      this.year = this.year + 1
      this.loadData()
    },
    backYear() {
      this.year = this.year - 1
      this.loadData()
    },
    setMonthTotals(yearData) {
      let monthTotals = {}, customerTotals = {}

      for (let i=0; i<yearData.length; i++) {
        const name = yearData[i].name

        for (let month=0; month<12; month++) {
          const monthText = `${month + 1}`

          if (!(monthText in monthTotals)) {
            monthTotals[monthText] = 0
          }

          if (!(name in customerTotals)) {
            customerTotals[name] = 0
          }

          monthTotals[monthText] += month in yearData[i].months && typeof yearData[i].months[month] !== 'undefined' ? yearData[i].months[month].length : 0
          customerTotals[name] += month in yearData[i].months && typeof yearData[i].months[month] !== 'undefined' ? yearData[i].months[month].length : 0
        }
      }

      this.monthTotals = monthTotals
      this.customerTotals = customerTotals
    },
    getMonthTotal: function (month) {
      return month in this.monthTotals ? this.monthTotals[month] : 0
    },
    getCustomerTotal: function (name) {
      return name in this.customerTotals ? this.customerTotals[name] : 0
    },
    async loadData() {
      this.isLoading = true
      this.monthChartData = {}

      try {
        yearModel.setListArgs(`order_type=${this.orderType}&year=${this.year}`)
        const { statusesData, resultYearData } = await yearModel.getYearData(this.statuscodes)

        this.setMonthTotals(resultYearData)
        this.customerData = resultYearData

        // fill graph data and set labels/fields
        let monthData = [], labels = []
        this.months = []
        for (let i=0; i<12; i++) {
          const monthText = `${i + 1}`
          this.months.push(monthText)
          const date = this.$moment(`2021-${monthText}-1`, 'D-MM-YYYY')
          const monthTextLong = date.format('MMM')
          labels.push(monthTextLong)
          monthData.push(this.monthTotals[monthText])
        }

        this.chartdata = {
          labels,
          datasets: [{
            label: `Total orders for order type: ${this.orderType}`,
            data: monthData,
            backgroundColor: '#f87979',
          }]
        }

        // for each month, gather order statuses and create stats data
        for (const [month, statuscodes_data] of Object.entries(statusesData)) {
          let pieGraphDataOrderStatuses = [], barGraphDataOrderStatuses = [],
            labelsOrderStatusesPie = [], labelsOrderStatusesBar = [], colors = [];

          for (const [statuscode, _data] of Object.entries(statuscodes_data.statuscodes)) {
            labelsOrderStatusesPie.push(statuscode)
            labelsOrderStatusesBar.push(statuscode)
            pieGraphDataOrderStatuses.push(_data.perc)
            barGraphDataOrderStatuses.push(_data.count)
            colors.push(_data.color)
          }

          this.monthChartData[month] = {
            pie: {
              labels: labelsOrderStatusesPie,
              datasets: [{
                data: pieGraphDataOrderStatuses,
                backgroundColor: colors,
              }]
            },
            bar: {
              labels: labelsOrderStatusesBar,
              datasets: [{
                label: `Order statuses in month ${month} (Total: ${statusesData[month]['total']})`,
                data: barGraphDataOrderStatuses,
                backgroundColor: '#f87979',
              }]
            }
          }
        }

        this.loaded = true
        this.isLoading = false
      } catch(error) {
        console.log('error fetching year data', error)
      }
    }
  },
  async mounted () {
    const lang = this.$store.getters.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)

    // get statuscodes and load orders
    this.statuscodes = await this.$store.dispatch('getStatuscodes')
    this.loadData()
  }
}
</script>
