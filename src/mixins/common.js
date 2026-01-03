import my24 from "@/services/my24";
import {$trans} from "@/utils";
import {useAuthStore} from "@/stores/auth";
import {useMainStore} from "@/stores/main";

let componentMixin = {
  computed: {
    isStaff() {
      const store = useAuthStore()
      return store.isStaff
    },
    isSuperuser() {
      const store = useAuthStore()
      return store.isSuperuser
    },
    isAdmin() {
      return this.isStaff || this.isSuperuser
    },
    isPlanning() {
      const store = useAuthStore()
      return store.isPlanning
    },
    isCustomer() {
      const store = useAuthStore()
      return store.isCustomer
    },
    isEngineer() {
      const store = useAuthStore()
      return store.isEngineer
    },
    isSales() {
      const store = useAuthStore()
      return store.isSales
    },
    isStudent() {
      const store = useAuthStore()
      return store.isStudent
    },
    isEmployee() {
      const store = useAuthStore()
      return store.isEmployee
    },
    isBranchEmployee() {
      const store = useAuthStore()
      return store.isBranchEmployee
    },
    isLoggedIn() {
      const store = useAuthStore()
      return store.isLoggedIn
    },
    username() {
      const store = useAuthStore()
      return store.getUserName
    },
    hasBranches() {
      const store = useMainStore()
      return store.getMemberHasBranches
    },
    companyIsDemo() {
      const store = useMainStore()
      return store.getMemberCompanycode === 'demo'
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
    hasAccessToModule(module, part) {
      const store = useMainStore()
      return my24.hasAccessToModule({
        isStaff: this.isStaff,
        isSuperuser: this.isSuperuser,
        contract: store.memberContract,
        module,
        part,
      })
    },
  }
}


export default componentMixin
