<template>
  <div class="app-grid">
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

    <bar-chart
      v-if="loaded && !isLoading"
      :chart-data="chartdata"
      :options="options"
    />

    <b-table
      small
      id="month-table"
      :busy='isLoading'
      :fields="customerFields"
      :items="customerData"
      responsive="md"
      class="data-table"
    >
      <template #table-busy>
        <div class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
          <strong>{{ $trans('Loading...') }}</strong>
        </div>
      </template>
      <template v-for="week in weeks" v-slot:[`cell(week${week})`]="{ item }">
        <OrderStatusColorSpan :data="item.weeks[week]" :key="week" />
      </template>
      <template #cell(totals)="data">{{ getCustomerTotal(data.item.name )}}</template>
    </b-table>
  </div>
</template>

<script>
import moment from 'moment'

import monthModel from '@/models/orders/Month.js'

import BarChart from "@/components/BarChart.vue"
import OrderStatusColorSpan from '@/components/OrderStatusColorSpan.vue'
import OrderTypesSelect from '@/components/OrderTypesSelect.vue'

export default {
  data() {
    return {
      isLoading: false,
      customerData: null,
      weekTotals: null,
      chartdata: [],
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
      customerFields: [],
      loaded: false,
      orderType: 'all',
      today: null,
      month: null,
      year: null,
      monthTxt: null,
      statuscodes: null,
      weeks: []
    }
  },
  components: {
    BarChart,
    OrderStatusColorSpan,
    OrderTypesSelect,
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
    setWeekTotals(monthData) {
      let weekTotals = {}, customerTotals = {}

      for (let i=0; i<monthData.length; i++) {
        const name = monthData[i].name

        for (let j=0; j<this.weeks.length; j++) {
          const weekText = `${this.weeks[j]}`

          if (!(weekText in weekTotals)) {
            weekTotals[weekText] = 0
          }

          if (!(name in customerTotals)) {
            customerTotals[name] = 0
          }

          weekTotals[weekText] += weekText in monthData[i].weeks && typeof monthData[i].weeks[weekText] !== 'undefined' ? monthData[i].weeks[weekText].length : 0
          customerTotals[name] += weekText in monthData[i].weeks && typeof monthData[i].weeks[weekText] !== 'undefined' ? monthData[i].weeks[weekText].length : 0
        }
      }

      this.weekTotals = weekTotals
      this.customerTotals = customerTotals
    },
    getWeekTotal: function (week) {
      return week in this.weekTotals ? this.weekTotals[week] : 0
    },
    getCustomerTotal: function (name) {
      return name in this.customerTotals ? this.customerTotals[name] : 0
    },
    getWeeks(weeksObject) {
      let weeks = []
      for(const [week, _] of Object.entries(weeksObject)) {
        weeks.push(week)
      }

      return weeks
    },
    getTotalForDay(data, day) {
      let total = 0
      for (let i=0; i<data.length; i++) {
        for (const[_, orders] of Object.entries(data[i].weeks)) {
          for (let j=0; j<orders.length; j++) {
            if (orders[j].day === day) {
              total++
            }
          }
        }
      }

      return total
    },
    loadData() {
      this.isLoading = true
      monthModel.setListArgs(`order_type=${this.orderType}&year=${this.year}&month=${this.month}`)
      monthModel.getMonthData(this.statuscodes)
        .then((results) => {
          this.weeks = results.weeks
          const monthResults = results.results

          this.setWeekTotals(monthResults)
          this.customerData = monthResults
          this.customerFields = [{
            key: 'name',
            label: this.$trans('Customer'),
            thAttr: {width: '30%'}
          }]

          const weekWidth = Math.ceil((100-30-5)/this.weeks.length)

          for (let i = 0; i<this.weeks.length; i++) {
            const label = `${this.$trans('week')} ${this.weeks[i]} (${this.getWeekTotal(this.weeks[i])})`

            this.customerFields.push({
              key: `week${this.weeks[i]}`,
              label,
              thAttr: {width: `${weekWidth}%`}
            })
          }

          this.customerFields.push({
            key: 'totals',
            label: this.$trans('Totals'),
            thAttr: {width: '5%'}
          })

          let monthData = [], labels = []
          for (let day=1; day<=this.today.daysInMonth(); day++) {
            monthData.push(this.getTotalForDay(monthResults, day))
            labels.push(day)
          }

          this.chartdata = {
              labels,
              datasets: [{
                label: `Total orders for order type: ${this.orderType}`,
                data: monthData,
                backgroundColor: '#f87979',
              }]
            }

            this.loaded = true
            this.isLoading = false
         })
        .catch((error) => {
          console.log(error)
        })
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
    this.$store.dispatch('getStatuscodes')
      .then((statuscodes) => {
        this.statuscodes = statuscodes
        this.loadData()
      })
  }
}
</script>
