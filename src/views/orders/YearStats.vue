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

    <b-table
      small
      id="year-table"
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
      <template v-for="month in months" v-slot:[`cell(mon${month})`]="{ item }">
        <OrderStatusColorSpan :data="item.months[month]" :key="month" />
      </template>
      <template #cell(totals)="data">{{ getCustomerTotal(data.item.name )}}</template>
    </b-table>
  </div>
</template>

<script>
const moment = require('moment')
import BarChart from "@/components/BarChart"
import OrderStatusColorSpan from '@/components/OrderStatusColorSpan'
import OrderTypesSelect from '@/components/OrderTypesSelect';
import yearModel from '@/models/orders/Year'

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
      customerFields: [],
      loaded: false,
      orderType: 'all',
      year: d.getYear() + 1900,
      statuscodes: null,
      months: []
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
    loadData() {
      this.isLoading = true
      yearModel.setListArgs(`order_type=${this.orderType}&year=${this.year}`)
      yearModel.getYearData(this.statuscodes).then((results) => {
        this.setMonthTotals(results)
        this.customerData = results
        this.customerFields = [{
          key: 'name',
          label: this.$trans('Customer'),
          thAttr: {width: '20%'}
        }]

        const monthWidth = Math.ceil((100-20-5)/12)

        // fill graph data and set labels/fields
        let monthData = [], labels = []
        this.months = []
        for (let i=0; i<12; i++) {
          const monthText = `${i + 1}`
          this.months.push(monthText)
          const date = this.$moment(`2021-${monthText}-1`, 'D-MM-YYYY')
          const monthTextLong = date.format('MMM')
          const label = `${monthTextLong} (${this.getMonthTotal(monthText)})`
          labels.push(monthTextLong)
          monthData.push(this.monthTotals[monthText])
          this.customerFields.push({
            key: `mon${monthText}`,
            label,
            thAttr: {width: `${monthWidth}%`}
          })
        }

        this.customerFields.push({
          key: 'totals',
          label: this.$trans('Totals'),
          thAttr: {width: '5%'}
        })

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
      }).catch((error) => {
        console.log(error)
      })
    }
  },
  mounted () {
    const lang = this.$store.getters.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)

    // get statuscodes and load orders
    this.$store.dispatch('getStatuscodes').then((statuscodes) => {
      this.statuscodes = statuscodes
      this.loadData()
    })
  }
}
</script>
