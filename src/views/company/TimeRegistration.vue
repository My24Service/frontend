<template>
  <div class="app-page">
    <header>
      <h3>{{ $trans("Time registration") }}</h3>
    </header>
    <div class='panel'>
      <TimeRegistrationData
        ref="user-time-registration"
        :user_id="user_id"
      />
    </div>
  </div>
</template>

<script>
import moment from 'moment/min/moment-with-locales'

import { TimeRegistrationService } from "../../models/company/TimeRegistration";
import TimeRegistrationData from "../../components/TimeRegistrationData.vue";

export default {
  name: "TimeRegistration",
  props: {
    user_id: {
      type: [String, Number],
      default: null
    },
  },
  data() {
    return {
      today: null,
      startDate: null,
      service: new TimeRegistrationService(),
      isLoading: true,
      mode: null
    }
  },
  components: {
    TimeRegistrationData
  },
  async created() {
    const lang = this.$store.getters.getCurrentLanguage
    const monday = lang === 'en' ? 1 : 0
    this.$moment = moment
    this.$moment.locale(lang)
    this.today = this.$route.query.date ? this.$moment(this.$route.query.date) : this.$moment().weekday(monday)
    this.mode = this.$route.query.mode ? this.$route.query.mode : 'week'

    await this.loadData()
  },
  methods: {
    async loadData() {
      this.isLoading = true

      try {
        let args = [
          `mode=${this.mode}`
        ]

        if (this.user_id) {
          args.push(`user=${this.user_id}`)
        }

        if (this.mode === 'week') {
          args.push(`start_date=${this.today.format('YYYY-MM-DD')}`)
        }

        if (this.mode === 'month') {
          args.push(`month=${this.today.format('MM')}`)
          args.push(`year=${this.today.format('YYYY')}`)
        }

        if (this.mode === 'year') {
          args.push(`year=${this.today.format('YYYY')}`)
        }

        this.service.setListArgs(args.join('&'))

        const data = await this.service.list()
        this.$refs['user-time-registration'].processData(data)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching time data', error)
        this.errorToast(this.$trans('Error loading time data'))
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
</style>
