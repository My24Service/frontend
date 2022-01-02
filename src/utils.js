import my24 from '@/services/my24'


function isEmpty(obj) {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object
}

let componentMixin = {
  computed: {
    isLoggedIn() {
      return this.$store.getters.isLoggedIn
    },
    username() {
      return this.$store.getters.getUserName
    },
  },
  methods: {
    hasAccessToModule(module, part) {
      return my24.hasAccessToModule({
        isStaff: this.$store.state.userInfo.is_staff,
        isSuperuser: this.$store.state.userInfo.is_superuser,
        contract: this.$store.state.memberContract,
        module,
        part,
      })
    },
  }
}

export { isEmpty, componentMixin }
