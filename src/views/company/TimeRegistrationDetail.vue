<template>
  <b-overlay :show="isLoading" rounded="sm">
    <TimeRegistrationDetailData
      ref="user-hours-detail-data"
      main_grid_router_name="company-workhours"
      :breadcrumb_main_grid_title="$trans('Work hours')"
      :breadcrumb_grid_title="$trans('User work hours')"
      />

    <div class="app-detail">
      <b-table
        id="workhours-detail-table"
        small
        :busy='isLoading'
        :fields="workHoursFields"
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

import timeRegistrationModel from '../../models/company/TimeRegistration.js'
import TimeRegistrationDetailData from "../../components/TimeRegistrationDetailData.vue";

export default {
  name: "TimeRegistrationDetail",
  components: {
    TimeRegistrationDetailData
  },
  data() {
    return {
      today: moment(),
      startDate: null,
      model: timeRegistrationModel,
      isLoading: false,
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
    this.today = this.$route.query.date ? this.$moment(this.$route.query.date) : this.$moment().weekday(monday)
    this.startDate = this.today.format('YYYY-MM-DD')

    this.setArgs()

    await this.loadData()
  },
  methods: {
    setArgs() {
      let args = [
        `user=${this.user_id}`,
        `start_date=${this.startDate}`
      ]

      this.model.setListArgs(args.join('&'))

      if (parseInt(this.user_id) !== 0) {
        args = [
          `user_id=${this.user_id}`,
          `start_date=${this.startDate}`
        ]

        this.workHoursModel.setListArgs(args.join('&'))
      }
    },
    async loadData() {
      this.isLoading = true

      const response = await this.model.list()
      this.workHours = response.results

      const data = await this.workHoursModel.list()
      this.$refs['user-hours-detail-data'].processData(data)

      this.isLoading = false
    },
  }
}
</script>

<style scoped>
</style>
