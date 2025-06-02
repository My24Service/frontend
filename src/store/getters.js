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
  getMemberInfo: state => {
    return state.memberInfo
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
  getInvoiceDefaultPricePerKm(state) {
    return state.memberInfo.settings.invoice_default_price_per_km
  },
  getQuotationDefaultExpireDays(state) {
    return state.memberInfo.settings.quotation_default_expire_days
  },
  getMaintenanceEquipment(state) {
    return state.maintenanceEquipment
  },
  getEquipmentQrType(state) {
    return state.memberInfo.equipment_qr_type
  },
  getMemberUsesEquipment(state) {
    return state.memberInfo.settings.order_uses_equipment
  },
  getQuotationDefaultCallOutCosts(state) {
    return state.memberInfo.settings.quotation_default_call_out_costs
  },
  getQuotationDefaultVat(state) {
    return state.memberInfo.settings.quotation_default_vat
  },
  getQuotationDefaultHourlyRate(state) {
    return state.memberInfo.settings.quotation_default_hourly_rate
  },
  getQuotationDefaultPricePerKm(state) {
    return state.memberInfo.settings.quotation_default_price_per_km
  },
  getOrderListMustIncludeReference(state) {
    return state.memberInfo.settings.order_list_include_reference
  },
  getAutomaticBreakCalculationEnabled(state) {
    return state.memberInfo.settings.break_calculation
  },
  getAutomaticBreakCalculationSettings(state) {
    if (state.memberInfo.settings.break_calculation)
      return {
        after: parseInt(state.memberInfo.settings.break_calculation_after_minutes),
        duration: parseInt(state.memberInfo.settings.break_calculation_duration_minutes),
      };

    return { after: 0, duration: 0};
  }
}
