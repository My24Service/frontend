<template>
  <div class="app-page">
    <header>
      <h3>{{ $trans("Timesheets") }}</h3>
    </header>
    <div class="panel">
      <UserHoursData
        ref="user-hours-data"
        detail_route_name="mobile-timesheet-detail"
      />

      <b-table
        id="timesheet-material-table"
        small
        :busy='isLoading'
        :fields="materialFields"
        :items="materials"
        responsive="md"
        class="data-table"
      >
      </b-table>
    </div>
  </div>
</template>

<script>
import moment from 'moment/min/moment-with-locales'

import timeSheetModel from '../../models/mobile/TimeSheet.js'
import UserHoursData from "../../components/UserHoursData";

export default {
  name: "TimeSheet",
  components: {
    UserHoursData
  },
  data() {
    return {
      today: null,
      startDate: null,
      timeSheetModel,
      isLoading: true,
      materials: [],
      materialFields: [
        {label: this.$trans('Material'), key: 'material_name', sortable: true},
        {label: this.$trans('Identifier'), key: 'material_identifier', sortable: true},
        {label: this.$trans('Amount'), key: 'amount', sortable: true},
      ],
    }
  },
  async created() {
    const lang = this.$store.getters.getCurrentLanguage
    const monday = lang === 'en' ? 1 : 0
    this.$moment = moment
    this.$moment.locale(lang)
    this.today = this.$route.query.date ? this.$moment(this.$route.query.date) : this.$moment().weekday(monday)
    this.startDate = this.today.format('YYYY-MM-DD')

    const args = [
      `start_date=${this.startDate}`
    ]

    timeSheetModel.setListArgs(args.join('&'))

    await this.loadData()
  },
  methods: {
    async loadData() {
      this.isLoading = true

      try {
        const data = await timeSheetModel.list()
        if ('user-hours-data' in this.$refs && typeof this.$refs['user-hours-data'].processData === "function") {
          this.$refs['user-hours-data'].processData(data)
        }
        this.materials = data.materials
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
