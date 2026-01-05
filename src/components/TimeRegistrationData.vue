<template>
  <div class="app-grid">

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

    <h3 v-if="isDetail && fullName" align="center">{{ fullName }}</h3>

    <b-row align-v="center" v-if="activeDateQueryMode === 'year'">
      <b-col cols="2">
        <BLink @click.prevent="backYear" v-bind:title="$trans('Year back')">
          <IBiArrowLeft font-scale="1.8"></IBiArrowLeft>
        </BLink>
      </b-col>
      <b-col cols="8" class="text-center">
        <h4 align="center" v-if="!isDetail && listTitle">{{ listTitle }} - {{ today.format('YYYY') }}</h4>
        <h4 align="center" v-if="isDetail">{{ this.$trans('Year totals') }} - {{ today.format('YYYY') }}</h4>
      </b-col>
      <b-col cols="2">
        <div class="float-right">
          <BLink @click.prevent="nextYear" v-bind:title="$trans('Next year') ">
            <IBiArrowRight font-scale="1.8"></IBiArrowRight>
          </BLink>
        </div>
      </b-col>
    </b-row>

    <b-row align-v="center" v-if="activeDateQueryMode === 'month'">
      <b-col cols="2">
        <BLink @click.prevent="backMonth" v-bind:title="$trans('Month back')">
          <IBiArrowLeft font-scale="1.8"></IBiArrowLeft>
        </BLink>
      </b-col>
      <b-col cols="8" class="text-center">
        <h4 align="center" v-if="!isDetail && listTitle">{{ listTitle }} - {{ today.format('MMM YYYY') }}</h4>
        <h4 align="center" v-if="isDetail">{{ this.$trans('Month totals') }} - {{ today.format('MMM YYYY') }}</h4>
      </b-col>
      <b-col cols="2">
        <div class="float-right">
          <BLink @click.prevent="nextMonth" v-bind:title="$trans('Next month') ">
            <IBiArrowRight font-scale="1.8"></IBiArrowRight>
          </BLink>
        </div>
      </b-col>
    </b-row>

    <b-row align-v="center" v-if="activeDateQueryMode === 'week'">
      <b-col cols="2">
        <BLink @click.prevent="backWeek" v-bind:title="$trans('Week back')">
          <IBiArrowLeft font-scale="1.8"></IBiArrowLeft>
        </BLink>
      </b-col>
      <b-col cols="8">
        <h4 align="center" v-if="!isDetail && listTitle">{{ listTitle }} - {{ today.format('[week] W') }}/{{ today.format('Y') }}</h4>
        <h4 align="center" v-if="isDetail">{{ this.$trans('Week totals') }} - {{ today.format('[week] W') }}/{{ today.format('Y') }}</h4>
      </b-col>
      <b-col cols="2">
        <div class="float-right">
          <BLink @click.prevent="nextWeek" v-bind:title="$trans('Next week') ">
            <IBiArrowRight font-scale="1.8"></IBiArrowRight>
          </BLink>
        </div>
      </b-col>
    </b-row>

    <b-table
      id="time-registration-table"
      :small="true"
      :fields="fields"
      :items="data"
      responsive="md"
      class="data-table"
      :sort-by="sortBy"
      v-if="!isDetail"
    >
      <template #cell(full_name)="data">
        <router-link
          class="px-1"
          v-if="data.item.user_id"
          :to="{
            name: 'company-time-registration-detail',
            params: {user_id: data.item.user_id},
            query: {date: today.format('YYYY-MM-DD'), mode: activeDateQueryMode}}
          ">
          {{ data.item.full_name }}
        </router-link>
        <span v-if="!data.item.user_id">{{ data.item.full_name }}</span>
      </template>
      <template v-slot:[`cell(${dataField})`]="data" v-for="(dataField, index) in dataFields">
        <!-- Some complicated rendering logic here -->
