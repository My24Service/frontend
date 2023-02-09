<template>
  <div class="app-grid">
    <UserHoursData
      ref="user-hours-data"
      detail_route_name="company-workhours-detail"
    />
  </div>
</template>

<script>
import moment from 'moment/min/moment-with-locales'

import workHoursModel from "../../models/company/WorkHours";
import UserHoursData from "../../components/UserHoursData";

export default {
  name: "WorkHours",
  data() {
    return {
      today: null,
      startDate: null,
      model: workHoursModel,
      isLoading: true,
    }
  },
  components: {
    UserHoursData
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

    this.model.setListArgs(args.join('&'))

    await this.loadData()
  },
  methods: {
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.model.list()
        this.$refs['user-hours-data'].processData(data)
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
