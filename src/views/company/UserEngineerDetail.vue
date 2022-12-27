<template>

  <b-overlay :show="isLoading" rounded="sm">
    <b-row align-v="center">
      <b-col cols="8">
        <div class="subnav-pills">
          <b-nav pills>
            <b-nav-item
              v-for="item in dateQueryMode"
              :active="item.value === activeDateQueryMode"
              :key="item.value"
              @click="activeDateQueryMode = item.value"
              >
              {{ item.label }}
            </b-nav-item>
          </b-nav>
        </div>
      </b-col>
      <b-col cols="4">
        <div class="float-right">
          <div class="subnav-pills">
            <b-nav pills>
              <b-nav-item
                v-for="item in dataModes"
                :active="item.value === activeDataMode"
                :key="item.value"
                @click="activeDataMode = item.value"
              >
                {{ item.label }}
              </b-nav-item>
            </b-nav>
          </div>
        </div>
      </b-col>
    </b-row>

    <div class="app-detail" v-if="!isLoading">
      <b-row align-v="center" v-if="activeDateQueryMode === 'week'">
        <b-col cols="2">
          <b-link @click.prevent="backWeek" v-bind:title="$trans('Week back')">
            <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
          </b-link>
        </b-col>
        <b-col cols="8" class="text-center">
          <h4>{{ $trans('Week totals for') }} {{ fullName }}, {{ $trans('starting from') }} {{ startDate.format('DD/MM/YYYY') }}</h4>
        </b-col>
        <b-col cols="2">
          <div class="float-right">
            <b-link @click.prevent="nextWeek" v-bind:title="$trans('Next week') ">
              <b-icon-arrow-right font-scale="1.8"></b-icon-arrow-right>
            </b-link>
          </div>
        </b-col>
      </b-row>

      <b-row align-v="center" v-if="activeDateQueryMode === 'month'">
        <b-col cols="2">
          <b-link @click.prevent="backMonth" v-bind:title="$trans('Month back')">
            <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
          </b-link>
        </b-col>
        <b-col cols="8" class="text-center">
          <h4>{{ $trans('Month totals for') }} {{ fullName }}, {{ monthTxt }} {{ year }}</h4>
        </b-col>
        <b-col cols="2">
          <div class="float-right">
            <b-link @click.prevent="nextMonth" v-bind:title="$trans('Next month') ">
              <b-icon-arrow-right font-scale="1.8"></b-icon-arrow-right>
            </b-link>
          </div>
        </b-col>
      </b-row>

      <b-row align-v="center" v-if="activeDateQueryMode === 'quarter'">
        <b-col cols="2">
          <b-link @click.prevent="backYear" v-bind:title="$trans('Year back')">
            <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
          </b-link>
        </b-col>
        <b-col cols="8" class="text-center">
          <h4>{{ $trans('Quarter totals for') }} {{ fullName }}, {{ year }}</h4>
        </b-col>
        <b-col cols="2">
          <div class="float-right">
            <b-link @click.prevent="nextYear" v-bind:title="$trans('Next year') ">
              <b-icon-arrow-right font-scale="1.8"></b-icon-arrow-right>
            </b-link>
          </div>
        </b-col>
      </b-row>

      <b-row align-v="center" v-if="activeDateQueryMode === 'year'">
        <b-col cols="2">
          <b-link @click.prevent="backYear" v-bind:title="$trans('Year back')">
            <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
          </b-link>
        </b-col>
        <b-col cols="8" class="text-center">
          <h4>{{ $trans('Year totals for') }} {{ fullName }}, {{ year }}</h4>
        </b-col>
        <b-col cols="2">
          <div class="float-right">
            <b-link @click.prevent="nextYear" v-bind:title="$trans('Next year') ">
              <b-icon-arrow-right font-scale="1.8"></b-icon-arrow-right>
            </b-link>
          </div>
        </b-col>
      </b-row>

      <!-- work hours -->
      <div class="work-hours">
        <h3>{{ $trans('Work hours')}}</h3>
        <b-table
          small
          id="data-table"
          :fields="headers"
          :items="workHoursData"
          responsive="md"
          class="data-table"
        />

        <b-row>
          <b-col cols="6">
            <bar-chart
              id="bar-chart-data"
              v-if="!isLoading && barChartdataWorkhours"
              :chart-data="barChartdataWorkhours"
              :options="options"
            />
            <p class="no-data" v-if="!barChartdataWorkhours">
              {{ $trans('No graph data for week starting from') }} {{ startDate.format('DD/MM/YYYY') }}
            </p>
          </b-col>
          <b-col cols="6">
            <pie-chart
              id="pie-chart-data"
              v-if="!isLoading && pieChartdataWorkhours"
              :chart-data="pieChartdataWorkhours"
              :options="optionsPie"
            />
            <p class="no-data" v-if="!pieChartdataWorkhours">
              {{ $trans('No graph data for week starting from') }} {{ startDate.format('DD/MM/YYYY') }}
            </p>
          </b-col>
        </b-row>

        <b-row>
          <b-col cols="12">
            <bar-chart
              id="bar-chart-period"
              v-if="!isLoading && barChartdataWorkhoursPeriod"
              :chart-data="barChartdataWorkhoursPeriod"
              :options="options"
            />
            <p class="no-data" v-if="!barChartdataWorkhoursPeriod">
              {{ $trans('No graph data for week starting from') }} {{ startDate.format('DD/MM/YYYY') }}
            </p>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="12">
            <pie-chart
              id="pie-chart-period"
              v-if="!isLoading && pieChartdataWorkhoursPeriod"
              :chart-data="pieChartdataWorkhoursPeriod"
              :options="optionsPie"
            />
            <p class="no-data" v-if="!pieChartdataWorkhoursPeriod">
              {{ $trans('No graph data for week starting from') }} {{ startDate.format('DD/MM/YYYY') }}
            </p>
          </b-col>
        </b-row>

      </div>

    </div>

    <div v-if="this.companycode === 'demo'">
      <div class="app-detail">
        <h3>{{ $trans("Pending orders") }}</h3>
        <b-table
          id="assignedorders-table"
          small
          :busy='isLoading'
          :fields="assignedordersFields"
          :items="assignedorders"
          responsive="md"
          class="data-table"
          sort-icon-left
        ></b-table>
      </div>

      <div class="app-detail events well" v-if="engineer">
        <div v-if="engineer && engineer.engineer.last_event">
          <h3>{{ engineer.full_name }} - {{ $trans('This day') }}</h3>
          <div>
            <p>{{ $trans('Status') }}:
              <span :class="getStatusClass">
                {{ engineer.engineer.last_event.event_type }}
                <span v-if="engineer.engineer.last_event.assigned_order">
                  ({{ engineer.engineer.last_event.assigned_order.order_name }})
                </span>
              </span>
            </p>
            <div v-if="engineer.engineer.last_event.measure_last_event_type">
              <p>{{ $trans('Seconds since') }} {{ engineer.engineer.last_event.measure_last_event_type }}: {{ engineer.engineer.last_event.secs_since_last_measure_event_type }}</p>
            </div>
            <div>
              <div v-for="eventType in stats">
                <p><strong>{{ eventType.event_type }}</strong></p>
                <p># events: {{ eventType.num_events }}</p>
                <p v-if="eventType.sum_duration">Total duration: {{ eventType.sum_duration }}</p>
                <p v-if="eventType.avg_duration">Avg. duration: {{ eventType.avg_duration }}</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <b-row>
            <b-col cols="6" role="group">
              <b-form-group
                label-size="sm"
                label-class="p-sm-0"
                v-bind:label="$trans('Event date')"
                label-for="event_date"
              >
                <b-form-datepicker
                  id="event_date"
                  size="sm"
                  class="p-sm-0"
                  v-model="event_date"
                  v-bind:placeholder="$trans('Choose a date')"
                  value="event_date"
                  locale="nl"
                  :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
                ></b-form-datepicker>
              </b-form-group>
            </b-col>
            <b-col cols="6" role="group">
              <b-form-group
                label-size="sm"
                label-class="p-sm-0"
                :label="$trans('Event time')"
                label-for="event_time"
              >
                <b-form-timepicker
                  id="event_time"
                  size="sm"
                  v-model="event_time"
                  :placeholder="$trans('Choose a time')"
                  :hour12=false
                ></b-form-timepicker>
              </b-form-group>
            </b-col>
          </b-row>
          <footer class="modal-footer">
            <b-button @click="doorOpen" class="btn btn-info" type="button" variant="primary"
                      :disabled="engineer.engineer.last_event && engineer.engineer.last_event.event_type === 'door open'"
            >
              {{ $trans('Trigger door open') }}
            </b-button>
            <b-button @click="doorClosed" class="btn btn-info" type="button" variant="primary"
                      :disabled="engineer.engineer.last_event && engineer.engineer.last_event.event_type === 'door closed'"
            >
              {{ $trans('Trigger door closed') }}
            </b-button>
          </footer>
        </div>
      </div>
    </div>

    <footer class="modal-footer">
      <b-button @click="goBack" class="btn btn-info" type="button" variant="primary">
        {{ $trans('Back') }}
      </b-button>
    </footer>
  </b-overlay>
