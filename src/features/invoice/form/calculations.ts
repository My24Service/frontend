import type { CostTypeEnum, InvoiceLine, OrderCost } from '@/api/types.gen'
import { enumOf } from '@/enums'
import { toDinero } from '@/services/money'

type Decimal = number | string | null | undefined
type Money = ReturnType<typeof toDinero>

export type CostType = CostTypeEnum
export type HoursCostType = Exclude<CostType, 'used_materials' | 'distance' | 'call_out_costs'>
export type InvoiceLineType = 'work' | 'travel' | 'extra-work' | 'actual-work'
  | 'used-materials' | 'distance' | 'call-out-costs' | 'manual'
export type InvoiceLineOption = 'user_totals' | 'total' | 'none'

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

export function calculateInvoiceLine(line: PriceInput & { amount: number | string }): CalculatedPrices {
  const price = toDinero(line.price, line.price_currency)
  const amount = typeof line.amount === 'string' ? line.amount.replace(',', '.') : line.amount
  const total = price.multiply(Number(amount))
  return priceFields(price, total, vatFor(total, line.vat_type))
}

export function hydrateInvoicePrices(record: Pick<OrderCost | InvoiceLine,
  'price' | 'price_currency' | 'total' | 'total_currency' | 'vat' | 'vat_currency'
> & { default_currency?: string }): CalculatedPrices {
  return priceFields(
    toDinero(record.price, record.default_currency || record.price_currency),
    toDinero(record.total, record.default_currency || record.total_currency),
    toDinero(record.vat, record.default_currency || record.vat_currency),
  )
}

/**
 * The sum of stored row totals. Rows always carry their currency, so the
 * only case that needs one passed in is the empty collection; callers pass
 * the tenant default they got from the server, never a hardcoded guess.
 */
export function sumInvoiceTotals(items: readonly InvoiceTotals[], currency: string): InvoiceTotals {
  const total = items.reduce((sum, item) => sum.add(item.total_dinero),
    toDinero(0, items[0]?.total_currency ?? currency))
  const vat = items.reduce((sum, item) => sum.add(item.vat_dinero),
    toDinero(0, items[0]?.vat_currency ?? currency))
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
  currency: string,
): InvoiceLineDraft[] {
  switch (option) {
    case INVOICE_LINE_OPTION.USER_TOTALS: return costs.map(cost => costToInvoiceLine(cost, descriptions.item(cost)))
    case INVOICE_LINE_OPTION.TOTAL: {
      const totals = sumInvoiceTotals(costs, currency)
      return [{
        ...priceFields(toDinero(0, totals.total_dinero.getCurrency()), totals.total_dinero, totals.vat_dinero),
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
