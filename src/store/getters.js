import { isEmpty } from '@/utils'
import {AUTH_LEVELS} from "@/constants";

export const getters = {
  getStreamInfo: state => {
    return state.streamInfo
  },
  isLoggedIn: state => {
    return !!!isEmpty(state.userInfo)
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
  getGrippAvailable(state) {
    return state.memberInfo.settings.gripp_api_available;
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
  },

  // migrated from utils
  getIsStaff(state) {
    return state.userInfo.submodel === 'staff' && state.userInfo.user.is_staff
    // return state.userInfo.hasOwnProperty('is_staff') && state.userInfo.is_staff
  },
  getIsSuperuser(state) {
    return state.userInfo.submodel === 'superuser' && state.userInfo.user.is_superuser
    // return state.userInfo.hasOwnProperty('is_superuser') && state.userInfo.is_superuser
  },
  getIsPlanning(state) {
    return state.userInfo.submodel === 'planning_user' && state.userInfo.user.planning_user
    // return state.userInfo.hasOwnProperty('planning_user') && state.userInfo.planning_user
  },
  getIsCustomer(state) {
    return state.userInfo.submodel === 'customer_user' && state.userInfo.user.customer_user
    // return state.userInfo.hasOwnProperty('customer_user') && state.userInfo.customer_user
  },
  getIsEngineer(state) {
    return state.userInfo.submodel === 'engineer' && state.userInfo.user.engineer
    // return state.userInfo.hasOwnProperty('engineer') && state.userInfo.engineer
  },
  getIsSales(state) {
    return state.userInfo.submodel === 'sales_user' && state.userInfo.user.sales_user
    // return state.userInfo.hasOwnProperty('sales_user') && state.userInfo.sales_user
  },
  getIsStudent(state) {
    return state.userInfo.submodel === 'student_user' && state.userInfo.user.student_user
    // return state.userInfo.hasOwnProperty('student_user') && state.userInfo.student_user
  },
  getIsEmployee(state) {
    return state.userInfo.submodel === 'employee_user' && state.userInfo.user.employee_user
    // return state.userInfo.hasOwnProperty() && state.userInfo.employee_user
  },
  getIsBranchEmployee(state) {
    return state.userInfo.submodel === 'employee_user' && state.userInfo.user.employee_user && state.userInfo.user.employee_user.branch
    // return state.userInfo.user.hasOwnProperty('employee_user') && state.userInfo.employee_user && state.userInfo.employee_user.branch
  },
}