</template>

<script>
import moment from 'moment'
import ChartJsPluginDataLabels from 'chartjs-plugin-datalabels'

import BarChart from "../../components/BarChart.vue"
import PieChart from "../../components/PieChart.vue"
import engineerModel from '../../models/company/UserEngineer.js'
import MemberNewDataSocket from "../../services/websocket/MemberNewDataSocket";
import {NEW_DATA_EVENTS} from "../../constants";
import engineerEventModel from "../../models/company/EngineerEvent";
import engineerEventTypeModel from "../../models/company/EngineerEventType";
import assignedOrderModel from "../../models/mobile/AssignedOrder";

let d = new Date();
const sunday = window.locale === 'en' ? 1 : 0
const memberNewDataSocket = new MemberNewDataSocket()

export default {
  components: {
    PieChart,
    BarChart,
    ChartJsPluginDataLabels,
  },
  data() {
    return {
      activeDateQueryMode: 'week',
      dateQueryMode: [
        {
          label: 'Per week',
          value: 'week'
        },
        {
          label: 'Per month',
          value: 'month'
        },
        {
          label: 'Per quarter',
          value: 'quarter'
        },
        {
          label: 'Per year',
          value: 'year'
        },
      ],
      activeDataMode: 'customer',
      dataModes: [
        {
          label: 'Customers',
          tableHeader: 'Customer',
          value: 'customer'
        },
        {
          label: 'Order types',
          tableHeader: 'Order type',
          value: 'order_type'
        },
      ],
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
      optionsPie: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
            formatter: (value, ctx) => {
              let datasets = ctx.chart.data.datasets;
              if (datasets.indexOf(ctx.dataset) === datasets.length - 1) {
                return `${Math.round(value*100)}%`
              }
            },
            color: '#fff',
          },
        },
      },
      pieChartdataWorkhours: null,
      barChartdataWorkhours: null,
      pieChartdataWorkhoursPeriod: null,
      barChartdataWorkhoursPeriod: null,
      colors: {},
      companycode: null,

      startDate: moment().weekday(sunday),
      today: null,
      year: d.getYear() + 1900,
      month: d.getMonth() + 1,
      monthTxt: null,
      isLoading: false,
      fullName: null,
      quarterHeaders: [],
      quarterData: [],
      pieChartdataQuarters: [],
      headers: [],
      workHoursData: [],

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
      }],
      stats: [],
      engineer: null,
      events: [],
      assignedorders: [],
      assignedordersFields: [
        {key: 'order.order_name', label: this.$trans('Name'), sortable: true, thAttr: {width: '25%'}},
        {key: 'order.order_reference', label: this.$trans('Licence plate'), sortable: true, thAttr: {width: '25%'}},
        {key: 'order.order_date', label: this.$trans('Date'), sortable: true, thAttr: {width: '25%'}},
        {key: 'order.last_status_full', label: this.$trans('Status'), sortable: true, thAttr: {width: '25%'}},
      ],
      event_date: null,
      event_time: null,
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }
  },
  watch: {
    activeDateQueryMode: {
      handler() {
        this.render()
      }
    },
    activeDataMode: {
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
  computed: {
    getStatusClass() {
      return this.engineer.engineer.last_event.event_type === 'door open' ? 'open' : 'closed'
    },
    getActiveDataMode() {
      return this.dataModes.find(item => item.value === this.activeDataMode)
    },
    getActiveDateQueryMode() {
      return this.dateQueryMode.find(item => item.value === this.activeDateQueryMode)
    },
  },
  methods: {
    async doorOpen() {
      const event_dts = this.event_time && this.event_date ? `${this.event_date} ${this.event_time}` : null
      await engineerEventModel.sendDoorOpen(this.engineer.engineer.id, event_dts)
    },
    async doorClosed() {
      const event_dts = this.event_time && this.event_date ? `${this.event_date} ${this.event_time}` : null
      await engineerEventModel.sendDoorClosed(this.engineer.engineer.id, event_dts)
    },
    async nextYear() {
      this.year = this.year + 1
      await this.render()
    },
    async backYear() {
      this.year = this.year - 1
      await this.render()
    },
    async nextWeek() {
      this.startDate.add(7, 'days');
      await this.render()
    },
    async backWeek() {
      this.startDate.subtract(7, 'days');
      await this.render()
    },
    async backMonth() {
      this.today.subtract(1, 'month')

      this.month = this.today.month() + 1
      this.monthTxt = this.today.format('MMMM')
      this.year = this.today.year()

      await this.render()
    },
    async nextMonth() {
      this.today.add(1, 'month')

      this.month = this.today.month() + 1
      this.monthTxt = this.today.format('MMMM')
      this.year = this.today.year()

      await this.render()
    },
    goBack() {
      this.$router.push({name: 'users-engineers'})
    },
    getColor(item) {
      if (!(item in this.colors)) {
        this.colors[item] = `#${Math.floor(Math.random()*16777215).toString(16)}`
      }

      return this.colors[item]
    },
    getWeekHeaders() {
      let tmpDate = this.startDate.clone()
      let headers = [
        {
          key: this.getActiveDataMode.value,
          label: this.getActiveDataMode.tableHeader
        }
      ]

      for (let i=0; i<this.days.length; i++) {
        let tmp = tmpDate
        headers.push({
          key: `day${i}`,
          label: `${this.days[i]} ${tmp.format('DD/MM')}`
        })
        tmp = tmpDate.add(1, "days")
      }

      return headers
    },
    getMonthHeaders() {
      const tmpDate = moment(`${this.year}-${this.month}-01`)
      let headers = [
        {
          key: this.getActiveDataMode.value,
          label: this.getActiveDataMode.tableHeader
        }
      ]

      let tmp = tmpDate.clone()
      for (let i=1; i<=tmpDate.daysInMonth(); i++) {
        headers.push({
          key: `day${i}`,
          label: `${tmp.format('DD')}`
        })
        tmp = tmp.add(1, "days")
      }

      return headers
    },
    getQuarterHeaders() {
      let headers = [
        {
          key: this.getActiveDataMode.value,
          label: this.getActiveDataMode.tableHeader
        }
      ]

      for (let i=1; i<=4; i++) {
        headers.push({
          key: `quarter${i}`,
          label: i
        })
      }

      return headers
    },
    getYearHeaders() {
      let headers = [
        {
          key: this.getActiveDataMode.value,
          label: this.getActiveDataMode.tableHeader
        }
      ]

      for (let i=1; i<=12; i++) {
        headers.push({
          key: `month${i}`,
          label: `${i}`
        })
      }

      return headers
    },
    async loadData() {
      try {
        this.engineer = await engineerModel.detail(this.pk)
        this.events = await engineerEventModel.getForEngineer(this.engineer.engineer.id)
        this.stats = await engineerEventTypeModel.getStatsForEngineer(this.engineer.engineer.id)
        const assignedordersResult = await assignedOrderModel.listDevice(this.pk)
        this.assignedorders = assignedordersResult.assignedorders
        await this.render()
      } catch(error) {
        console.log('error fetching engineer details', error)
        this.errorToast(this.$trans('Error fetching engineer details'))
        this.isLoading = false
      }
    },
    async onNewData(data) {
      if (data.type === NEW_DATA_EVENTS.ENGINEER_EVENT && this.engineer.engineer.id) {
        await this.loadData()
        this.newData = true
      }
    },
    async render() {
      if (this.activeDateQueryMode === 'week') {
        const response = await engineerModel.stats_v2_week(this.pk, this.startDate.format('YYYY-MM-DD'), this.activeDataMode)
        this.fullName = response.engineer
        const totals = response.totals
        this.headers = this.getWeekHeaders()
        let keys = {}, day_totals = {}

        for (const row of response.result) {
          let tmpDate = this.startDate.clone()
          if (!(row[this.activeDataMode] in keys)) {
            keys[row[this.activeDataMode]] = {
              label: `${row[this.activeDataMode]}`,
              days: {},
              total: 0
            }
          }

          for (let i=0; i<this.days.length; i++) {
            let tmp = tmpDate
            if (parseInt(tmp.format('DD')) === row.day) {
              keys[row[this.activeDataMode]].total += row.sum_work_total
              // keys[row[this.activeDataMode]].days[`day${i}`] = `${row.sum_work_total} (avg. ${row.avg_work_total})`
              keys[row[this.activeDataMode]].days[`day${i}`] = row.sum_work_total
            }
            tmp = tmpDate.add(1, "days")
          }
        }

        this.workHoursData = []
        let pieGraphData = [], labels = [], colors = []
        let barGraphData = []
        for (const [_, data] of Object.entries(keys)) {
          let tableRow = {}
          tableRow[this.activeDataMode] = data.label
          for (let i=0; i<this.days.length; i++) {
            tableRow[`day${i}`] = `day${i}` in data.days ? data.days[`day${i}`] : '-'
            if (!(`day${i}` in day_totals)) {
              day_totals[`day${i}`] = 0
            }
            day_totals[`day${i}`] += `day${i}` in data.days ? data.days[`day${i}`] : 0
          }
          this.workHoursData.push(tableRow)

          labels.push(data.label)
          pieGraphData.push(data.total/totals.sum_work_total_all)
          barGraphData.push(data.total)
          colors.push(this.getColor(data.label))
        }

        let pieMonthGraphData = [], barMonthGraphData = [], labelsMonth = [], colorsMonth = []
        for (let i=0; i<this.days.length; i++) {
          const val = `day${i}` in day_totals ? day_totals[`day${i}`] : 0
          labelsMonth.push(this.days[i])
          pieMonthGraphData.push(val/totals.sum_work_total_all)
          barMonthGraphData.push(val)
          colorsMonth.push(this.getColor(`day${i}`))
        }

        this.renderWorkhoursGraphs(
          barGraphData,
          pieGraphData,
          colors,
          labels,
          labelsMonth,
          pieMonthGraphData,
          barMonthGraphData,
          colorsMonth,
          `Total work hours per ${this.getActiveDataMode.tableHeader.toLowerCase()} (Total: ${totals.sum_work_total_all})`,
          `Total work hours per ${this.activeDateQueryMode} (Total: ${totals.sum_work_total_all})`
        )
      }

      if (this.activeDateQueryMode === 'month') {
        const response = await engineerModel.stats_v2_month(this.pk, this.month, this.year, this.activeDataMode)
        this.fullName = response.engineer
        const totals = response.totals
        this.headers = this.getMonthHeaders()
        let keys = {}, day_totals = {}

        for (const row of response.result) {
          const tmpDate = moment(`${this.year}-${this.month}-01`)
          if (!(row[this.activeDataMode] in keys)) {
            keys[row[this.activeDataMode]] = {
              label: `${row[this.activeDataMode]}`,
              days: {},
              total: 0
            }
          }

          let tmp = tmpDate.clone()
          for (let i=1; i<=tmpDate.daysInMonth(); i++) {
            if (parseInt(tmp.format('DD')) === row.day) {
              keys[row[this.activeDataMode]].total += row.sum_work_total
              keys[row[this.activeDataMode]].days[`day${i}`] = row.sum_work_total
              if (!(`day${i}` in day_totals)) {
                day_totals[`day${i}`] = 0
              }
              day_totals[`day${i}`] += row.sum_work_total
            }
            tmp = tmp.add(1, "days")
          }
        }

        this.workHoursData = []
        let pieGraphData = []
        let labels = [], colors = []
        let barGraphData = []
        const tmpDate = moment(`${this.year}-${this.month}-01`)
        for (const [_, data] of Object.entries(keys)) {
          let tableRow = {}
          tableRow[this.activeDataMode] = data.label
          for (let i=1; i<=tmpDate.daysInMonth(); i++) {
            tableRow[`day${i}`] = `day${i}` in data.days ? data.days[`day${i}`] : '-'
          }
          this.workHoursData.push(tableRow)

          labels.push(data.label)
          pieGraphData.push(data.total/totals.sum_work_total_all)
          barGraphData.push(data.total)
          colors.push(this.getColor(data.label))
        }

        let pieMonthGraphData = [], barMonthGraphData = [], labelsMonth = [], colorsMonth = []
        for (let i=1; i<=tmpDate.daysInMonth(); i++) {
          const val = `day${i}` in day_totals ? day_totals[`day${i}`] : 0
          labelsMonth.push(i)
          pieMonthGraphData.push(val/totals.sum_work_total_all)
          barMonthGraphData.push(val)
          colorsMonth.push(this.getColor(`day${i}`))
        }

        this.renderWorkhoursGraphs(
          barGraphData,
          pieGraphData,
          colors,
          labels,
          labelsMonth,
          pieMonthGraphData,
          barMonthGraphData,
          colorsMonth,
          `Total work hours per ${this.getActiveDataMode.tableHeader.toLowerCase()} (Total: ${totals.sum_work_total_all})`,
          `Total work hours per ${this.activeDateQueryMode} (Total: ${totals.sum_work_total_all})`
        )
      }

      if (this.activeDateQueryMode === 'quarter') {
        const response = await engineerModel.stats_v2_quarter(this.pk, this.year, this.activeDataMode)
        this.fullName = response.engineer
        const totals = response.totals
        this.headers = this.getQuarterHeaders()
        let keys = {}, quarter_totals = {}

        for (const row of response.result) {
          if (!(row[this.activeDataMode] in keys)) {
            keys[row[this.activeDataMode]] = {
              label: `${row[this.activeDataMode]}`,
              quarters: {},
              total: 0
            }
          }

          for (let i=1; i<=4; i++) {
            if (i === row.quarter) {
              keys[row[this.activeDataMode]].total += row.sum_work_total
              keys[row[this.activeDataMode]].quarters[`quarter${i}`] = row.sum_work_total
              if (!(`quarter${i}` in quarter_totals)) {
                quarter_totals[`quarter${i}`] = 0
              }
              quarter_totals[`quarter${i}`] += row.sum_work_total
            }
          }
        }

        this.workHoursData = []
        let pieGraphData = []
        let labels = [], colors = []
        let barGraphData = []
        for (const [_, data] of Object.entries(keys)) {
          let tableRow = {}
          tableRow[this.activeDataMode] = data.label
          for (let i=1; i<=4; i++) {
            tableRow[`quarter${i}`] = `quarter${i}` in data.quarters ? data.quarters[`quarter${i}`] : '-'
          }
          this.workHoursData.push(tableRow)

          labels.push(data.label)
          pieGraphData.push(data.total/totals.sum_work_total_all)
          barGraphData.push(data.total)
          colors.push(this.getColor(data.label))
        }

        let pieMonthGraphData = [], barMonthGraphData = [], labelsMonth = [], colorsMonth = []
        for (let i=1; i<=4; i++) {
          const val = `quarter${i}` in quarter_totals ? quarter_totals[`quarter${i}`] : 0
          labelsMonth.push(i)
          pieMonthGraphData.push(val/totals.sum_work_total_all)
          barMonthGraphData.push(val)
          colorsMonth.push(this.getColor(`quarter${i}`))
        }

        this.renderWorkhoursGraphs(
          barGraphData,
          pieGraphData,
          colors,
          labels,
          labelsMonth,
          pieMonthGraphData,
          barMonthGraphData,
          colorsMonth,
          `Total work hours per ${this.getActiveDataMode.tableHeader.toLowerCase()} (Total: ${totals.sum_work_total_all})`,
          `Total work hours per ${this.activeDateQueryMode} (Total: ${totals.sum_work_total_all})`
        )
      }

      if (this.activeDateQueryMode === 'year') {
        const response = await engineerModel.stats_v2_year(this.pk, this.year, this.activeDataMode)
        this.fullName = response.engineer
        const totals = response.totals
        this.headers = this.getYearHeaders()
        let keys = {}, month_totals = {}

        for (const row of response.result) {
          if (!(row[this.activeDataMode] in keys)) {
            keys[row[this.activeDataMode]] = {
              label: `${row[this.activeDataMode]}`,
              months: {},
              total: 0
            }
          }

          for (let i=1; i<=12; i++) {
            if (i === row.month) {
              keys[row[this.activeDataMode]].total += row.sum_work_total
              keys[row[this.activeDataMode]].months[`month${i}`] = row.sum_work_total
              if (!(`month${i}` in month_totals)) {
                month_totals[`month${i}`] = 0
              }
              month_totals[`month${i}`] += row.sum_work_total
            }
          }
        }

        this.workHoursData = []
        let pieGraphData = []
        let labels = [], colors = []
        let barGraphData = []
        for (const [_, data] of Object.entries(keys)) {
          let tableRow = {}
          tableRow[this.activeDataMode] = data.label
          for (let i=1; i<=12; i++) {
            tableRow[`month${i}`] = `month${i}` in data.months ? data.months[`month${i}`] : '-'
          }
          this.workHoursData.push(tableRow)

          labels.push(data.label)
          pieGraphData.push(data.total/totals.sum_work_total_all)
          barGraphData.push(data.total)
          colors.push(this.getColor(data.label))
        }

        let pieMonthGraphData = [], barMonthGraphData = [], labelsMonth = [], colorsMonth = []
        for (let i=1; i<=12; i++) {
          const val = `month${i}` in month_totals ? month_totals[`month${i}`] : 0
          labelsMonth.push(i)
          pieMonthGraphData.push(val/totals.sum_work_total_all)
          barMonthGraphData.push(val)
          colorsMonth.push(this.getColor(`month${i}`))
        }

        this.renderWorkhoursGraphs(
          barGraphData,
          pieGraphData,
          colors,
          labels,
          labelsMonth,
          pieMonthGraphData,
          barMonthGraphData,
          colorsMonth,
          `Total work hours per ${this.getActiveDataMode.tableHeader.toLowerCase()} (Total: ${totals.sum_work_total_all})`,
          `Total work hours per ${this.activeDateQueryMode} (Total: ${totals.sum_work_total_all})`
        )
      }
    },
    renderWorkhoursGraphs(
      barGraphData,
      pieGraphData,
      colors,
      labels,
      labelsMonth,
      pieMonthGraphData,
      barMonthGraphData,
      colorsMonth,
      barLabel,
      barLabelMonth) {
      this.pieChartdataWorkhours = {
        labels: labels,
        datasets: [{
          data: pieGraphData,
          backgroundColor: colors,
        }]
      }

      // bar graph data mode
      this.barChartdataWorkhours = {
        labels,
        datasets: [{
          label: barLabel,
          data: barGraphData,
          backgroundColor: colors,
        }]
      }

      // pie graph period
      this.pieChartdataWorkhoursPeriod = {
        labels: labelsMonth,
        datasets: [{
          data: pieMonthGraphData,
          backgroundColor: colorsMonth,
        }]
      }

      // bar graph period
      this.barChartdataWorkhoursPeriod = {
        labels: labelsMonth,
        datasets: [{
          label: barLabelMonth,
          data: barMonthGraphData,
          backgroundColor: colorsMonth,
        }]
      }
    },
  },
  async created() {
    this.companycode = this.$store.getters.getMemberCompanycode
    console.log(this.companycode)
    this.today = moment()
    this.month = this.today.month() + 1
    this.monthTxt = this.today.format('MMMM')
    this.year = this.today.year()
    await this.loadData()
  },

  async mounted() {
    await memberNewDataSocket.init(NEW_DATA_EVENTS.ENGINEER_EVENT)
    memberNewDataSocket.setOnmessageHandler(this.onNewData)
    memberNewDataSocket.getSocket()
  },
  beforeDestroy() {
    memberNewDataSocket.removeOnmessageHandler(NEW_DATA_EVENTS.ENGINEER_EVENT)
  }
}
</script>

<style scoped>
  p.no-data {
    text-align: center;
  }
.open {
  padding: 4px;
  color: floralwhite;
  background-color: red;
}
.closed {
  padding: 4px;
  background-color: #1e7e34;
  color: floralwhite;
}
.events {
  width: 400px;
}
</style>
