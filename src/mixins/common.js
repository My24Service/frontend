export default {
  computed: {
    // The product family from the server profile (`default` or `shltr`).
    // Family differences in a component are CSS or a branch on this.
    isDefaultFamily() {
      return useMainStore().getProductFamily === 'default'
    },
    // The product flavour from the server profile (`maintenance` or `temps`).
    flavour() {
      return useMainStore().getFlavour
    },
    isStaff() {
      const store = useAuthStore()
      return store.isStaff
    },
    isSuperuser() {
      const store = useAuthStore()
      return store.isSuperuser
    },
    isAdmin() {
      const store = useAuthStore()
      return store.isAdmin
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
    },
    branchEmployeeBranch() {
      const store = useAuthStore()
      return store.branchEmployeeBranch
    }
  },
  methods: {
    $trans(text) {
      return $trans(text)
    },
    hasAccessToModule(module, part) {
      const store = useMainStore()
      return my24.hasAccessToModule({
        isStaff: this.isStaff,
        isSuperuser: this.isSuperuser,
        modules: store.getModules,
        parts: store.getModuleParts,
        module,
        part,
      })
    },
  }
}
