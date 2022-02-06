<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="subnav-pills">
      <b-nav pills>
        <b-nav-item
          v-for="item in viewMethods"
          :active="item.value == activeViewMethod"
          :key="item.value"
          @click="activeViewMethod = item.value"
          >
          {{ item.label }}
        </b-nav-item>
      </b-nav>
    </div>

    <!-- week -->
    <div class="app-detail" v-if="!isLoading && activeViewMethod === 'week'">
      <b-row align-v="center">
        <b-col cols="2">
          <b-link @click.prevent="backWeek" v-bind:title="$trans('Week back')">
            <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
          </b-link>
        </b-col>
        <b-col cols="8" class="text-center">
          <h4>{{ $trans('Week totals for') }} {{ fullName }} {{ $trans('starting from') }} {{ startDate.format('DD/MM/YYYY') }}</h4>
        </b-col>
        <b-col cols="2">
          <div class="float-right">
            <b-link @click.prevent="nextWeek" v-bind:title="$trans('Next week') ">
              <b-icon-arrow-right font-scale="1.8"></b-icon-arrow-right>
            </b-link>
          </div>
        </b-col>
      </b-row>

      <b-table
        small
        id="weeks-table"
        :fields="weekHeaders"
        :items="weekData"
        responsive="md"
        class="data-table"
      />

      <b-row align-v="center">
        <b-col cols="12">
          <pie-chart
            id="pie-chart-week"
            v-if="!isLoading && pieChartdataWeek"
            :chart-data="pieChartdataWeek"
            :options="optionsWeek"
          />
          <p class="no-data" v-if="!pieChartdataWeek">
            {{ $trans('No graph data for week starting from') }} {{ startDate.format('DD/MM/YYYY') }}
          </p>
        </b-col>
      </b-row>
    </div>

    <!-- quarters -->
    <div class="app-detail" v-if="!isLoading && activeViewMethod === 'quarter'">
      <b-row align-v="center">
        <b-col cols="2">
          <b-link @click.prevent="backYear" v-bind:title="$trans('Year back')">
            <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
          </b-link>
        </b-col>
        <b-col cols="8" class="text-center">
          <h4>{{ $trans('Quarter totals for') }} {{ fullName }} {{ $trans('in') }} {{ year }}</h4>
        </b-col>
        <b-col cols="2">
          <div class="float-right">
            <b-link @click.prevent="nextYear" v-bind:title="$trans('Next year') ">
              <b-icon-arrow-right font-scale="1.8"></b-icon-arrow-right>
            </b-link>
          </div>
        </b-col>
      </b-row>

      <b-table
        small
        id="quarter-table"
        :fields="quarterHeaders"
        :items="quarterData"
        responsive="md"
        class="data-table"
      />

      <b-row align-v="center">
        <b-col cols="6">
          <pie-chart
            id="pie-chart-quarter1"
            v-if="!isLoading && pieChartdataQuarters[0]"
            :chart-data="pieChartdataQuarters[0]"
            :options="options[0]"
          />
          <p class="no-data" v-if="!pieChartdataQuarters[0]">{{ $trans('No graph data for quarter 1') }}</p>
        </b-col>
        <b-col cols="6">
          <pie-chart
            id="pie-chart-quarter2"
            v-if="!isLoading && pieChartdataQuarters[1]"
            :chart-data="pieChartdataQuarters[1]"
            :options="options[1]"
          />
          <p class="no-data" v-if="!pieChartdataQuarters[1]">{{ $trans('No graph data for quarter 2') }}</p>
        </b-col>
      </b-row>
      <b-row align-v="center">
        <b-col cols="6">
          <pie-chart
            id="pie-chart-quarter3"
            v-if="!isLoading && pieChartdataQuarters[2]"
            :chart-data="pieChartdataQuarters[2]"
            :options="options[2]"
          />
          <p class="no-data" v-if="!pieChartdataQuarters[2]">{{ $trans('No graph data for quarter 3') }}</p>
        </b-col>
        <b-col cols="6">
          <pie-chart
            id="pie-chart-quarter4"
            v-if="!isLoading && pieChartdataQuarters[3]"
            :chart-data="pieChartdataQuarters[3]"
            :options="options[3]"
          />
          <p class="no-data" v-if="!pieChartdataQuarters[3]">{{ $trans('No graph data for quarter 4') }}</p>
        </b-col>
      </b-row>
    </div>

    <footer class="modal-footer">
      <b-button @click="goBack" class="btn btn-info" type="button" variant="primary">
        {{ $trans('Back') }}
      </b-button>
    </footer>
  </b-overlay>
</template>

<script>
import PieChart from "@/components/PieChart"
import engineerModel from '@/models/company/UserEngineer'
const moment = require('moment')

let d = new Date();
const monday = window.locale === 'en' ? 1 : 0

