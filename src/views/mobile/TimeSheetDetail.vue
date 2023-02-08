<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-detail">
      <b-breadcrumb class="mt-2" :items="breadcrumb"></b-breadcrumb>
      <b-row>
        <b-col cols="2">
          <b-link class="px-1" @click.prevent="backWeek" v-bind:title="$trans('Week back')">
            <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
          </b-link>
        </b-col>
        <b-col cols="8">
          {{ $trans('Totals in') }}
          {{ week }}/{{ today.format('Y') }}
          {{ $trans('for') }} {{ fullName }}
        </b-col>
        <b-col cols="2">
          <div class="float-right">
            <b-link class="px-1" @click.prevent="nextWeek" v-bind:title="$trans('Next week') ">
              <b-icon-arrow-right font-scale="1.8"></b-icon-arrow-right>
            </b-link>
          </div>
        </b-col>
      </b-row>

      <b-table
        id="timehseet-detail-table"
        small
        :busy='isLoading'
        :fields="fields"
        :items="assignedOrders"
        responsive="md"
        class="data-table"
      >
        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
      </b-table>

      <b-table
        id="timehseet-detail-material-table"
        small
        :busy='isLoading'
        :fields="materialFields"
        :items="materials"
        responsive="md"
        class="data-table"
      >
      </b-table>

    </div>
  </b-overlay>
</template>

<script>
import moment from 'moment/min/moment-with-locales'

import timeSheetModel from '../../models/mobile/TimeSheet.js'
import {componentMixin} from "../../utils";

export default {
  mixins: [componentMixin],
  name: "TimeSheetDetail",
  data() {
    return {
      today: moment(),
      startDate: null,
      memberType: 'maintenance',
      fullName: null,
      timeSheetModel,
      isLoading: false,
      assignedOrders: [],
      materials: [],
      fields: [],
      materialFields: [
        {label: this.$trans('Material'), key: 'material_name', sortable: true},
        {label: this.$trans('Identifier'), key: 'material_identifier', sortable: true},
        {label: this.$trans('Amount'), key: 'amount', sortable: true},
      ],
    }
  },
  props: {
    user_id: {
      type: [String, Number],
      default: null
    },
  },
  computed: {
    breadcrumb() {
      return [
        {
          text: this.$trans('Timesheet'),
          to: {name: 'mobile-timesheet', query: {date: this.startDate}}
        },
        {
          text: this.$trans('Timesheet detail'),
          active: true
        },
      ]
    },
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
  methods: {
    setArgs() {
      const args = [
        `user_id=${this.user_id}`,
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
    formatValue(val, index) {
      if (this.day_field_types[index] === 'duration') {
        return this.displayDurationFromSeconds(val, true)
      }

      return val
    },
    async loadData() {
      this.isLoading = true

      try {
        const data = await timeSheetModel.list()
        this.day_fields = data.day_fields
        this.day_field_types = data.day_field_types
        this.fullName = data.full_name

        // set materials
        this.materials = data.materials

        this.fullName = data.full_name
        let header_columns = [{label: this.$trans('Field'), key: 'field'}]

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

        if (data.result.length) {
          for(let i=0; i<this.day_fields.length; i++) {
            let field = this.day_fields[i]

            let row = {
              field: field
            }

            for(let j=0; j<data.result[0].day_totals.length; j++) {
              row[`day${j}`] = this.formatValue(data.result[0].day_totals[j][i], i)
            }

            row['total'] = this.formatValue(data.result[0].week_totals[i], i)
            //
            // // add week totals
            // row['total'] = data['week_totals'][fields[i]]

            results.push(row)
          }
        }

        this.assignedOrders = results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching timesheet details', error)
        this.errorToast(this.$trans('Error fetching timesheet details'))
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
</style>
