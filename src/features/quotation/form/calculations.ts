import {
  calculateInvoiceLine,
  sumInvoiceTotals,
  type InvoiceTotals,
} from '@/features/costing'
import { toDinero } from '@/services/money'

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
