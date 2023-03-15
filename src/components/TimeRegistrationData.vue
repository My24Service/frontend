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
        <h4>{{ hoursTitle }} - {{ today.format('YYYY') }}</h4>
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
        <h4>{{ hoursTitle }} - {{ today.format('MMM YYYY') }}</h4>
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
        <h4>{{ hoursTitle }} - {{ today.format('[week] W') }}/{{ today.format('Y') }}</h4>
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
      sortBy: "full_name",
      sortDesc: false,
      annotate_fields: [],
      field_types: [],
      date_list: [],
      activeDateQueryMode: 'week',
      fullName: null,
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
    hoursTitle() {
      let result = []
      if (this.annotate_fields) {
        for(let i=0; i<this.annotate_fields.length; i++) {
          result.push(this.translateHoursField(this.annotate_fields[i]))
        }
      }
      return result.join(' / ')
    }
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
    formatDays(day_data) {
      let result = []
      if (day_data) {
        for(let i=0; i<day_data.length; i++) {
          if (day_data[i]) {
            if (this.field_types[i] === 'duration') {
              result.push(this.displayDurationFromSeconds(day_data[i], true))
            } else {
              result.push(day_data[i])
            }
          }
        }
      }

      return result.length ? result.join(' | ') : ''
    },
    addUserDataToResults(userData, results) {
      const keys = Object.keys(userData)
      const data = userData[keys[0]]
      let user_totals = []
      for (let k = 0; k < this.annotate_fields.length; k++) {
        if (this.field_types[k] === 'duration') {
          user_totals.push(data.user_totals[this.annotate_fields[k]].asMilliseconds())
        } else {
          user_totals.push(data.user_totals[this.annotate_fields[k]])
        }
      }
      data.user_totals = user_totals
      results.push(data)

      return results
    },
    formatValue(val, index) {
      if (!val) {
        return
      }

      if (this.field_types[index] === 'duration') {
        return this.displayDurationFromSeconds(val, true)
      }

      return val
    },
    normalizeData(result) {
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
            user_totals: {}
          }

          for (let k=0; k<this.annotate_fields.length; k++) {
            if (this.field_types[k] === 'duration') {
              userData[obj.user_id].user_totals[this.annotate_fields[k]] = moment.duration(0)
            } else {
              userData[obj.user_id].user_totals[this.annotate_fields[k]] = 0
            }
          }
        }

        for (let j = 0; j < this.date_list.length; j++) {
          const date = this.$moment(result[i].bucket)
          if (date.format('YYYY-MM-DD') === this.date_list[j]) {
            let interval_data = []
            if (['Su', 'Sa'].indexOf(date.format("dd")) === -1) {
              for (let k=0; k<this.annotate_fields.length; k++) {
                interval_data.push(result[i][this.annotate_fields[k]])
                if (this.field_types[k] === 'duration') {
                  userData[obj.user_id].user_totals[this.annotate_fields[k]].add(
                    moment.duration(result[i][this.annotate_fields[k]]))
                } else {
                  userData[obj.user_id].user_totals[this.annotate_fields[k]] +=
                    result[i][this.annotate_fields[k]]
                }
              }
            }
            userData[obj.user_id].interval_totals[j] = interval_data
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
      this.annotate_fields = data.annotate_fields
      this.field_types = data.field_types
      this.date_list = data.date_list.map((dateIn) => {
        return this.$moment(dateIn).format('YYYY-MM-DD')
      })
      let header_columns = []

      header_columns.push({
        key: 'full_name',
        label: this.$trans('User'),
        sortable: true
      })

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

      const normalizedData = this.normalizeData(data.result)
      // console.log(normalizedData)
      let results = []

      // create array for table
      for(let i=0; i<normalizedData.length; i++) {
        let obj = normalizedData[i].user

        for(let j=0; j<normalizedData[i].interval_totals.length; j++) {
          obj[`field${j}`] = this.formatDays(normalizedData[i].interval_totals[j])
        }

        // add week totals
        const user_totals = this.formatDays(normalizedData[i].user_totals)
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
      this.annotate_fields = data.annotate_fields
      this.field_types = data.field_types
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
      const normalizedData = this.normalizeData(data.result)
      // console.log(normalizedData)
      let results = []

      if (data.result.length) {
        for(let i=0; i<this.annotate_fields.length; i++) {
          let field = this.annotate_fields[i]

          let row = {
            field: this.translateHoursField(field)
          }

          for(let j=0; j<normalizedData.interval_totals.length; j++) {
            if (j in normalizedData.interval_totals && i in normalizedData.interval_totals[j]) {
              row[`field${j}`] = this.formatValue(normalizedData.interval_totals[j][i], i)
            }
          }

          row['total'] = this.formatValue(normalizedData.user_totals[i], i)

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
