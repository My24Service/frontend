<template>
  <div class="app-grid">
    <b-row>
      <b-col cols="2">
        <b-link @click.prevent="backWeek" v-bind:title="$trans('Week back')">
          <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
        </b-link>
      </b-col>
      <b-col cols="8">
        <p v-if="this.memberType === 'maintenance'">
          {{ hoursTitle }} - {{ week }}/{{ today.format('Y') }}
        </p>
        <p v-if="this.memberType === 'temps'">
          {{ $trans('Total hours / Total trips') }} - {{ week }}/{{ today.format('Y') }}
        </p>
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
      id="timehseet-table"
      small
      :busy='isLoading'
      :fields="fields"
      :items="assignedOrders"
      responsive="md"
      class="data-table"
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
    >
      <template #table-busy>
        <div class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
          <strong>{{ $trans('Loading...') }}</strong>
        </div>
      </template>
      <template #cell(full_name)="data">
        <router-link class="px-1" :to="{name: 'mobile-timesheet-detail', params: {user_id: data.item.user_id}, query: {date: startDate}}">
          {{ data.item.full_name }}
        </router-link>
      </template>
    </b-table>

    <b-table
      id="timehseet-material-table"
      small
      :busy='isLoading'
      :fields="materialFields"
      :items="materials"
      responsive="md"
      class="data-table"
    >
    </b-table>

  </div>
</template>

<script>
import moment from 'moment/min/moment-with-locales'

import timeSheetModel from '@/models/mobile/TimeSheet.js'
import {componentMixin} from "../../utils";

export default {
  mixins: [componentMixin],
  name: "TimeSheet",
  data() {
    return {
      today: null,
      startDate: null,
      memberType: 'maintenance',
      timeSheetModel,
      isLoading: true,
      assignedOrders: [],
      materials: [],
      fields: [],
      materialFields: [
        {label: this.$trans('Material'), key: 'material_name', sortable: true},
        {label: this.$trans('Identifier'), key: 'material_identifier', sortable: true},
        {label: this.$trans('Amount'), key: 'amount', sortable: true},
      ],
      sortBy: "total",
      sortDesc: true,
      day_field_types: null,
      day_fields: null
    }
  },
  async created() {
    const lang = this.$store.getters.getCurrentLanguage
    const monday = lang === 'en' ? 1 : 0
    this.$moment = moment
    this.$moment.locale(lang)
    this.today = this.$route.query.date ? this.$moment(this.$route.query.date) : this.$moment().weekday(monday)

    this.setDate()
    this.setArgs()

    this.memberType = await this.$store.dispatch('getMemberType')
    await this.loadData()
  },
  computed: {
    hoursTitle() {
      let result = []
      if (this.day_fields) {
        for(let i=0; i<this.day_fields.length; i++) {
          result.push(this.$trans(this.day_fields[i]))
        }
      }
      return result.join(' / ')
    }
  },
  methods: {
    setArgs() {
      const args = [
        `start_date=${this.startDate}`
      ]

      timeSheetModel.setListArgs(args.join('&'))
    },
    setDate() {
      this.startDate = this.today.format('YYYY-MM-DD')
      this.week = this.today.format('[week] W')
    },
    nextWeek() {
      this.today.add(7, 'days')
      const query = {
        ...this.$route.query,
        date: this.today.format('YYYY-MM-DD'),
      }
      this.$router.push({ query }).catch(e => {})
      //
      // this.setDate()
      // this.setArgs()
      //
      // this.loadData()
    },
    backWeek() {
      this.today.subtract(7, 'days')
      const query = {
        ...this.$route.query,
        date: this.today.format('YYYY-MM-DD'),
      }
      this.$router.push({ query }).catch(e => {})
      // this.setDate()
      // this.setArgs()
      //
      // this.loadData()
    },
    formatDays(day_data) {
      let result = []
      let hasData = false
      for(let i=0; i<day_data.length; i++) {
        if (day_data[i]) {
          if (this.day_field_types[i] === 'duration') {
            hasData = true
            result.push(this.displayDurationFromSeconds(day_data[i], true))
          } else {
            hasData = true
            result.push(day_data[i])
          }
        } else {
          result.push('-')
        }
      }

      return hasData ? result.join(' / ') : ''
    },
    async loadData() {
      this.isLoading = true

      try {
        const data = await timeSheetModel.list()
        this.day_fields = data.day_fields
        this.day_field_types = data.day_field_types
        // set materials
        this.materials = data.materials

        let header_columns = []

        header_columns.push({
          key: 'full_name',
          label: this.$trans('User'),
          sortable: true
        })

        if(data.submodel === 'student_user') {
          header_columns.push({
            key: 'full_name',
            label: this.$trans('Student'),
            sortable: true
          })
        }

        // add days
        for(let i=0; i<data.date_list.length; i++) {
          header_columns.push({
            key: `day${i}`,
            label: this.$moment(data.date_list[i]).format('ddd DD'),
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
        let results = []

        for(let i=0; i<data.result.length; i++) {
          let obj = {
            'full_name': data.result[i].full_name,
            'user_id': data.result[i].user_id,
            'submodel_id': data.result[i].submodel_id || 0,
          }

          for(let j=0; j<data.result[i].day_totals.length; j++) {
            obj[`day${j}`] = this.formatDays(data.result[i].day_totals[j])
          }

          // add week totals
          const week_totals = this.formatDays(data.result[i].week_totals)
          if (week_totals) {
            obj['total'] = week_totals
          } else {
            obj['total'] = ''
          }

          results.push(obj)
        }

        this.assignedOrders = results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching assigned orders', error)
        this.errorToast(this.$trans('Error loading orders'))
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
</style>
