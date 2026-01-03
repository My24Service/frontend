<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-detail">
      <UserHoursDataDetail
        ref="user-hours-detail-data"
        main_grid_router_name="mobile-timesheet"
        :breadcrumb_main_grid_title="$trans('Timesheet')"
        :breadcrumb_grid_title="$trans('Timesheet detail')"
      />

      <b-table
        id="timesheet-detail-material-table"
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
import UserHoursDataDetail from "../../components/UserHoursDataDetail";
import {useMainStore} from "@/stores/main";

export default {
  setup() {
    const mainStore = useMainStore()

    // expose to template and other options API hooks
    return {
      mainStore
    }
  },
  name: "TimeSheetDetail",
  components: {
    UserHoursDataDetail
  },
  data() {
    return {
      today: moment(),
      startDate: null,
      timeSheetModel,
      isLoading: false,
      materials: [],
      materialFields: [
        {label: $trans('Material'), key: 'material_name', sortable: true},
        {label: $trans('Identifier'), key: 'material_identifier', sortable: true},
        {label: $trans('Amount'), key: 'amount', sortable: true},
      ],
    }
  },
  props: {
    user_id: {
      type: [String, Number],
      default: null
    },
  },
  async created() {
    const lang = this.mainStore.getCurrentLanguage
    const monday = lang === 'en' ? 1 : 0
    this.$moment = moment
    this.$moment.locale(lang)
    this.today = this.$route.query.date ? this.$moment(this.$route.query.date) : this.$moment().weekday(monday)
    this.startDate = this.today.format('YYYY-MM-DD')

    const args = [
      `user_id=${this.user_id}`,
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
        this.materials = data.materials
        if ('user-hours-detail-data' in this.$refs && typeof this.$refs['user-hours-detail-data'].processData === "function") {
          this.$refs['user-hours-detail-data'].processData(data)
        }
        this.isLoading = false
      } catch(error) {
        console.log('error fetching timesheet details', error)
        errorToast(this.create, $trans('Error fetching timesheet details'))
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
</style>