<!--        {{ date_list_moment[index] }} {{ index }}-->
        <router-link
          :key="index"
          v-if="activeDateQueryMode === 'month' && data.item.user_id"
          class="px-1"
          :to="{
            name: 'company-time-registration-detail',
            params: {user_id: data.item.user_id},
            query: {date: date_list_moment[index].format('YYYY-MM-DD'), mode: 'week'}
          }">
          {{ data.item[dataField] }}
        </router-link>
        <span
          :key="index"
          v-if="activeDateQueryMode === 'month' && !data.item.user_id"
        >
          {{ data.item[dataField] }}
        </span>

        <router-link
          v-if="activeDateQueryMode === 'year' && data.item.user_id"
          :key="index"
          class="px-1"
          :to="{
            name: 'company-time-registration-detail',
            params: {user_id: data.item.user_id},
            query: {date: date_list_moment[index].format('YYYY-MM-DD'), mode: 'month'}
          }">
          {{ data.item[dataField] }}
        </router-link>
        <span
          :key="index"
          v-if="activeDateQueryMode === 'year' && !data.item.user_id"
        >
          {{ data.item[dataField] }}
        </span>

        <router-link
          v-if="activeDateQueryMode === 'week' && data.item.user_id"
          :key="index"
          class="px-1"
          :to="{
            name: 'company-time-registration-detail',
            params: {user_id: data.item.user_id},
            query: {date: date_list_moment[index].format('YYYY-MM-DD'), mode: 'week'}
          }">
          {{ data.item[dataField] }}
        </router-link>
        <span
          :key="index"
          v-if="activeDateQueryMode === 'week' && !data.item.user_id"
        >
          {{ data.item[dataField] }}
        </span>
      </template>
    </b-table>

    <b-table
      id="time-registration-detail-table"
      small
      :fields="fields"
      :items="data"
      responsive="md"
      class="data-table"
      v-if="isDetail"
    >
    </b-table>

    <div v-if="isDetail && leaveData.length > 0">
      <h4 align="center">{{ this.$trans("Leave") }}</h4>
      <b-table
        small
        id="workhours-table"
        :fields="leaveDataFields"
        :items="leaveData"
        responsive="md"
        class="data-table"
      >
      </b-table>
    </div>

    <div v-if="isDetail">
      <h4 align="center">{{ this.$trans("Workhours") }}</h4>
      <b-table
        small
        id="workhours-table"
        :fields="workhourDataFields"
        :items="workhourData"
        responsive="md"
        class="data-table"
      >
          <template v-slot:cell(work_times)="{ item }">
            {{ item.work_start }} - {{ item.work_end }}
            <span v-if="item.work_correction !== '00:00'" style="color:red">{{ item.work_correction }}</span>
          </template>
          <template v-slot:cell(work_travel)="{ item }">
            <span v-if="item.travel_to === '00:00:00' && item.travel_back === '00:00:00'" class="dimmed">&ndash;</span>
            <span v-else>{{ item.travel_to }} / {{ item.travel_back }}</span>
          </template>
          <template v-slot:cell(work_distance)="{ item }">
            <span v-if="item.distance_to === 0 && item.distance_back === 0" class="dimmed">&ndash;</span>
            <span v-else>{{ item.distance_to }} / {{ item.distance_back }}</span>
          </template>
          <template v-slot:cell(work_correct)="{ item }">
            <b-btn v-if="isPlanning" variant="outline" class="highlight-on-hover-row" size="sm" @click="editCorrection(item)">+ / -</b-btn>
          </template>
      </b-table>
    </div>

    <b-modal ref="time-correction-modal" id="time-correction-modal" v-bind:title="$trans('Work hours correction')" @ok="commitTimeCorrection()">
      <form ref="edit-correction-form">
        <b-container fluid>
          <b-row role="group">
            <b-col size="12">
              <p>{{ this.$trans('Enter a correction value in minutes or in the form hh:mm.')}}</p>
              <BFormInput size="sm" autofocus v-model="timeEntryCorrection" v-bind:placeholder="$trans('Enter time value')" @xxchange="onChangeTimeCorrection()" @update="onChangeTimeCorrection()" style="margin-top:1rem;margin-bottom:1rem;width:10rem;"/>
              <div class="dimmed"><span v-html="timeEntryCorrectionAsText"></span></div>
              <!--
              <BFormCheckbox
                id="notify-user"
                name="notify-user"
                v-model="timeEntryCorrectionNotify"
                value="notify"
                unchecked-value="no">{{ this.$trans('Notify user') }}</BFormCheckbox> -->
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

  </div>
