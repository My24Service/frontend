<template>
  <div class="app-grid">
    <b-row>
      <b-col cols="2">
        <b-link @click.prevent="backWeek" v-bind:title="$trans('Week back')">
          <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
        </b-link>
      </b-col>
      <b-col cols="8">
        {{ $trans('Total work hours') }} - {{ week }}/{{ today.format('Y') }}
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
      id="workhours-table"
      small
      :busy='isLoading'
      :fields="fields"
      :items="workHours"
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
        <router-link class="px-1" :to="{name: 'company-workhours-detail', params: {submodel_id: data.item.submodel_id, user_id: data.item.user_id}}">
          {{ data.item.full_name }}
        </router-link>
      </template>
    </b-table>

  </div>
</template>

<script>
import moment from 'moment/min/moment-with-locales'

import workHoursModel from "../../models/company/WorkHours";

export default {
  name: "WorkHours",
  data() {
    return {
      today: null,
      startDate: null,
      model: workHoursModel,
      isLoading: true,
      workHours: [],
      fields: [],
      sortBy: "full_name",
      sortDesc: false
    }
  },
  async created() {
    const lang = this.$store.getters.getCurrentLanguage
    const monday = lang === 'en' ? 1 : 0
    this.$moment = moment
    this.$moment.locale(lang)
    this.today = this.$route.query.start_date ? this.$moment(this.$route.query.start_date) : this.$moment().weekday(monday)

    this.setDate()
    this.setArgs()

    await this.loadData()
  },
  methods: {
    setArgs() {
      const args = [
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
      const query = {
        ...this.$route.query,
        start_date: this.today.format('YYYY-MM-DD'),
      }
      this.$router.push({ query }).catch(e => {})
    },
    backWeek() {
      this.today.subtract(7, 'days')

      const query = {
        ...this.$route.query,
        start_date: this.today.format('YYYY-MM-DD'),
      }
      this.$router.push({ query }).catch(e => {})
    },
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.model.list()
        let header_columns = []

        header_columns.push({
          key: 'full_name',
          label: this.$trans('User'),
          sortable: true
        })

        // get all weekdays from the first user
        if (data.result.length) {
          for(let i=0; i<data.result[0].totals.length; i++) {
            header_columns.push({
              key: `day${i}`,
              label: data.result[0].totals[i].weekday,
              sortable: true
            })
          }
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

          for(let j=0; j<data.result[i].totals.length; j++) {
            obj[`day${j}`] = data.result[i].totals[j].total
          }

          // add week totals
          obj['total'] = `${data.result[i].total_duration} (${data.result[i].perc})`

          results.push(obj)
        }

        this.workHours = results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching workhours', error)
        this.errorToast(this.$trans('Error loading workhours'))
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
</style>
