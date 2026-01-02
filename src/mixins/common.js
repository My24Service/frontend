import my24 from "@/services/my24";
import {OrderService} from "@/models/orders/Order";
import {$trans, getIsLoggedIn} from "@/utils";

let componentMixin = {
  computed: {
    isStaff() {
      return this.$store.getters.getIsStaff
    },
    isSuperuser() {
      return this.$store.getters.getIsSuperuser
    },
    isPlanning() {
      return this.$store.getters.getIsPlanning
    },
    isCustomer() {
      return this.$store.getters.getIsCustomer
    },
    isEngineer() {
      return this.$store.getters.getIsEngineer
    },
    isSales() {
      return this.$store.getters.getIsSales
    },
    isStudent() {
      return this.$store.getters.getIsStudent
    },
    isEmployee() {
      return this.$store.getters.getIsEmployee
    },
    isBranchEmployee() {
      return this.$store.getters.getIsBranchEmployee
    },
    isLoggedIn() {
      return getIsLoggedIn(this.$store)
    },
    username() {
      return this.$store.getters.getUserName
    },
    hasBranches() {
      return this.$store.getters.getMemberHasBranches
    },
    companyIsDemo() {
      return this.$store.getters.getMemberCompanycode === 'demo'
    }
  },
  methods: {
    $trans(text) {
      return $trans(text)
    },
    translateHoursField(field) {
      const allFields = {
        'work_total': this.$trans("Work total"),
        'break_total': this.$trans('Breaks total'),
        'travel_total': this.$trans('Travel total'),
        'distance_total': this.$trans('Distance total'),
        'extra_work': this.$trans('Total extra work'),
        'actual_work': this.$trans('Total actual work'),
        'unforeseen_work': this.$trans('Total unforeseen work'),
        'distance_fixed_rate_amount': this.$trans('Total trips')
      }

      return allFields[field]
    },
    displayDurationFromSeconds(seconds, exclude_seconds) {
      return this.displayDuration(moment.duration(seconds*1000), exclude_seconds)
    },
    displayDuration(duration, exclude_seconds) {
      const totalMilliseconds = duration.as('milliseconds')
      const hours = parseInt(moment.duration(totalMilliseconds).asHours())
      const format = exclude_seconds ? 'mm' : 'mm:ss'
      return `${hours}:${moment.utc(totalMilliseconds).format(format)}`
    },
    async doFetchUnacceptedCountAndUpdateStore() {
      const service = new OrderService()
      const countResult = await service.getUnacceptedCount()
      if (countResult && 'count' in countResult) {
        await this.$store.dispatch('setUnacceptedCount', countResult.count)
      }
    },
    hasAccessToModule(module, part) {
      return my24.hasAccessToModule({
        isStaff: this.isStaff,
        isSuperuser: this.isSuperuser,
        contract: this.$store.state.memberContract,
        module,
        part,
      })
    },
  }
}


export default componentMixin
