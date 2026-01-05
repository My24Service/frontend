import {defineStore} from 'pinia'
import my24 from "@/services/my24";
import {useAuthStore} from "@/stores/auth";
import {isEmpty} from "@/utils";

export const useMainStore = defineStore('main', {
  state: () => ({
    data: [],
    next: null,
    previous: null,
    count: 0,
    num_pages: 0,
    urls: null,
    memberContract: null,
    currentLanguage: null,
    languages: [],
    languageUrl: null,
    memberInfo: null,
    statuscodes: [],
    token: undefined,
    unacceptedCount: null,
    streamInfo: null,
    maintenanceEquipment: [],
    initialDataFetched: false
  }),
  getters: {
    getStreamInfo: (state) => {
      return state.streamInfo
    },
    getMemberPk: (state) => {
      return state.memberInfo.id
    },
    getMemberInfo: (state) => {
      return state.memberInfo
    },
    getMemberHasApiUsers: (state) => {
      return state.memberInfo.has_api_users
    },
    getMemberHasBranches: (state) => {
      return state.memberInfo.has_branches
    },
    getMemberLogo: (state) => {
      return state.memberInfo.companylogo
    },
    getMemberName: (state) => {
      return state.memberInfo.name
    },
    getMemberCompanycode: (state) => {
      // return 'grm'
      return state.memberInfo.companycode
    },
    getCurrentLanguage: (state) => {
      return state.currentLanguage
    },
    getLanguages: (state) => {
      return state.languages
    },
    getSettingEquipmentPlanningQuickCreate: (state) => {
      return state.memberInfo.settings.equipment_planning_quick_create
    },
    getSettingEquipmentQuickCreate: (state) => {
      return state.memberInfo.settings.equipment_quick_create
    },
    getSettingEquipmentLocationPlanningQuickCreate: (state) => {
      return state.memberInfo.settings.equipment_location_planning_quick_create
    },
    getSettingEquipmentLocationQuickCreate: (state) => {
      return state.memberInfo.settings.equipment_location_quick_create
    },
    getVATTypes: (state) => {
      return state.memberInfo.vat_types
    },
    getInvoiceDefaultVat: (state) => {
      return state.memberInfo.settings.invoice_default_vat
    },
    getInvoiceDefaultMargin: (state) => {
      return state.memberInfo.settings.invoice_default_margin
    },
    getInvoiceDefaultHourlyRate: (state) => {
      return state.memberInfo.settings.invoice_default_hourly_rate
    },
    getDefaultCurrency: (state) => {
      return state.memberInfo.settings.default_currency
    },
    getInvoiceDefaultTermOfPaymentDays: (state) => {
      return state.memberInfo.settings.invoice_default_term_of_payment_days
    },
    getInvoiceDefaultPricePerKm: (state) => {
      return state.memberInfo.settings.invoice_default_price_per_km
    },
    getQuotationDefaultExpireDays: (state) => {
      return state.memberInfo.settings.quotation_default_expire_days
    },
    getMaintenanceEquipment: (state) => {
      return state.maintenanceEquipment
    },
    getEquipmentQrType: (state) => {
      return state.memberInfo.equipment_qr_type
    },
    getMemberUsesEquipment: (state) => {
      return state.memberInfo.settings.order_uses_equipment
    },
    getQuotationDefaultCallOutCosts: (state) => {
      return state.memberInfo.settings.quotation_default_call_out_costs
    },
    getQuotationDefaultVat: (state) => {
      return state.memberInfo.settings.quotation_default_vat
    },
    getQuotationDefaultHourlyRate: (state) => {
      return state.memberInfo.settings.quotation_default_hourly_rate
    },
    getQuotationDefaultPricePerKm: (state) => {
      return state.memberInfo.settings.quotation_default_price_per_km
    },
    getOrderListMustIncludeReference: (state) => {
      return state.memberInfo.settings.order_list_include_reference
    },
    getGrippAvailable: (state) => {
      return state.memberInfo.settings.gripp_api_available;
    },
    getAutomaticBreakCalculationEnabled: (state) => {
      return state.memberInfo.settings.break_calculation
    },
    getAutomaticBreakCalculationSettings: (state) => {
      if (state.memberInfo.settings.break_calculation)
        return {
          after: parseInt(state.memberInfo.settings.break_calculation_after_minutes),
          duration: parseInt(state.memberInfo.settings.break_calculation_duration_minutes),
        };

      return {after: 0, duration: 0};
    },
    getStatuscodes() {
      return this.statuscodes
    },
    getCountries() {
      return this.memberInfo.countries
    },
    getOrderTypes() {
      return this.memberInfo.order_types
    },
    getMemberType() {
      return this.memberInfo.member_type
    },
    getMaintenanceProducts() {
      return this.maintenanceProducts
    },
    getAssignOrders() {
      return this.assignOrders
    },
    isInitialDataFetched: (state) => {
      return state.initialDataFetched
    }
  },
  actions: {
    setInitialDataFetched() {
      this.initialDataFetched = true
    },
    setMemberInfo(memberInfo) {
      this.memberInfo = memberInfo
    },
    setStreamInfo(streamInfo) {
      this.streamInfo = streamInfo
    },
    setUnacceptedCount(count) {
      this.unacceptedCount = count
    },
    setAssignOrders(orders) {
      state.assignOrders = orders
    },
    setMaintenanceEquipment(maintenanceEquipment) {
      this.maintenanceEquipment = maintenanceEquipment
    },
    setLanguage(language) {
      this.currentLanguage = language
    },
    setLanguageUrl(languageUrl) {
      this.languageUrl = languageUrl
    },
    setLanguages(languages) {
      this.languages = languages
    },
    setMemberContract(contract) {
      this.memberContract = contract
    },
    setStatuscodes(statuscodes) {
      this.statuscodes = statuscodes
    },
    async checkInitialData() {
      if (!this.isInitialDataFetched) {
        await this.getInitialData()
      }
    },
    async getInitialData() {
      return new Promise(async (resolve, reject) => {
        try {
          const authStore = useAuthStore()
          const languageVars = await my24.getLanguageVars()
          const initialData = await my24.getInitialData()

          const memberContract = !isEmpty(initialData.memberInfo) && initialData.memberInfo.contract ? my24.getModelsFromString(initialData.memberInfo.contract.member_contract) : {}

          document.title = initialData.memberInfo.name
          window.member_type_text = initialData.memberInfo.member_texts

          authStore.setUserInfo(initialData.userInfo)
          this.setLanguageUrl(languageVars.set_language_url)
          this.setLanguage(languageVars.current_language)
          this.setLanguages(languageVars.languages)
          this.setMemberInfo(initialData.memberInfo)
          this.setMemberContract(memberContract)
          this.setStatuscodes(initialData.statuscodes)
          this.setInitialDataFetched()
          resolve()
        } catch(e) {
          reject(e)
        }
      })
    },
    hasAccessToRoute(route) {
      const authStore = useAuthStore()
      const mainStore = useMainStore()
      let parts = route.split('/')
      parts.shift()
      const lenParts = parts.length
      const [mod, part] = parts

      return my24.hasAccessToModule({
        contract: mainStore.memberContract,
        module: mod,
        part,
        lenParts,
        isStaff: authStore.isStaff,
        isSuperuser: authStore.isSuperuser,
      })
    },
    status2color(status) {
      // return new Promise((resolve) => {
      if (!status) {
        console.log('no status')
        return
      }

      for (let i=0; i<state.statuscodes.length; i++) {
        const statuscode = state.statuscodes[i]
        let color = statuscode.color

        if (color.substr(0, 1) !== '#') color = '#' + color

        // first try regex
        const re = new RegExp(statuscode, 'i')
        if (re.test(status)) {
          return color
        }

        if (status === statuscode) {
          return color
        }
      }
      return ''
    },
  }
})
