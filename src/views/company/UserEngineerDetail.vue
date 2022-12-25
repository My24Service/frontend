<template>

  <b-overlay :show="isLoading" rounded="sm">
    <div class="subnav-pills">
      <b-nav pills>
        <b-nav-item
          v-for="item in viewMethods"
          :active="item.value === activeViewMethod"
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
          <b-button @click="doorClose" class="btn btn-info" type="button" variant="primary"
                    :disabled="engineer.engineer.last_event && engineer.engineer.last_event.event_type === 'door close'"
          >
            {{ $trans('Trigger door close') }}
          </b-button>
        </footer>
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

import PieChart from "../../components/PieChart.vue"
import engineerModel from '../../models/company/UserEngineer.js'
import MemberNewDataSocket from "../../services/websocket/MemberNewDataSocket";
import {NEW_DATA_EVENTS} from "../../constants";
import engineerEventModel from "../../models/company/EngineerEvent";
import engineerEventTypeModel from "../../models/company/EngineerEventType";
import assignedOrderModel from "../../models/mobile/AssignedOrder";

let d = new Date();
const monday = window.locale === 'en' ? 1 : 0
const memberNewDataSocket = new MemberNewDataSocket()

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
      event_time: null
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
  computed: {
    getStatusClass() {
      return this.engineer.engineer.last_event.event_type === 'door open' ? 'open' : 'closed'
    }
  },
  methods: {
    async doorOpen() {
      const event_dts = this.event_time && this.event_date ? `${this.event_date} ${this.event_time}` : null
      await engineerEventModel.sendDoorOpen(this.engineer.engineer.id, event_dts)
    },
    async doorClose() {
      const event_dts = this.event_time && this.event_date ? `${this.event_date} ${this.event_time}` : null
      await engineerEventModel.sendDoorClose(this.engineer.engineer.id, event_dts)
    },
    async render() {
      if (this.activeViewMethod === 'week') {
        await this.renderWeek()
      }

      if (this.activeViewMethod === 'quarter') {
        await this.renderQuarter()
      }
    },
    async nextYear() {
      this.year = this.year + 1
      await this.loadData()
    },
    async backYear() {
      this.year = this.year - 1
      await this.loadData()
    },
    async nextWeek() {
      this.startDate.add(7, 'days');
      await this.loadData();
    },
    async backWeek() {
      this.startDate.subtract(7, 'days');
      await this.loadData();
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
  },
  async created() {
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
