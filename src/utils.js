import my24 from './services/my24'
import orderNotAcceptedModel from './models/orders/OrderNotAccepted.js'


function isEmpty(obj) {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object
}

let componentMixin = {
  computed: {
    isStaff() {
      return this.$store.state.userInfo.is_staff
    },
    isSuperuser() {
      return this.$store.state.userInfo.is_superuser
    },
    isPlanning() {
      return this.$store.state.userInfo.planning_user
    },
    isCustomer() {
      return this.$store.state.userInfo.customer_user
    },
    isEngineer() {
      this.$store.state.userInfo.engineer
    },
    isSales() {
      this.$store.state.userInfo.sales_user
    },
    isStudent() {
      this.$store.state.userInfo.student_user
    },
    isLoggedIn() {
      return this.$store.getters.isLoggedIn
    },
    username() {
      return this.$store.getters.getUserName
    },
  },
  methods: {
    async doFetchUnacceptedCountAndUpdateStore() {
      const countResult = await orderNotAcceptedModel.getCount()
      await this.$store.dispatch('setUnacceptedCount', countResult.count)
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

export { isEmpty, componentMixin }
