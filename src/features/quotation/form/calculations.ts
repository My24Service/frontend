import {
  calculateInvoiceLine,
  createInvoiceLines,
  invoiceLineType,
  sumInvoiceTotals,
  type CalculatedPrices,
  type CostAmount,
  type InvoiceLineOption,
  type InvoiceTotals,
  type PriceInput,
} from '@/features/costing'
import { formatMoneyPlain, toDinero, type Money } from '@/services/money'

/**
 * Quotation-line and chapter maths.
 *
 * A quotation line prices exactly like an invoice line - `total = price ×
 * amount`, `vat = total × truncated vat_type` - so the preview a panel shows
 * while editing is `calculateInvoiceLine` from the shared costing feature,
 * not a second implementation. What is quotation-only is the scope the sums
 * run over: a chapter sums its lines, a quotation sums its chapters.
 */

export type QuotationLinePrices = Pick<
  Api.QuotationQuotationLine.Record,
  'price' | 'price_currency' | 'total' | 'total_currency' | 'vat' | 'vat_currency'
>

/** The live preview of the line being edited, priced client-side like the legacy `calcTotal`. */
export function previewQuotationLine(line: { price: string | number | null | undefined; price_currency: string; vat_type: string | number; amount: string | number }) {
  return calculateInvoiceLine({ ...line, amount: line.amount })
}

/** Sum one chapter's stored lines into its total row. */
export function sumChapterTotals(lines: readonly InvoiceTotals[], currency: string): InvoiceTotals {
  return sumInvoiceTotals(lines, currency)
}

/** Hydrate a stored line's dineros for display, the way the legacy model built its `*_dinero` fields. */
export function hydrateQuotationLinePrices(record: QuotationLinePrices & { default_currency?: string }) {
  return {
    price_dinero: toDinero(record.price, record.default_currency || record.price_currency),
    total_dinero: toDinero(record.total, record.default_currency || record.total_currency),
    vat_dinero: toDinero(record.vat, record.default_currency || record.vat_currency),
  }
}

/** The amount fields of a quotation cost row, one of which counts by its type. */
export interface QuotationCostAmounts {
  cost_type: Api.CostTypeEnum
  amount_int?: number | string | null
  amount_decimal?: number | string | null
  amount_duration_secs?: number | null
}

/**
 * Price one quotation cost row client-side. The quotation cost endpoint does
 * not price its rows (unlike the order's), so the panel's own `total` and
 * `vat` are what is stored. As the legacy `CostModel.getTotal`: hours are
 * `price × seconds / 3600` (multiplied first, then divided, to keep the
 * precision), materials `price × amount_decimal`, distance and call-out costs
 * `price × amount_int`; VAT is the total times the truncated rate.
 */
export function priceQuotationCost(row: QuotationCostAmounts & PriceInput): CalculatedPrices {
  const price = toDinero(row.price, row.price_currency)
  const total = costTotal(price, row)
  const vat = total.multiply(parseInt(String(row.vat_type), 10) / 100)
  return {
    price: formatMoneyPlain(price), price_currency: price.getCurrency(), price_dinero: price,
    total: formatMoneyPlain(total), total_currency: total.getCurrency(), total_dinero: total,
    vat: formatMoneyPlain(vat), vat_currency: vat.getCurrency(), vat_dinero: vat,
  }
}

function costTotal(price: Money, row: QuotationCostAmounts): Money {
  switch (row.cost_type) {
    case 'used_materials': return price.multiply(Number(row.amount_decimal ?? 0))
    case 'work_hours':
    case 'travel_hours':
    case 'extra_work':
    case 'actual_work': return price.multiply(row.amount_duration_secs ?? 0).divide(3600)
    case 'distance':
    case 'call_out_costs': return price.multiply(Number(row.amount_int ?? 0))
    default: {
      const unknownType: never = row.cost_type
      throw new Error('Unknown cost type: ' + String(unknownType))
    }
  }
}

