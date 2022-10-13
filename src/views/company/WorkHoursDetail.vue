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
        id="workhours-detail-table"
        small
        :busy='isLoading'
        :fields="fields"
        :items="workHours"
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

    </div>
  </b-overlay>
</template>

<script>
import moment from 'moment/min/moment-with-locales'

import workHoursDetailModel from '@/models/company/WorkHoursDetail.js'

export default {
  name: "WorkHoursDetail",
  data() {
    return {
      breadcrumb: [
        {
          text: this.$trans('Work hours'),
          to: {name: 'company-workhours'}
        },
        {
          text: this.$trans('Work hours detail'),
          active: true
        },
      ],
      today: moment(),
      startDate: null,
      memberType: 'maintenance',
      fullName: null,
      model: workHoursDetailModel,
      isLoading: false,
      workHours: [],
      fields: [],
    }
  },
  props: {
    user_id: {
      type: [String, Number],
      default: null
    },
  },
  async created() {
    const lang = this.$store.getters.getCurrentLanguage
    const monday = lang === 'en' ? 1 : 0
    this.$moment = moment
    this.$moment.locale(lang)
    this.today = this.$moment().weekday(monday)

    this.setDate()
    this.setArgs()

    this.memberType = await this.$store.dispatch('getMemberType')
    this.loadData()
  },
  methods: {
    setArgs() {
      const args = [
        `user_id=${this.user_id}`,
        `start_date=${this.startDate}`
      ]

      this.model.setListArgs(args.join('&'))
    },
    setDate() {
      this.startDate = this.today.format('YYYY-MM-DD')
      this.week = this.today.format('[week] W')
    },
    nextWeek() {
      this.today.add(7, 'days')
      this.setDate()
      this.setArgs()

      this.loadData()
    },
    backWeek() {
      this.today.subtract(7, 'days')
      this.setDate()
      this.setArgs()

      this.loadData()
    },
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.model.list()
        this.fullName = data.full_name
        let header_columns = [{label: this.$trans('Field'), key: 'field'}]

        // set materials
        this.materials = data.materials

        // get all weekdays from the first user
        for(let i=0; i<data.totals.length; i++) {
          header_columns.push({
            key: `day${i}`,
            label: data.totals[i].weekday,
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

        // get fields
        let fields = []
        for (const [key, value] of Object.entries(data.totals[0].totals)) {
          if (this.memberType === 'maintenance') {
            if (key === 'distance_fixed_rate_amount_total') {
              continue
            }
          } else {
            if (key === 'distance_to_total' || key === 'distance_back_total') {
              continue
            }
          }

          fields.push(key)
        }

        for(let i=0; i<fields.length; i++) {
          if (this.memberType === 'maintenance') {
            if (fields[i] === 'distance_fixed_rate_amount_total') {
              continue
            }
          } else {
            if (fields[i] === 'distance_to_total' || fields[i] === 'distance_back_total') {
              continue
            }
          }

          let field
          switch(fields[i]) {
            case 'total_work':
              field = this.$trans('Work total')
              break

            case 'travel_to_total':
              field = this.$trans('Travel to total')
              break

            case 'travel_back_total':
              field = this.$trans('Travel back total')
              break

            case 'distance_to_total':
              field = this.$trans('Distance to total')
              break

            case 'distance_back_total':
              field = this.$trans('Distance back total')
              break

            case 'distance_fixed_rate_amount_total':
              field = this.$trans('Total trips')
              break

            case 'total_extra_work':
              field = this.$trans('Total extra work')
              break

            case 'total_actual_work':
              field = this.$trans('Total actual work')
              break

            default:
              console.log(`help: ${fields[i]}`)
          }

          let row = {
            field: field
          }

          for(let j=0; j<data.totals.length; j++) {
            row[`day${j}`] = data.totals[j].totals[fields[i]]
          }

          // add week totals
          row['total'] = data['week_totals'][fields[i]]

          results.push(row)
        }

        this.assignedOrders = results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching work hours details', error)
        this.errorToast(this.$trans('Error fetching work hours details'))
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
</style>
