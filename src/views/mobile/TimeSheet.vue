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
          {{ $trans('Total work hours / Total travel / Total distance') }}
        </p>
        <p v-if="this.memberType === 'temps'">
          {{ $trans('Total hours / Total trips') }}
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
        <router-link class="px-1" :to="{name: 'mobile-timesheet-detail', params: {submodel_id: data.item.submodel_id}}">
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

export default {
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
      sortDesc: true
    }
  },
  created() {
    // moment
    const lang = this.$store.getters.getCurrentLanguage
    const monday = lang === 'en' ? 1 : 0
    this.$moment = moment
    this.$moment.locale(lang)
    this.today = this.$moment().weekday(monday)

    this.setDate()
    this.setArgs()

    // get member type
    this.$store.dispatch('getMemberType').then((memberType) => {
      this.memberType = memberType
      this.loadData()
    })
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

      timeSheetModel.list().then((data) => {
        let header_columns = []

        if(data.submodel === 'engineer') {
          header_columns.push({
            key: 'full_name',
            label: this.$trans('Engineer'),
            sortable: true
          })
        }

        if(data.submodel === 'student_user') {
          header_columns.push({
            key: 'full_name',
            label: this.$trans('Student'),
            sortable: true
          })
        }

        // set materials
        this.materials = data.materials

        // get all weekdays from the first user
        for(let i=0; i<data.activity[0].totals.length; i++) {
          header_columns.push({
            key: `day${i}`,
            label: data.activity[0].totals[i].weekday,
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

        for(let i=0; i<data.activity.length; i++) {
          let row = [], obj = {'full_name': data.activity[i].full_name, 'submodel_id': data.activity[i].submodel_id}

          if (this.memberType === 'temps') {
            for(let j=0; j<data.activity[i].totals.length; j++) {
              obj[`day${j}`] = data.activity[i].totals[j].totals.total_time + ' / ' +
                data.activity[i].totals[j].totals.total_distance_fixed_rate_amount
            }

            // add week totals
            obj['total'] = data.activity[i].week_totals.total_time + ' / ' +
              data.activity[i].week_totals.total_distance_fixed_rate_amount

            results.push(obj)

          } else {
            for(let j=0; j<data.activity[i].totals.length; j++) {
              obj[`day${j}`] = data.activity[i].totals[j].totals.total_work + ' / ' +
                data.activity[i].totals[j].totals.total_travel + ' / ' +
                data.activity[i].totals[j].totals.total_distance
            }

            // add week totals
            obj['total'] = data.activity[i].week_totals.total_work + ' / ' +
              data.activity[i].week_totals.total_travel + ' / ' +
              data.activity[i].week_totals.total_distance

            results.push(obj)
          }
        }

        this.assignedOrders = results
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching assigned orders', error)
        this.errorToast(this.$trans('Error loading orders'))
        this.isLoading = false
      })
    }
  }
}
</script>

<style scoped>
</style>