export default {
  components: {
    PieChart,
  },
  data() {
    return {
      activeViewMethod: 'quarter',
      viewMethods: [
      {
        label: 'Per quarter',
        value: 'quarter'
      },
      {
        label: 'Per week',
        value: 'week'
      }],
      options: [],
      optionsWeek: null,
      startDate: moment().weekday(monday),
      year: d.getYear() + 1900,
      isLoading: false,
      fullName: null,
      quarterHeaders: [],
      quarterData: [],
      pieChartdataQuarters: [],
      weekHeaders: [],
      weekData: [],
      pieChartdataWeek: null,
      orderTypeColors: {},
      types: [
      {
        label: 'Work total',
        key: 'work_total'
      },
      {
        label: 'Travel total',
        key: 'travel_total'
      },
      {
        label: 'Distance total',
        key: 'distance_total'
      }]
    }
  },
  watch: {
    activeViewMethod: {
      handler() {
        this.render()
      }
    }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  methods: {
    render() {
      if (this.activeViewMethod === 'week') {
        this.renderWeek()
      }

      if (this.activeViewMethod === 'quarter') {
        this.renderQuarter()
      }
    },
    nextYear() {
      this.year = this.year + 1
      this.renderQuarter()
    },
    backYear() {
      this.year = this.year - 1
      this.renderQuarter()
    },
    nextWeek() {
      this.startDate.add(7, 'days');
      this.renderWeek();
    },
    backWeek() {
      this.startDate.subtract(7, 'days');
      this.renderWeek();
    },
    goBack() {
      this.$router.push({name: 'users-engineers'})
    },
    getOrderTypeColor(orderType) {
      if (!(orderType in this.orderTypeColors)) {
        this.orderTypeColors[orderType] = `#${Math.floor(Math.random()*16777215).toString(16)}`
      }

      return this.orderTypeColors[orderType]
    },
    setQuarterChartdata(totals) {
      for (let i=0; i<totals.length; i++) {
        let pieGraphDataOrderTypes = [], labelsOrderTypes = [], colors = []

        for (const [orderType, data] of Object.entries(totals[i].work_hours_status_perc)) {
          if (!data) {
            continue
          }

          labelsOrderTypes.push(`${orderType} (${totals[i].work_hours_status[orderType]})`)
          pieGraphDataOrderTypes.push(data)
          colors.push(this.getOrderTypeColor(orderType))
        }

        if (pieGraphDataOrderTypes.length) {
          this.options[i] = {
            responsive: true,
            maintainAspectRatio: false,
            title: {
              display: true,
              text: `Workhours per order type for quarter ${i+1}`
            }
          }

          this.pieChartdataQuarters[i] = {
            labels: labelsOrderTypes,
            datasets: [{
              data: pieGraphDataOrderTypes,
              backgroundColor: colors,
            }]
          }
        } else {
          this.options[i] = null
          this.pieChartdataQuarters[i] = null
        }
      }
    },
    setWeekChartdata(data) {
      let pieGraphDataOrderTypes = [], labelsOrderTypes = [], colors = [], dataFound = false

      this.optionsWeek = {
        responsive: true,
        maintainAspectRatio: false,
        title: {
          display: true,
          text: `Workhours per order type for week starting ${this.startDate.format('DD/MM/YYYY')}`
        }
      }

      for (const [orderType, _data] of Object.entries(data.work_hours_status_perc)) {
        if (!_data) {
          continue
        }

        labelsOrderTypes.push(`${orderType} (${data.work_hours_status[orderType]})`)
        pieGraphDataOrderTypes.push(_data)
        colors.push(this.getOrderTypeColor(orderType))
      }

      if (pieGraphDataOrderTypes.length) {
        this.pieChartdataWeek = {
          labels: labelsOrderTypes,
          datasets: [{
            data: pieGraphDataOrderTypes,
            backgroundColor: colors,
          }]
        }
      } else {
        this.pieChartdataWeek = null
      }
    },
    setQuarterHeaders(totals) {
      this.quarterHeaders = [{
        key: 'type',
        label: this.$trans('Type')
      }]

      for (let i=0; i<totals.length; i++) {
        this.quarterHeaders.push({
          key: `quarter${totals[i].quarter}`,
          label: totals[i].month
        })
      }
    },
    setWeekHeaders(totals) {
      this.weekHeaders = [{
        key: 'type',
        label: this.$trans('Type')
      }]

      for (let i=0; i<totals.length; i++) {
        this.weekHeaders.push({
          key: `day${totals[i].day}`,
          label: totals[i].weekday
        })
      }
    },
    setQuarterData(totals) {
      this.quarterData = []

      for (let i=0; i<this.types.length; i++) {
        let row = {
          type: this.types[i].label
        }

        for (let j=0; j<totals.length; j++) {
          const key = `quarter${totals[j].quarter}`
          let val = {}
          row[key] = totals[j].totals[this.types[i].key] ? totals[j].totals[this.types[i].key] : 0
        }

        this.quarterData.push(row)
      }
    },
    setWeekData(totals) {
      this.weekData = []

      for (let i=0; i<this.types.length; i++) {
        let row = {
          type: this.types[i].label
        }

        for (let j=0; j<totals.length; j++) {
          const key = `day${totals[j].day}`
          let val = {}
          row[key] = totals[j].totals[this.types[i].key] ? totals[j].totals[this.types[i].key] : 0
        }

        this.weekData.push(row)
      }
    },
    async renderQuarter() {
      this.isLoading = true
      const data = await engineerModel.stats_quarter(this.pk, this.year)
      this.fullName = data.engineer

      this.setQuarterHeaders(data.totals)
      this.setQuarterData(data.totals)
      this.setQuarterChartdata(data.totals)
      this.isLoading = false
    },
    async renderWeek() {
      this.isLoading = true
      const data = await engineerModel.stats_week(this.pk, this.startDate.format('YYYY-MM-DD'))
      this.fullName = data.engineer

      this.setWeekHeaders(data.totals)
      this.setWeekData(data.totals)
      this.setWeekChartdata(data)
      this.isLoading = false
    },
    async loadData() {
      try {
        this.render()
      } catch(error) {
        console.log('error fetching engineer details', error)
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error fetching engineer details')
        })

        this.isLoading = false
      }
    }
  },
  created() {
    this.loadData()
  }
}
</script>

<style scoped>
  p.no-data {
    text-align: center;
  }
</style>
