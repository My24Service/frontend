import type { CostTypeEnum, InvoiceLine, OrderCost, UsePriceEnum } from '@/api/types.gen'
import { enumOf } from '@/enums'
import { toDinero } from '@/services/money'

type Decimal = number | string | null | undefined
type Money = ReturnType<typeof toDinero>

export type CostType = CostTypeEnum
export type HoursCostType = Exclude<CostType, 'used_materials' | 'distance' | 'call_out_costs'>
export type InvoiceLineType = 'work' | 'travel' | 'extra-work' | 'actual-work'
  | 'used-materials' | 'distance' | 'call-out-costs' | 'manual'
export type InvoiceLineOption = 'user_totals' | 'total' | 'none'

export const USE_PRICE = enumOf<UsePriceEnum>()({
  SETTINGS: 'settings',
  CUSTOMER: 'customer',
  USER: 'user',
  PURCHASE: 'purchase',
  SELLING: 'selling',
  OTHER: 'other',
})

export const COST_TYPE = enumOf<CostTypeEnum>()({
  USED_MATERIALS: 'used_materials',
  WORK_HOURS: 'work_hours',
  TRAVEL_HOURS: 'travel_hours',
  EXTRA_WORK: 'extra_work',
  ACTUAL_WORK: 'actual_work',
  DISTANCE: 'distance',
  CALL_OUT_COSTS: 'call_out_costs',
})

export const INVOICE_LINE_TYPE = enumOf<InvoiceLineType>()({
  WORK: 'work',
  TRAVEL: 'travel',
  EXTRA_WORK: 'extra-work',
  ACTUAL_WORK: 'actual-work',
  USED_MATERIALS: 'used-materials',
  DISTANCE: 'distance',
  CALL_OUT_COSTS: 'call-out-costs',
  MANUAL: 'manual',
})

export const INVOICE_LINE_OPTION = enumOf<InvoiceLineOption>()({
  USER_TOTALS: 'user_totals',
  TOTAL: 'total',
  NONE: 'none',
})

export type CostAmount =
  | { cost_type: 'used_materials'; amount_decimal: number | string }
  | { cost_type: HoursCostType; amount_duration_secs?: number | null; amount_duration_read: string }
  | { cost_type: 'distance' | 'call_out_costs'; amount_int: number }

export interface PriceInput {
  price: Decimal
  price_currency: string
  vat_type: number | string
}

export interface InvoiceTotals extends Required<Pick<InvoiceLine, 'total' | 'total_currency' | 'vat' | 'vat_currency'>> {
  total_dinero: Money
  vat_dinero: Money
}

export interface CalculatedPrices extends InvoiceTotals, Required<Pick<InvoiceLine, 'price' | 'price_currency'>> {
  price_dinero: Money
}

// Editor state, not a request body: amount may be numeric and lines retain display metadata.
export interface InvoiceLineDraft extends CalculatedPrices {
  type: InvoiceLineType
  description: string
  amount: number | string
  price_text: string
}

function unreachable(value: never): never {
  throw new Error('Unknown invoice calculation option: ' + String(value))
}

function totalsFields(total: Money, vat: Money): InvoiceTotals {
  return {
    total: total.toFormat('0.00'),
    total_currency: total.getCurrency(),
    total_dinero: total,
    vat: vat.toFormat('0.00'),
    vat_currency: vat.getCurrency(),
    vat_dinero: vat,
  }
}

function priceFields(price: Money, total: Money, vat: Money): CalculatedPrices {
  return {
    price: price.toFormat('0.00'),
    price_currency: price.getCurrency(),
    price_dinero: price,
    ...totalsFields(total, vat),
  }
}

function vatFor(total: Money, vatType: PriceInput['vat_type']): Money {
  // The editor's models truncate fractional VAT percentages before calculating.
  return total.multiply(parseInt(String(vatType), 10) / 100)
}

export function calculateCost(cost: CostAmount & PriceInput): CalculatedPrices {
  const price = toDinero(cost.price, cost.price_currency)
  let total: Money
  switch (cost.cost_type) {
    case 'used_materials':
      total = price.multiply(Number(cost.amount_decimal))
      break
    case 'work_hours':
    case 'travel_hours':
    case 'extra_work':
    case 'actual_work':
      // Keep the two Dinero operations: changing their order changes rounding.
      total = price.multiply(cost.amount_duration_secs || 0).divide(3600)
      break
    case 'distance':
    case 'call_out_costs':
      total = price.multiply(cost.amount_int)
      break
    default:
      return unreachable(cost)
  }
  return priceFields(price, total, vatFor(total, cost.vat_type))
}

export function calculateInvoiceLine(line: PriceInput & { amount: number | string }): CalculatedPrices {
  const price = toDinero(line.price, line.price_currency)
  const amount = typeof line.amount === 'string' ? line.amount.replace(',', '.') : line.amount
  const total = price.multiply(Number(amount))
  return priceFields(price, total, vatFor(total, line.vat_type))
}

export function hydrateInvoicePrices(record: Pick<OrderCost,
  'price' | 'price_currency' | 'total' | 'total_currency' | 'vat' | 'vat_currency'
> & { default_currency?: string }): CalculatedPrices {
  return priceFields(
    toDinero(record.price, record.default_currency || record.price_currency),
    toDinero(record.total, record.default_currency || record.total_currency),
    toDinero(record.vat, record.default_currency || record.vat_currency),
  )
}

