import type { CostTypeEnum, UsePriceEnum } from '@/api/types.gen'
import type { InvoiceLineOption, InvoiceLineType } from './calculations'

export type { InvoiceLineOption, InvoiceLineType }

// Collection option the "add to invoice lines" control picks per cost table.
export const OPTION_USER_TOTALS = 'user_totals'
export const OPTION_ONLY_TOTAL = 'total'
export const OPTION_NONE = 'none'

export const INVOICE_LINE_TYPE_USED_MATERIALS = 'used-materials'
export const INVOICE_LINE_TYPE_CALL_OUT_COSTS = 'call-out-costs'
export const INVOICE_LINE_TYPE_DISTANCE = 'distance'
export const INVOICE_LINE_TYPE_HOURS_TYPE_WORK = 'work'
export const INVOICE_LINE_TYPE_HOURS_TYPE_TRAVEL = 'travel'
export const INVOICE_LINE_TYPE_HOURS_TYPE_EXTRA_WORK = 'extra-work'
export const INVOICE_LINE_TYPE_HOURS_TYPE_ACTUAL_WORK = 'actual-work'
export const INVOICE_LINE_TYPE_MANUAL = 'manual'

export const USE_PRICE_SETTINGS = 'settings'
export const USE_PRICE_CUSTOMER = 'customer'
export const USE_PRICE_USER = 'user'
export const USE_PRICE_PURCHASE = 'purchase'
export const USE_PRICE_SELLING = 'selling'
export const USE_PRICE_OTHER = 'other'

export type UsePrice = UsePriceEnum
export type CostType = CostTypeEnum

export const COST_TYPE_USED_MATERIALS = 'used_materials' satisfies CostTypeEnum
export const COST_TYPE_WORK_HOURS = 'work_hours' satisfies CostTypeEnum
export const COST_TYPE_TRAVEL_HOURS = 'travel_hours' satisfies CostTypeEnum
export const COST_TYPE_EXTRA_WORK = 'extra_work' satisfies CostTypeEnum
export const COST_TYPE_ACTUAL_WORK = 'actual_work' satisfies CostTypeEnum
export const COST_TYPE_DISTANCE = 'distance' satisfies CostTypeEnum
export const COST_TYPE_CALL_OUT_COSTS = 'call_out_costs' satisfies CostTypeEnum

export const INVOICE_LINE_TYPES = {
  used_materials: 'used-materials', work_hours: 'work', travel_hours: 'travel',
  extra_work: 'extra-work', actual_work: 'actual-work', distance: 'distance',
  call_out_costs: 'call-out-costs',
} as const satisfies Record<CostTypeEnum, Exclude<InvoiceLineType, 'manual'>>
