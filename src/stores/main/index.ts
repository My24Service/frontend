import {defineStore} from 'pinia'
import my24 from "@/services/my24";
// Deep import on purpose: the "@/features/auth" door re-exports LoginForm.vue,
// which pulls bootstrap-vue-next into the stores graph and deadlocks specs
// that mock it through tests/unit/support/form-harness.js. See 2.4/2.7.
import {useAuthStore} from "@/features/auth/store";
import {setProductFamily} from "@/theme";
import * as v from 'valibot'
import type {
  InitialDataMember,
  InitialDataSettings,
  MemberTypeEnum,
  ProductFamilyEnum,
  Profile,
  Statuscode,
} from '@/api/types.gen'

/**
 * The get-initial-data member bootstrap as the store holds it. `companylogo`
 * drops the API's `null`: the brand readers (NavBrand, TheSidebar) declare it
 * `companylogo?: string`, and an absent logo reads `undefined` once loaded.
 */
export type MainMemberInfo = Omit<InitialDataMember, 'companylogo'> & {
  companylogo?: string
}

export interface MainState {
  /** Legacy list state, kept for shape: nothing in the tree reads it. */
  data: unknown[]
  next: string | null
  previous: string | null
  count: number
  num_pages: number
  urls: Record<string, unknown> | null
  currentLanguage: string | null
  languages: string[][]
  /** Write-only: set from the language vars, never read back. */
  languageUrl: string | null
  memberInfo: MainMemberInfo | null
  // {family, flavour, modules, module_parts} from get-initial-data; the product this tenant is
  profile: Profile | null
  statuscodes: Statuscode[]
  /** Legacy: the auth store owns the token, nothing reads this. */
  token: string | undefined
  unacceptedCount: number | null
  /** No typed producer or consumer in the tree; kept for shape. */
  streamInfo: unknown
  /** [] until a maintenance contract stages its order seed (an object). */
  maintenanceEquipment: unknown
  /**
   * Orders picked for dispatch. Heterogeneous by writer: full Api.Order rows
   * from the dispatch flows, id-picks from useDispatchSelection.
   */
  assignOrders: any[]
  /** Read by getMaintenanceProducts; nothing ever populates it. */
  maintenanceProducts: unknown[]
  initialDataFetched: boolean
}

