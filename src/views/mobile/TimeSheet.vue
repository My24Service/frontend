<template>
  <div class="app-page">
    <header>
      <h3>{{ this.$trans("Timesheets") }}</h3>
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
import {useToast} from "bootstrap-vue-next";
import {useMainStore} from "@/stores/main";
import componentMixin from "@/mixins/common";
import {errorToast} from "@/utils";

export default {
  setup() {
    const {create} = useToast()
    const mainStore = useMainStore()

    // expose to template and other options API hooks
    return {
      create,
      mainStore
    }
  },
  mixins: [componentMixin],
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
    const lang = this.mainStore.getCurrentLanguage
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
        errorToast(this.create, this.$trans('Error loading orders'))
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
</style>
