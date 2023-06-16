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

    <b-breadcrumb
      class="mt-2"
      :items="breadcrumb"
      v-if="isDetail"
    ></b-breadcrumb>

    <h3 v-if="isDetail && fullName" align="center">{{ fullName }}</h3>

    <b-row align-v="center" v-if="activeDateQueryMode === 'year'">
      <b-col cols="2">
        <b-link @click.prevent="backYear" v-bind:title="$trans('Year back')">
          <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
        </b-link>
      </b-col>
      <b-col cols="8" class="text-center">
        <h4 align="center" v-if="!isDetail && listTitle">{{ listTitle }} - {{ today.format('YYYY') }}</h4>
        <h4 align="center" v-if="isDetail">{{ $trans('Year totals') }} - {{ today.format('YYYY') }}</h4>
      </b-col>
      <b-col cols="2">
        <div class="float-right">
          <b-link @click.prevent="nextYear" v-bind:title="$trans('Next year') ">
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
        <h4 align="center" v-if="!isDetail && listTitle">{{ listTitle }} - {{ today.format('MMM YYYY') }}</h4>
        <h4 align="center" v-if="isDetail">{{ $trans('Month totals') }} - {{ today.format('MMM YYYY') }}</h4>
      </b-col>
      <b-col cols="2">
        <div class="float-right">
          <b-link @click.prevent="nextMonth" v-bind:title="$trans('Next month') ">
            <b-icon-arrow-right font-scale="1.8"></b-icon-arrow-right>
          </b-link>
        </div>
      </b-col>
    </b-row>

    <b-row align-v="center" v-if="activeDateQueryMode === 'week'">
      <b-col cols="2">
        <b-link @click.prevent="backWeek" v-bind:title="$trans('Week back')">
          <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
        </b-link>
      </b-col>
      <b-col cols="8">
        <h4 align="center" v-if="!isDetail && listTitle">{{ listTitle }} - {{ today.format('[week] W') }}/{{ today.format('Y') }}</h4>
        <h4 align="center" v-if="isDetail">{{ $trans('Week totals') }} - {{ today.format('[week] W') }}/{{ today.format('Y') }}</h4>
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
      id="time-registration-table"
      small
      :fields="fields"
      :items="data"
      responsive="md"
      class="data-table"
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
      v-if="!isDetail"
    >
      <template #cell(full_name)="data">
        <router-link class="px-1" :to="{
          name: 'company-time-registration-detail',
          params: {user_id: data.item.user_id},
          query: {date: today.format('YYYY-MM-DD'), mode: activeDateQueryMode}}">
          {{ data.item.full_name }}
        </router-link>
      </template>
      <template v-slot:[`cell(${dataField})`]="data" v-for="(dataField, index) in dataFields">
        <!-- Some complicated rendering logic here -->
<!--        {{ date_list_moment[index] }} {{ index }}-->
        <router-link
          v-if="activeDateQueryMode === 'month'"
          class="px-1"
          :to="{
            name: 'company-time-registration-detail',
            params: {user_id: data.item.user_id},
            query: {date: date_list_moment[index].format('YYYY-MM-DD'), mode: 'week'}
          }">
          {{ data.item[dataField] }}
        </router-link>

        <router-link
          v-if="activeDateQueryMode === 'year'"
          class="px-1"
          :to="{
            name: 'company-time-registration-detail',
            params: {user_id: data.item.user_id},
            query: {date: date_list_moment[index].format('YYYY-MM-DD'), mode: 'month'}
          }">
          {{ data.item[dataField] }}
        </router-link>

        <router-link
          v-if="activeDateQueryMode === 'week'"
          class="px-1"
          :to="{
            name: 'company-time-registration-detail',
            params: {user_id: data.item.user_id},
            query: {date: date_list_moment[index].format('YYYY-MM-DD'), mode: 'week'}
          }">
          {{ data.item[dataField] }}
        </router-link>
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

    <div v-if="isDetail">
      <h4 align="center">{{ $trans("Workhours") }}</h4>
      <b-table
        small
        id="workhours-table"
        :fields="userDataFields"
        :items="userData"
        responsive="md"
        class="data-table"
      >
      </b-table>
    </div>

  </div>
</template>

<script>
import moment from 'moment/min/moment-with-locales'
import {componentMixin} from "../utils";
import {use} from "chai";

export default {
  mixins: [componentMixin],
  name: "TimeRegistrationData",
  props: {
    user_id: {
      type: [String, Number],
      default: null
    },
  },
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
    return {
      today: null,
      data: [],
      fields: [],
      dataFields: [],
      sortBy: "full_name",
      sortDesc: false,
      annotate_fields: [],
      field_types: [],
      date_list: [],
      date_list_moment: [],
      activeDateQueryMode: 'week',
      fullName: null,
      // excludeDays: ['Su', 'Sa'],
      excludeDays: [],
      userData: [],
      userDataFields: [
        {label: this.$trans('Date'), key: 'date'},
        {label: this.$trans('Source'), key: 'source'},
        {label: this.$trans('Work start'), key: 'work_start'},
        {label: this.$trans('Work end'), key: 'work_end'},
        {label: this.$trans('Travel to'), key: 'travel_to'},
        {label: this.$trans('Travel back'), key: 'travel_back'},
        {label: this.$trans('Distance to'), key: 'distance_to'},
        {label: this.$trans('Distance back'), key: 'distance_back'},
        {label: this.$trans('Project'), key: 'project_name'},
        {label: this.$trans('Customer'), key: 'customer_name'},
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
      listTitle: null
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
    const lang = this.$store.getters.getCurrentLanguage
    const monday = lang === 'en' ? 1 : 0
    this.$moment = moment
    this.$moment.locale(lang)
    this.today = this.$route.query.date ? this.$moment(this.$route.query.date) : this.$moment().weekday(monday)
    this.activeDateQueryMode = this.$route.query.mode ? this.$route.query.mode : 'week'
  },
  methods: {
    getListTitle(totalsFields) {
      let result = []
      for (const key of Object.keys(totalsFields)) {
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
            interval_totals: [],
            user_totals: []
          }
        }

        for (let j = 0; j < intervals.length; j++) {
          if (result[i].interval !== intervals[j]) {
            continue
          }

          let interval_data = []
          for (const [field, window_fields] of Object.entries(totalsFields)) {
            const total = result[i][window_fields.interval_total]
            interval_data.push({
              total,
              field,
            })
            userData[obj.user_id].interval_totals[j] = interval_data
          }
        }

        if (userData[obj.user_id].user_totals.length === 0) {
          for (const [field, window_fields] of Object.entries(totalsFields)) {
            const total = result[i][window_fields.total]
            userData[obj.user_id].user_totals.push({
              total,
              field,
            })
          }
        }
      }

      // add the final user
      if (Object.keys(userData).length > 0) {
        results = this.addUserDataToResults(userData, results)
      }

      return results.length === 1 ? results[0] : results
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
      this.fullName = data.full_name
      this.userData = data.user_data
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
      const normalizedData = this.normalizeData(data.totals, data.totals_fields, data.intervals)
      // console.log(normalizedData)
      let results = []

      if (data.totals.length) {
        for (const [field, _] of Object.entries(data.totals_fields)) {
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

<style scoped>

</style>
