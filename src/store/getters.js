import { isEmpty } from '@/utils'

export const getters = {
  getStreamInfo: state => {
    return state.streamInfo
  },
  isLoggedIn: state => {
    return !isEmpty(state.userInfo)
  },
  getUserPk: state => {
    return state.userInfo.user.pk
  },
  getUserUUID: state => {
    return state.userInfo.user.uuid
  },
  getMemberPk: state => {
    return state.memberInfo.id
  },
  getMemberHasApiUsers: state => {
    return state.memberInfo.has_api_users
  },
  getMemberHasBranches: state => {
    return state.memberInfo.has_branches
  },
  getIsAdmin: state => {
    return state.userInfo.user.is_superuser || state.userInfo.user.is_staff
  },
  getUserName: state => {
    if (state.userInfo.is_superuser) {
      return 'superuser'
    }

    if (state.userInfo.user.first_name) {
      return state.userInfo.user.first_name
    }

    return state.userInfo.user.username
  },
  getMemberLogo(state) {
    return state.memberInfo.companylogo
  },
  getMemberName(state) {
    return state.memberInfo.name
  },
  getMemberCompanycode(state) {
    // return 'grm'
    return state.memberInfo.companycode
  },
  getCurrentLanguage(state) {
    return state.currentLanguage
  },
  getLanguages(state) {
    return state.languages
  },
  getSettingEquipmentPlanningQuickCreate(state) {
    return state.memberInfo.settings.equipment_planning_quick_create
  },
  getSettingEquipmentQuickCreate(state) {
    return state.memberInfo.settings.equipment_quick_create
  },
  getSettingEquipmentLocationPlanningQuickCreate(state) {
    return state.memberInfo.settings.equipment_location_planning_quick_create
  },
  getSettingEquipmentLocationQuickCreate(state) {
    return state.memberInfo.settings.equipment_location_quick_create
  },
  getVATTypes(state) {
    return state.memberInfo.vat_types
  },
  getInvoiceDefaultVat(state) {
    return state.memberInfo.settings.invoice_default_vat
  },
  getInvoiceDefaultMargin(state) {
    return state.memberInfo.settings.invoice_default_margin
  },
  getInvoiceDefaultHourlyRate(state) {
    return state.memberInfo.settings.invoice_default_hourly_rate
  },
  getDefaultCurrency(state) {
    return state.memberInfo.settings.default_currency
  },
  getInvoiceDefaultTermOfPaymentDays(state) {
    return state.memberInfo.settings.invoice_default_term_of_payment_days
  },
  getMaintenanceEquipment(state) {
    return state.maintenanceEquipment
  }
}