export function sumInvoiceTotals(items: readonly InvoiceTotals[]): InvoiceTotals {
  // Empty legacy cost/line collections use EUR, even for a non-EUR tenant.
  const total = items.reduce((sum, item) => sum.add(item.total_dinero),
    toDinero(0, items[0]?.total_currency ?? 'EUR'))
  const vat = items.reduce((sum, item) => sum.add(item.vat_dinero),
    toDinero(0, items[0]?.vat_currency ?? 'EUR'))
  return totalsFields(total, vat)
}

export function costAmount(cost: CostAmount): number | string {
  switch (cost.cost_type) {
    case 'used_materials': return cost.amount_decimal
    case 'work_hours':
    case 'travel_hours':
    case 'extra_work':
    case 'actual_work': return cost.amount_duration_read
    case 'distance':
    case 'call_out_costs': return cost.amount_int
    default: return unreachable(cost)
  }
}

export function invoiceLineType(costType: CostType): Exclude<InvoiceLineType, 'manual'> {
  switch (costType) {
    case 'used_materials': return INVOICE_LINE_TYPE.USED_MATERIALS
    case 'work_hours': return INVOICE_LINE_TYPE.WORK
    case 'travel_hours': return INVOICE_LINE_TYPE.TRAVEL
    case 'extra_work': return INVOICE_LINE_TYPE.EXTRA_WORK
    case 'actual_work': return INVOICE_LINE_TYPE.ACTUAL_WORK
    case 'distance': return INVOICE_LINE_TYPE.DISTANCE
    case 'call_out_costs': return INVOICE_LINE_TYPE.CALL_OUT_COSTS
    default: return unreachable(costType)
  }
}

export function costToInvoiceLine(cost: CostAmount & CalculatedPrices, description: string): InvoiceLineDraft {
  // Copy the stored totals, not amount * price: durations are display strings.
  return {
    ...priceFields(cost.price_dinero, cost.total_dinero, cost.vat_dinero),
    type: invoiceLineType(cost.cost_type),
    description,
    amount: costAmount(cost),
    price_text: cost.price_dinero.toFormat('$0.00'),
  }
}

export function createInvoiceLines<T extends CostAmount & CalculatedPrices>(
  costs: readonly T[],
  option: InvoiceLineOption,
  descriptions: { item: (cost: T) => string; total: string },
  summary: { type: Exclude<InvoiceLineType, 'manual'>; amount: number | string },
): InvoiceLineDraft[] {
  switch (option) {
    case INVOICE_LINE_OPTION.USER_TOTALS: return costs.map(cost => costToInvoiceLine(cost, descriptions.item(cost)))
    case INVOICE_LINE_OPTION.TOTAL: {
      const totals = sumInvoiceTotals(costs)
      return [{
        ...priceFields(toDinero(0, 'EUR'), totals.total_dinero, totals.vat_dinero),
        ...summary,
        description: descriptions.total,
        price_text: '*',
      }]
    }
    case INVOICE_LINE_OPTION.NONE: return []
    default: return unreachable(option)
  }
}

export function normalizeCostDuration(value: string): {
  amount_duration_read: string; amount_duration: string; amount_duration_secs: number
} {
  // The hours editor accepts hours alone and ignores any seconds component.
  const parts = value.split(':', 2)
  const hours = parseInt(parts[0], 10)
  const minutes = parts.length === 1 ? 0 : parseInt(parts[1], 10)
  const display = hours + ':' + (minutes < 10 ? '0' : '') + minutes
  return {
    amount_duration_read: display,
    amount_duration: display + ':00',
    amount_duration_secs: hours * 3600 + minutes * 60,
  }
}

export function materialSellingPrice(purchasePrice: Decimal, currency: string, marginPercent: number | string): Money {
  // MaterialModel.recalcSelling uses a markup, not a gross-margin division.
  return toDinero(purchasePrice, currency).multiply(1 + Number(marginPercent) / 100)
}

export function materialPrice(
  option: Extract<UsePriceEnum, 'purchase' | 'selling' | 'other'>,
  prices: { purchase: Decimal; selling: Decimal; other: Decimal; teamleader?: string | null },
): Decimal {
  if (prices.teamleader != null) return parseFloat(prices.teamleader)
  switch (option) {
    case 'purchase': return prices.purchase
    case 'selling': return prices.selling
    case 'other': return prices.other
    default: return unreachable(option)
  }
}

export function hourlyPrice(
  option: Exclude<UsePriceEnum, 'purchase' | 'selling'>,
  rates: {
    user?: { hourly_rate: Decimal } | null
    is_partner?: boolean
    settings: Decimal
    customer: Decimal
    other: Decimal
    teamleader?: { selling_price: string } | null
  },
): Decimal {
  if (rates.teamleader) return parseFloat(rates.teamleader.selling_price)
  // Missing non-partner engineers yield no price; calculateCost treats it as zero.
  if (!rates.user && !rates.is_partner) return undefined
  switch (option) {
    case 'user':
      if (!rates.user) throw new Error('Partner has no engineer rate')
      return rates.user.hourly_rate
    case 'settings': return rates.settings
    case 'customer': return rates.customer
    case 'other': return rates.other
    default: return unreachable(option)
  }
}

export function costRate(
  option: Extract<UsePriceEnum, 'settings' | 'customer' | 'other'>,
  rates: { settings: { price: Decimal; currency: string }; customer: { price: Decimal; currency: string }; other: { price: Decimal; currency: string } },
): { price: Decimal; currency: string } {
  // Distance and call-out costs use the selected rate's currency.
  switch (option) {
    case 'settings': return { ...rates.settings }
    case 'customer': return { ...rates.customer }
    case 'other': return { ...rates.other }
    default: return unreachable(option)
  }
}
