<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><b-icon icon="file-earmark-bar-graph-fill"></b-icon>{{ $trans("Order stats") }}</h3>
        <div class="flex-columns">
          <a>{{ $trans("view") }}</a>
          <router-link class="btn button" to="./year-stats" disabled>{{ $trans("year") }}</router-link>
          <router-link class="btn button" to="./month-stats">{{ $trans("month") }}</router-link>
        </div>
      </div>
    </header>

    <div class="panel">
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
      <div class="app-grid">
      <b-row>
        <b-col cols="6">
          <bar-chart
            v-if="loaded && !isLoading"
            :chart-data="chartdataYearBar"
            :options="options"
          />
        </b-col>
        <b-col cols="6">
          <pie-chart
            id="pie-chart-year"
            v-if="!isLoading"
            :chart-data="chartdataYearPie"
            :options="pieOptions"
          />
        </b-col>
      </b-row>
    </div>

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
  </div>
</template>

<script>
import moment from 'moment/min/moment-with-locales'
import ChartJsPluginDataLabels from 'chartjs-plugin-datalabels'
import yearModel from '../../models/orders/Year.js'
import BarChart from "../../components/BarChart.vue"
import PieChart from "../../components/PieChart.vue"
import OrderStatusColorSpan from '../../components/OrderStatusColorSpan.vue'
import OrderTypesSelect from '../../components/OrderTypesSelect.vue'


let d = new Date();

export default {
  data() {
    return {
      isLoading: false,
      customerData: null,
      monthTotals: null,
      chartdataYearBar: {},
      chartdataYearPie: {},
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
            color: '#fff'
          }
        }
      },
      customerFields: [],
      loaded: false,
      orderType: 'all',
      year: d.getYear() + 1900,
      statuscodes: null,
      monthChartData: {},
      monthColors: {},
      gradient: ['#ff9933','#ff9c36','#fea03a','#fea33d','#fea741','#fdaa44','#fdae48','#fdb14b','#fdb54f','#fcb852','#fcbc56','#fcbf59','#fbc35d','#fbc660']
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
    getRandomColor(month) {
      if (!(month in this.monthColors)) {
        this.monthColors[month] = `#${Math.floor(Math.random()*16777215).toString(16)}`
      }

      return this.monthColors[month]
    },
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
    async loadData() {
      this.isLoading = true
      this.monthChartData = {}

      try {
        yearModel.setListArgs(`order_type=${this.orderType}&year=${this.year}`)
        const { statusesData, yearData } = await yearModel.getYearData(this.statuscodes)

        // fill bar graph data and set labels/fields
        let monthDataBar = [], monthDataPie = [], labels = [], colors = []
        for (let i=0; i<12; i++) {
          const monthText =  i < 10 ? `0${i + 1}` : `${i}`
          const date = this.$moment(`${this.year}-${monthText}-1`, 'D-MM-YYYY')
          const monthTextLong = date.format('MMM')
          labels.push(monthTextLong)
          colors.push(this.getRandomColor(monthText))
          if (monthText in yearData.items) {
            monthDataBar.push(yearData.items[monthText].count)
            monthDataPie.push(yearData.items[monthText].perc)
          } else {
            monthDataBar.push(0)
            monthDataPie.push("0.00")
          }
        }

        this.chartdataYearBar = {
          labels,
          datasets: [{
            label: `Total orders for order type: ${this.orderType} (Total: ${yearData['total']})`,
            data: monthDataBar,
            backgroundColor: this.gradient
          }]
        }
        this.chartdataYearPie = {
          labels,
          datasets: [{
            label: `Total orders for order type: ${this.orderType}`,
            data: monthDataPie,
            backgroundColor: this.gradient
          }]
        }

        // for each month, gather order statuses and create stats data
        for (const [month, statuscodes_data] of Object.entries(statusesData)) {
          let pieGraphDataOrderStatuses = [], barGraphDataOrderStatuses = [],
            labelsOrderStatusesPie = [], labelsOrderStatusesBar = [], colors = [];

          for (const [statuscode, _data] of Object.entries(statuscodes_data.items)) {
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