export const useMainStore = defineStore('main', {
  state: (): MainState => ({
    data: [],
    next: null,
    previous: null,
    count: 0,
    num_pages: 0,
    urls: null,
    currentLanguage: null,
    languages: [],
    languageUrl: null,
    memberInfo: null,
    // {family, flavour, modules, module_parts} from get-initial-data; the product this tenant is
    profile: null,
    statuscodes: [],
    token: undefined,
    unacceptedCount: null,
    streamInfo: null,
    maintenanceEquipment: [],
    assignOrders: [],
    maintenanceProducts: [],
    initialDataFetched: false
  }),
  getters: {
    getStreamInfo: (state: MainState): unknown => {
      return state.streamInfo
    },
    getMemberPk: (state: MainState): number | undefined => {
      return state.memberInfo?.id
    },
    getMemberInfo: (state: MainState): MainMemberInfo | null => {
      return state.memberInfo
    },
    getMemberHasApiUsers: (state: MainState): boolean | undefined => {
      return state.memberInfo?.has_api_users
    },
    getMemberHasBranches: (state: MainState): boolean => {
      // Exact boolean: NavItems/TheSidebar read it into computed<boolean>
      // and NavCtx declares hasBranches: boolean.
      return state.memberInfo!.has_branches!
    },
    getMemberLogo: (state: MainState): string | undefined => {
      return state.memberInfo?.companylogo
    },
    getMemberName: (state: MainState): string | undefined => {
      return state.memberInfo?.name
    },
    getMemberCompanycode: (state: MainState): string | undefined => {
      return state.memberInfo?.companycode
    },
    getCurrentLanguage: (state: MainState): string | null => {
      return state.currentLanguage
    },
    getLanguages: (state: MainState): string[][] => {
      return state.languages
    },
    /**
     * The typed tenant settings (MemberSettings from the API, plus
     * mobile_hours_select_user). The per-key getters below are thin aliases
     * kept for one release; read this one.
     */
    getSettings: (state: MainState): InitialDataSettings | undefined => {
      return state.memberInfo?.settings
    },
    getSettingEquipmentPlanningQuickCreate: (state: MainState): boolean | undefined => {
      return state.memberInfo?.settings?.equipment_planning_quick_create
    },
    getSettingEquipmentQuickCreate: (state: MainState): boolean | undefined => {
      return state.memberInfo?.settings?.equipment_quick_create
    },
    getSettingEquipmentLocationPlanningQuickCreate: (state: MainState): boolean | undefined => {
      return state.memberInfo?.settings?.equipment_location_planning_quick_create
    },
    getSettingEquipmentLocationQuickCreate: (state: MainState): boolean | undefined => {
      return state.memberInfo?.settings?.equipment_location_quick_create
    },
    getVATTypes: (state: MainState): number[] | undefined => {
      return state.memberInfo?.vat_types
    },
    getInvoiceDefaultVat: (state: MainState): number => {
      // Exact number: the invoice cost panels feed it to makeCostRow's
      // `vat: string | number`.
      const vat = state.memberInfo?.settings?.invoice_default_vat
      if (vat === undefined) throw new Error('main store: member info not loaded')
      return vat
    },
    getInvoiceDefaultHourlyRate: (state: MainState): string | undefined => {
      return state.memberInfo?.settings?.invoice_default_hourly_rate
    },
    getDefaultCurrency: (state: MainState): string => {
      // Exact string: BudgetView reads it into computed<string> and
      // toDinero's currency param is string.
      const currency = state.memberInfo?.settings?.default_currency
      if (currency === undefined) throw new Error('main store: member info not loaded')
      return currency
    },
    getInvoiceDefaultTermOfPaymentDays: (state: MainState): number | undefined => {
      return state.memberInfo?.settings?.invoice_default_term_of_payment_days
    },
    getInvoiceDefaultPricePerKm: (state: MainState): string | undefined => {
      return state.memberInfo?.settings?.invoice_default_price_per_km
    },
    getQuotationDefaultExpireDays: (state: MainState): number | undefined => {
      return state.memberInfo?.settings?.quotation_default_expire_days
    },
    getWorkorderShowRelatedOrders: (state: MainState): boolean | undefined => {
      return state.memberInfo?.settings?.workorder_show_related_orders
    },
    getMaintenanceEquipment: (state: MainState): unknown => {
      return state.maintenanceEquipment
    },
    getEquipmentQrType: (state: MainState): string | undefined => {
      return state.memberInfo?.equipment_qr_type
    },
    getMemberUsesEquipment: (state: MainState): boolean | undefined => {
      return state.memberInfo?.settings?.order_uses_equipment
    },
    getQuotationDefaultCallOutCosts: (state: MainState): string | undefined => {
      return state.memberInfo?.settings?.quotation_default_call_out_costs
    },
    getQuotationDefaultVat: (state: MainState): number | undefined => {
      return state.memberInfo?.settings?.quotation_default_vat
    },
    getQuotationDefaultHourlyRate: (state: MainState): string | undefined => {
      return state.memberInfo?.settings?.quotation_default_hourly_rate
    },
    getQuotationDefaultPricePerKm: (state: MainState): string | undefined => {
      return state.memberInfo?.settings?.quotation_default_price_per_km
    },
    getOrderListMustIncludeReference: (state: MainState): boolean | undefined => {
      return state.memberInfo?.settings?.order_list_include_reference
    },
    getAutomaticBreakCalculationEnabled: (state: MainState): boolean | undefined => {
      return state.memberInfo?.settings?.break_calculation
    },
    getAutomaticBreakCalculationSettings: (state: MainState): { after: number; duration: number } => {
      if (state.memberInfo?.settings?.break_calculation)
        return {
          after: parseInt(String(state.memberInfo?.settings?.break_calculation_after_minutes)),
          duration: parseInt(String(state.memberInfo?.settings?.break_calculation_duration_minutes)),
        };

      return {after: 0, duration: 0};
    },
    getStatuscodes(): Statuscode[] {
      return this.statuscodes
    },
    getCountries(): string[] | undefined {
      return this.memberInfo?.countries
    },
    getOrderTypes(): string[] | undefined {
      return this.memberInfo?.order_types
    },
    getMemberType(): MemberTypeEnum {
      // Exact flavour string: NavCtx declares memberType: string.
      return this.memberInfo!.member_type!
    },
    getProfile: (state: MainState): Profile | null => state.profile,
    getProductFamily: (state: MainState): ProductFamilyEnum => state.profile ? state.profile.family : 'default',
    getFlavour: (state: MainState): MemberTypeEnum => state.profile ? state.profile.flavour : 'maintenance',
    getModules: (state: MainState): string[] => state.profile ? state.profile.modules : [],
    getModuleParts: (state: MainState) => state.profile && state.profile.module_parts ? state.profile.module_parts : {},
    getMaintenanceProducts(): unknown[] {
      return this.maintenanceProducts
    },
    getAssignOrders(): any[] {
      return this.assignOrders
    },
    isInitialDataFetched: (state: MainState): boolean => {
      return state.initialDataFetched
    }
  },
  actions: {
    setInitialDataFetched(): void {
      this.initialDataFetched = true
    },
    resetInitialDataFetched(): void {
      this.initialDataFetched = false
    },
    setMemberInfo(memberInfo: MainMemberInfo | null): void {
      this.memberInfo = memberInfo
    },
    setProfile(profile: Profile | null): void {
      this.profile = profile
      setProductFamily(profile ? profile.family : null)
    },
    setStreamInfo(streamInfo: unknown): void {
      this.streamInfo = streamInfo
    },
    setUnacceptedCount(count: number): void {
      this.unacceptedCount = count
    },
    setAssignOrders(orders: any[]): void {
      this.assignOrders = orders
    },
    setMaintenanceEquipment(maintenanceEquipment: unknown): void {
      this.maintenanceEquipment = maintenanceEquipment
    },
    async setLanguage(language: string): Promise<void> {
      this.currentLanguage = language

      if (language === 'nl') {
        await import('@valibot/i18n/nl')
        v.setGlobalConfig({ lang: 'nl' })
      } else {
        v.setGlobalConfig({ lang: 'en' })
      }
    },
    setLanguageUrl(languageUrl: string): void {
      this.languageUrl = languageUrl
    },
    setLanguages(languages: string[][]): void {
      this.languages = languages
    },
    setStatuscodes(statuscodes: Statuscode[]): void {
      this.statuscodes = statuscodes
    },
    async checkInitialData(): Promise<void> {
      if (!this.isInitialDataFetched) {
        await this.getInitialData()
      }
    },
    async getInitialData(): Promise<void> {
      const authStore = useAuthStore()
      const languageVars = await my24.getLanguageVars()
      const initialData = await my24.getInitialData()

      document.title = initialData.memberInfo.name
      window.member_type_text = initialData.memberInfo.member_texts

      authStore.setUserInfo(initialData.userInfo)
      this.setLanguageUrl(languageVars.set_language_url)
      await this.setLanguage(languageVars.current_language)
      this.setLanguages(languageVars.languages)
      this.setMemberInfo(initialData.memberInfo)
      this.setProfile(initialData.profile)
      this.setStatuscodes(initialData.statuscodes)
      this.setInitialDataFetched()
    },
    hasAccessToRoute(route: string): boolean {
      const authStore = useAuthStore()
      const mainStore = useMainStore()
      let parts = route.split('/')
      parts.shift()
      const lenParts = parts.length
      const [mod, part] = parts

      return my24.hasAccessToModule({
        modules: mainStore.getModules,
        parts: mainStore.getModuleParts,
        module: mod,
        part,
        lenParts,
        isStaff: authStore.isStaff,
        isSuperuser: authStore.isSuperuser,
      })
    },
    status2color(status: string): string | undefined {
      if (!status) {
        console.log('no status')
        return
      }

      for (let i=0; i<this.statuscodes.length; i++) {
        const statuscode = this.statuscodes[i]
        let color = statuscode.color ?? ''

        if (color.substr(0, 1) !== '#') color = '#' + color

        const re = new RegExp(statuscode.statuscode, 'i')
        if (re.test(status)) {
          return color
        }

        if (status === statuscode.statuscode) {
          return color
        }
      }
      return ''
    },
  }
})