</template>

<script>
import moment from 'moment/min/moment-with-locales'

import {TimeRegistrationService} from "@/models/company/TimeRegistration";
import {useMainStore} from "@/stores/main";
import componentMixin from "@/mixins/common";

export default {
  setup() {
    const mainStore = useMainStore()

    return {
      mainStore
    }
  },
  mixins: [componentMixin],
  name: "TimeRegistrationData",
  props: {
    user_id: {
      type: [String, Number],
      default: null
    },
  },
  emits: [
    'reloadData'
  ],
  watch: {
    activeDateQueryMode: {
      handler() {
        const query = {
          ...this.$route.query,
          date: this.today.format('YYYY-MM-DD'),
          mode: this.activeDateQueryMode
        }
        this.$router.push({ query }).catch(e => {})
      }
    },
  },
  data() {
    let workHourDataFields = [
      {label: this.$trans('Date'), key: 'date', thClass: 'col-tight'},
      {label: this.$trans('Source'), key: 'source', thClass: 'col-tight'},
      {key: 'work_times', label: this.$trans('Work start') + ' - ' + this.$trans('Work end') + ' ±', thClass: 'col-wider'},
      // {label: this.$trans('Work start'), key: 'work_start', thClass: 'col-wide'},
      // {label: this.$trans('Work end'), key: 'work_end', thClass: 'col-wide'},
      {key: 'work_travel', label: this.$trans('Travel to') + ' / ' + this.$trans('Travel back'), thClass: 'col-wide'},
      // {label: this.$trans('Travel to'), key: 'travel_to', thClass: 'col-wide'},
      // {label: this.$trans('Travel back'), key: 'travel_back', thClass: 'col-wide'},
      {key: 'work_distance', label: this.$trans('Distance to / back'), thClass: 'col-wide'},
      // {label: this.$trans('Distance to'), key: 'distance_to', thClass: 'col-wide'},
      // {label: this.$trans('Distance back'), key: 'distance_back', thClass: 'col-wide'},
      {label: this.$trans('Project'), key: 'project'},
      {label: this.$trans('Description'), key: 'description'},
      {key: 'work_correct', label:'', thClass:'col-tight'},
    ];

    /*
    // The breaks are calculated over an entire day, so showing these /per entry/ makes no
    // sense, as this would be invalid if multiple entries happen on a single days. If the
    // breaks are calculated on a /per registration/ basis, then this would make sense to
    // include. It's now intentionally disabled and left as a comment in case this should
    // be enabled in the future.
    const break_calculation_settings = this.$store.getters.getAutomaticBreakCalculationSettings;
    if (break_calculation_settings
      && break_calculation_settings.after > 0
      && break_calculation_settings.duration > 0) {
      workHourDataFields.splice( 4, 0, {
        label: this.$trans('Break'),
        key: 'break_duration',
        thClass: 'col-tight'
      } );
    }
    */

    return {
      today: null,
      data: [],
      fields: [],
      dataFields: [],
      sortBy: [{key: 'full_name', order: 'asc'}],
      date_list: [],
      date_list_moment: [],
      activeDateQueryMode: 'week',
      fullName: null,
      // excludeDays: ['Su', 'Sa'],
      excludeDays: [],
      workhourData: [],
      workhourDataFields: workHourDataFields,
      leaveData: [],
      leaveDataFields: [
        {label: this.$trans('Date'), key: 'date'},
        {label: this.$trans('Leave hours'), key: 'leave_duration'},
        {label: this.$trans('Leave type'), key: 'leave_type'},
      ],
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
          label: 'Per year',
          value: 'year'
        },
      ],
      listTitle: null,
      timeEntry: null,
      timeEntryCorrection: '00:00', // value entered
      timeEntryParsed: '', // (+/-)10:00 value
      timeEntryCorrectionAsText: '', // message below input
      timeEntryCorrectionNotify: false,
      timeRegistrationService: new TimeRegistrationService()
    }
  },
  computed: {
    breadcrumb() {
      return [
        {
          text: this.$trans('Time registration'),
          to: {
            name: 'company-time-registration',
            query: {date: this.startDate, mode: this.activeDateQueryMode}
          }
        },
        {
          text: this.$trans('User time registration'),
          active: true
        },
      ]
    },
    isDetail() {
      return !!this.user_id
    },
  },
  created() {
    const lang = this.mainStore.getCurrentLanguage
    const monday = lang === 'en' ? 1 : 0
    this.$moment = moment
    this.$moment.locale(lang)
    this.today = this.$route.query.date ? this.$moment(this.$route.query.date) : this.$moment().weekday(monday)
    this.activeDateQueryMode = this.$route.query.mode ? this.$route.query.mode : 'week'
    const sortBy = this.$route.query.sort_field ?? 'full_name'
    const sortDir = this.$route.query.sort_dir ?? 'asc'
    this.sortBy = [{key: sortBy, order: sortDir}]
  },
  methods: {
    async commitTimeCorrection() {
      // console.log( 'Apply correction of '+this.timeEntryParsed+ ' to id#' + this.timeEntry.id )
      if (this.timeEntryParsed === this.timeEntry.work_correction) {
        // console.log( 'work correction value has not changed');
        return;
      }
      // After posting this, we need to update the whole UI.
      const result = await this.timeRegistrationService.editCorrection(this.timeEntry.id, {
        'source': this.timeEntry.source,
        'work_correction': this.timeEntryParsed,
        'work_correction_by_user': this.user_id,
        'notify_engineer': this.timeEntryCorrectionNotify
      } );
      if (result && result.result) {
        this.$emit('reloadData')
      }
    },
    onChangeTimeCorrection() {
      // Attempts to parse this as a valid hh:mm value, otherwise assume minutes. This
      // will update the text in the modal dialog as well to show how it will be interpreted.
      this.timeEntryCorrection = this.timeEntryCorrection.trim();
      const parsed = (this.timeEntryCorrection === '' || this.timeEntryCorrection === '-')
        ? null
        : this.timeEntryCorrection.split(':');

      if (parsed != null && parsed.length > 0 && parsed.length < 3) {
        let hh = 0, mm = 0;
        const is_negative = parsed[0][0] === '-';
        if (parsed.length === 1) {
          mm = parseInt( parsed[0] );
          if (isNaN( mm )) mm = 0;
          if (is_negative) mm = 0 - mm;
          hh = Math.floor(mm / 60)
          mm -= (hh * 60)
        } else { // if (parsed.length === 2) {
          hh = parseInt( parsed[0] );
          if (isNaN( hh )) hh = 0;
          if (is_negative) hh = 0 - hh;
          mm = parseInt( parsed[1] );
          if (isNaN(mm)) mm = 0;
        }
        const display_time = ''+hh+':'+(mm < 10 ? '0': '')+mm
        this.timeEntryParsed = (is_negative ? '-' : '')+display_time;
        this.timeEntryCorrectionAsText = this.$trans( is_negative ? 'Subtract' : 'Add ') + ' ' + display_time;
      } else {
        this.timeEntryCorrectionAsText = this.$trans('Invalid time');
      }
    },
    editCorrection(timeEntry) {
      this.timeEntry = timeEntry;
      this.timeEntryCorrectionNotify = false;
      if (timeEntry) {
        this.timeEntryCorrectionAsText = ''

        this.timeEntryCorrection = timeEntry.work_correction;
        if (this.timeEntryCorrection.trim().length === 0) {
          this.timeEntryCorrection = '0';
        }
        this.onChangeTimeCorrection()

        this.$refs['time-correction-modal'].show();
      }
    },
    getListTitle(totalsFields) {
      let result = []
      for (const key of totalsFields) {
        result.push(this.translateHoursField(key))
      }
      return result.join(' / ')
    },
    nextWeek() {
      this.today.add(7, 'days')
      const query = {
        ...this.$route.query,
        date: this.today.format('YYYY-MM-DD'),
        mode: this.activeDateQueryMode
      }
      this.$router.push({ query }).catch(e => {})
    },
    backWeek() {
      this.today.subtract(7, 'days')

      const query = {
        ...this.$route.query,
        date: this.today.format('YYYY-MM-DD'),
        mode: this.activeDateQueryMode
      }
      this.$router.push({ query }).catch(e => {})
    },
    nextMonth() {
      this.today.add(1, 'months')
      const query = {
        ...this.$route.query,
        date: this.today.format('YYYY-MM-DD'),
        mode: this.activeDateQueryMode
      }
      this.$router.push({ query }).catch(e => {})
    },
    backMonth() {
      this.today.subtract(1, 'months')

      const query = {
        ...this.$route.query,
        date: this.today.format('YYYY-MM-DD'),
        mode: this.activeDateQueryMode
      }
      this.$router.push({ query }).catch(e => {})
    },
    nextYear() {
      this.today.add(1, 'years')
      const query = {
        ...this.$route.query,
        date: this.today.format('YYYY-MM-DD'),
        mode: this.activeDateQueryMode
      }
      this.$router.push({ query }).catch(e => {})
    },
    backYear() {
      this.today.subtract(1, 'years')

      const query = {
        ...this.$route.query,
        date: this.today.format('YYYY-MM-DD'),
        mode: this.activeDateQueryMode
      }
      this.$router.push({ query }).catch(e => {})
    },
    formatFields(day_data) {
      let result = []
      if (day_data) {
        for(let i=0; i<day_data.length; i++) {
          if (day_data[i]) {
            result.push(day_data[i].total)
          }
        }
      }

      return result.length ? result.join(' | ') : ''
    },
    addUserDataToResults(userData, results) {
      const keys = Object.keys(userData)
      const data = userData[keys[0]]
      results.push(data)

      return results
    },
    formatValue(valObj) {
      return valObj.total
    },
    getIntervalData(result, totalsFields, intervals, userId) {
      let intervalResult = []

      for (let i = 0; i < intervals.length; i++) {
        let intervalData = []

        for (let j = 0; j < result.length; j++) {
          if (result[j].user_id === userId && result[j].interval === intervals[i]) {
            for (let k = 0; k < totalsFields.length; k++) {
              const field = totalsFields[k]
              const total = result[j][field].interval_total
              intervalData.push({
                total,
                field
              });
            }
          }
        }

        intervalResult.push(intervalData)
      }

      return intervalResult
    },
    getUserTotals(result, totalsFields, userId) {
      for (let i = 0; i < result.length; i++) {
        if (result[i].user_id === userId) {
          let intervalResult = []
          for (let k = 0; k < totalsFields.length; k++) {
            const field = totalsFields[k]
            const total = result[i][field].total
            intervalResult.push({
              total,
              field,
            });
          }

          return intervalResult;
        }
      }

      return [];
  },
  normalizeData(result, totalsFields, intervals) {
      let userData = {}
      let results = []
      // for(let i=0; i<20; i++) {
      for(let i=0; i<result.length; i++) {
        let obj = {
          'full_name': result[i].full_name,
          'user_id': result[i].user_id,
        }

        if (!(obj.user_id in userData)) {
          if (Object.keys(userData).length > 0) {
            results = this.addUserDataToResults(userData, results)
            userData = {}
          }

          userData[obj.user_id] = {
            user: obj,
            interval_totals: this.getIntervalData(result, totalsFields, intervals, obj.user_id),
            user_totals: this.getUserTotals(result, totalsFields, obj.user_id)
          }
        }
      }

      // add the final user
      if (Object.keys(userData).length > 0) {
        results = this.addUserDataToResults(userData, results)
      }

      return results
    },
    processData(data) {
      if (this.isDetail) {
        this._processDataDetail(data)
      } else {
        this._processData(data)
      }
    },
    _getHeaderLabel(dateIn) {
      let label
      if (this.activeDateQueryMode === 'week') {
        label = this.$moment(dateIn).format('ddd DD')
      }

      else if (this.activeDateQueryMode === 'month') {
        // if (['Su', 'Sa'].indexOf(this.$moment(dateIn).format("dd")) === -1) {
          label = this.$moment(dateIn).format('[week] W')
        // } else {
        //   label = 'w'
        // }
      }

      else if (this.activeDateQueryMode === 'year') {
        label = this.$moment(dateIn).format('MM')
      } else {
        label = 'HELLUP'
      }

      return label
    },
    _processData(data) {
      this.workhourData = []
      this.leaveData = []
      this.listTitle = this.getListTitle(data.totals_fields)
      this.date_list = data.date_list.map((dateIn) => {
        return this.$moment(dateIn).format('YYYY-MM-DD')
      })
      this.date_list_moment = data.date_list.map((dateIn) => {
        return this.$moment(dateIn)
      })
      let header_columns = []

      header_columns.push({
        key: 'full_name',
        label: this.$trans('User'),
        sortable: true
      })

      // add intervals
      this.dataFields = []
      for(let i=0; i<data.date_list.length; i++) {
        const label = this._getHeaderLabel(data.date_list[i])

        header_columns.push({
          key: `field${i}`,
          label,
          sortable: true
        })
        this.dataFields.push(`field${i}`)
      }

      header_columns.push({
        key: 'total',
        label: this.$trans('Total'),
        sortable: true
      })

      this.fields = header_columns

      const normalizedData = this.normalizeData(data.totals, data.totals_fields, data.intervals)
      // console.log(normalizedData)
      let results = []

      // create array for table
      for(let i=0; i<normalizedData.length; i++) {
        let obj = normalizedData[i].user

        for(let j=0; j<normalizedData[i].interval_totals.length; j++) {
          obj[`field${j}`] = this.formatFields(normalizedData[i].interval_totals[j])
        }

        // add week totals
        const user_totals = this.formatFields(normalizedData[i].user_totals)
        if (user_totals) {
          obj['total'] = user_totals
          // obj['total'] = `${week_totals} (${data.result[i].perc})`
        } else {
          obj['total'] = ''
        }

        results.push(obj)
      }

      this.data = results
    },
    _processDataDetail(data) {
      this.fullName = data.full_name;
      this.workhourData = data.workhour_data;
      this.leaveData = data.leave_data
      this.date_list = data.date_list.map((dateIn) => {
        return this.$moment(dateIn).format('YYYY-MM-DD')
      })

      let header_columns = [{label: this.$trans('Field'), key: 'field'}]

      // add intervals
      for(let i=0; i<data.date_list.length; i++) {
        const label = this._getHeaderLabel(data.date_list[i])
        header_columns.push({
          key: `field${i}`,
          label,
          sortable: true
        })
      }

      header_columns.push({
        key: 'total',
        label: this.$trans('Total'),
        sortable: true
      })

      this.fields = header_columns

      // create array for table
      const normalizedData = this.normalizeData(data.totals, data.totals_fields, data.intervals)[0]
      // console.log(normalizedData)
      let results = []

      if (data.totals.length) {
        for (const field of data.totals_fields) {
          let row = {
            field: this.translateHoursField(field)
          }

          for(let j=0; j<normalizedData.interval_totals.length; j++) {
            if (!normalizedData.interval_totals[j]) {
              continue
            }

            for(let k=0; k<normalizedData.interval_totals[j].length; k++) {
              if (!normalizedData.interval_totals[j][k]) {
                continue
              }

              if (normalizedData.interval_totals[j][k].field === field) {
                row[`field${j}`] = normalizedData.interval_totals[j][k].total
              }
            }
          }

          for (let i=0; i<normalizedData.user_totals.length; i++) {
            if (normalizedData.user_totals[i].field === field) {
              row['total'] = normalizedData.user_totals[i].total
            }
          }

          results.push(row)
        }
      }

      this.data = results
    }
  }
}
</script>

<style>
table#workhours-table thead tr th.col-tight {
  max-width: 5.5rem;
  width: 5rem;
}

table#workhours-table thead tr th.col-wide {
  max-width: 9.5rem;
  width: 9rem;
}

table#workhours-table thead tr th.col-wider {
  max-width: 12.5rem;
  width: 12rem;
}

tr:hover button.highlight-on-hover-row {
  background-color: #ff9933;
}

</style>