/**
 * A row the user has not filled in yet: a material row without a material,
 * an hours row without a duration, a distance or call-out row without an
 * amount. "Add" stays disabled while one exists.
 */
export function isEmptyQuotationCost(row: QuotationCostAmounts & { material?: number | null }): boolean {
  switch (row.cost_type) {
    case 'used_materials': return row.material == null
    case 'work_hours':
    case 'travel_hours':
    case 'extra_work':
    case 'actual_work': return !row.amount_duration_secs
    case 'distance':
    case 'call_out_costs': return !Number(row.amount_int ?? 0)
    default: {
      const unknownType: never = row.cost_type
      throw new Error('Unknown cost type: ' + String(unknownType))
    }
  }
}

/**
 * The panel's summed amount, which the total row shows and a "total"
 * quotation line takes as its amount: whole hours (rounded, as the legacy
 * panel reported them), the summed material quantity, or the summed
 * kilometres / call-outs.
 */
export function sumQuotationCostAmounts(rows: readonly QuotationCostAmounts[], costType: Api.CostTypeEnum): number {
  switch (costType) {
    case 'used_materials': return rows.reduce((sum, row) => sum + (Number(row.amount_decimal) || 0), 0)
    case 'work_hours':
    case 'travel_hours':
    case 'extra_work':
    case 'actual_work': return Math.round(rows.reduce((sum, row) => sum + (row.amount_duration_secs ?? 0), 0) / 3600)
    case 'distance':
    case 'call_out_costs': return rows.reduce((sum, row) => sum + (Number(row.amount_int) || 0), 0)
    default: {
      const unknownType: never = costType
      throw new Error('Unknown cost type: ' + String(unknownType))
    }
  }
}

/** Seconds in an `H:MM` or `HH:MM:SS` duration; the quotation hours editor types the first. */
export function durationSeconds(duration: string | null | undefined): number {
  if (!duration) return 0
  const [hours = '0', minutes = '0', seconds = '0'] = duration.split(':')
  const total = Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
  return Number.isFinite(total) ? total : 0
}

/**
 * A quotation line in the making: what the line panel holds before the chapter
 * is saved. `cost_type` is the cost type the line was made from (`work_hours`,
 * `used_materials`, ...) or `manual`; that is what the stored lines carry and
 * what "this chapter already has lines of that type" compares.
 */
export interface QuotationLineDraft extends CalculatedPrices {
  cost_type: Api.CostTypeEnum | 'manual'
  info: string
  extra_description: string
  amount: string
  vat_type: string | number
  material?: number | null
  material_name?: string | null
}

type LineCost = CostAmount & CalculatedPrices & { vat_type: string | number; material?: number | null; material_name?: string | null }

/**
 * Turn a panel's costs into quotation lines, as the legacy
 * `createQuotationLines`: one line per cost ("items"), or one line carrying
 * the summed total at a price of zero ("total"). The pricing and the summing
 * are the shared `createInvoiceLines`; a quotation line additionally keeps the
 * VAT rate (rounded, as the legacy lines stored it) and the material.
 */
export function createQuotationLines<T extends LineCost>(
  costs: readonly T[],
  option: InvoiceLineOption,
  describe: { costType: Api.CostTypeEnum; item: (cost: T) => string; total: string; amount: number | string; currency: string },
): QuotationLineDraft[] {
  const drafts = createInvoiceLines(costs, option, { item: describe.item, total: describe.total },
    { type: invoiceLineType(describe.costType), amount: describe.amount }, describe.currency)
  return drafts.map(({ type: _type, description, price_text: _priceText, amount, ...prices }, index) => {
    const cost = option === 'total' ? costs[0] : costs[index]
    return {
      ...prices,
      cost_type: describe.costType,
      info: description,
      extra_description: '',
      amount: String(amount),
      vat_type: Math.round(Number(cost?.vat_type ?? 0)),
      material: option === 'total' ? null : cost?.material ?? null,
      material_name: option === 'total' ? null : cost?.material_name ?? null,
    }
  })
}
