import { describe, expect, it } from 'vitest'
import {
  durationSeconds,
  hydrateQuotationLinePrices,
  isEmptyQuotationCost,
  previewQuotationLine,
  priceQuotationCost,
  sumChapterTotals,
  sumQuotationCostAmounts,
} from '@/features/quotation/form/calculations'

const priced = (row) => {
  const result = priceQuotationCost({ price_currency: 'EUR', vat_type: '21', ...row })
  return { price: result.price, total: result.total, vat: result.vat, currency: result.total_currency }
}

/**
 * The quotation cost endpoint stores what the panel sends, so these numbers
 * are the client's own pricing. They were characterised against the legacy
 * `CostModel.updateTotals` before it was deleted: same inputs, same totals
 * (including dinero's half-even rounding, e.g. 18.50 × 21% = 3.88).
 */
describe('priceQuotationCost', () => {
  it.each([
    ['hours: price × seconds / 3600', { cost_type: 'work_hours', price: '50.00', amount_duration_secs: 5400 }, { total: '75.00', vat: '15.75' }],
    ['hours round per dinero step', { cost_type: 'travel_hours', price: '47.33', amount_duration_secs: 1234 }, { total: '16.22', vat: '3.41' }],
    ['hours without a duration cost nothing', { cost_type: 'extra_work', price: '50.00', amount_duration_secs: null }, { total: '0.00', vat: '0.00' }],
    ['materials: price × decimal amount', { cost_type: 'used_materials', price: '6.00', amount_decimal: '2.50' }, { total: '15.00', vat: '3.15' }],
    ['distance: price × km', { cost_type: 'distance', price: '0.50', amount_int: 37 }, { total: '18.50', vat: '3.88' }],
    ['call-out: price × count, a string amount too', { cost_type: 'call_out_costs', price: '25.00', amount_int: '2' }, { total: '50.00', vat: '10.50' }],
  ])('%s', (_name, row, expected) => {
    expect(priced(row)).toMatchObject({ ...expected, currency: 'EUR' })
  })
  it('truncates a fractional VAT rate, like the legacy model', () => {
    expect(priced({ cost_type: 'distance', price: '10.00', amount_int: 1, vat_type: '21.9' }).vat).toBe('2.10')
  })
  it('keeps the row currency', () => {
    expect(priced({ cost_type: 'distance', price: '1.00', amount_int: 3, price_currency: 'GBP' }).currency).toBe('GBP')
  })
  it('refuses an unknown cost type', () => {
    expect(() => priced({ cost_type: 'bogus', price: '1.00' })).toThrow('Unknown cost type: bogus')
  })
})

describe('isEmptyQuotationCost', () => {
  it.each([
    [{ cost_type: 'used_materials', material: null }, true],
    [{ cost_type: 'used_materials', material: 3 }, false],
    [{ cost_type: 'work_hours', amount_duration_secs: 0 }, true],
    [{ cost_type: 'actual_work', amount_duration_secs: 60 }, false],
    [{ cost_type: 'distance', amount_int: 0 }, true],
    [{ cost_type: 'call_out_costs', amount_int: '1' }, false],
  ])('%j → %s', (row, empty) => {
    expect(isEmptyQuotationCost(row)).toBe(empty)
  })
  it('refuses an unknown cost type', () => {
    expect(() => isEmptyQuotationCost({ cost_type: 'bogus' })).toThrow('Unknown cost type: bogus')
  })
})

describe('sumQuotationCostAmounts', () => {
  it('reports whole hours, rounded', () => {
    expect(sumQuotationCostAmounts([{ amount_duration_secs: 3600 }, { amount_duration_secs: 2700 }], 'work_hours')).toBe(2)
    expect(sumQuotationCostAmounts([{ amount_duration_secs: 1700 }], 'travel_hours')).toBe(0)
  })
  it('sums material quantities, blank as zero', () => {
    expect(sumQuotationCostAmounts([{ amount_decimal: '2.5' }, { amount_decimal: null }, { amount_decimal: '1' }], 'used_materials')).toBe(3.5)
  })
  it('sums kilometres and call-outs', () => {
    expect(sumQuotationCostAmounts([{ amount_int: 3 }, { amount_int: '4' }], 'distance')).toBe(7)
    expect(sumQuotationCostAmounts([], 'call_out_costs')).toBe(0)
  })
  it('refuses an unknown cost type', () => {
    expect(() => sumQuotationCostAmounts([], 'bogus')).toThrow('Unknown cost type: bogus')
  })
})

describe('durationSeconds', () => {
  it.each([
    ['1:30', 5400],
    ['02:00:00', 7200],
    ['0:05', 300],
    ['', 0],
    [null, 0],
    ['x:y', 0],
  ])('%j → %i', (value, seconds) => {
    expect(durationSeconds(value)).toBe(seconds)
  })
})

describe('quotation line maths', () => {
  it('previews a line as price × amount with truncated VAT', () => {
    const line = previewQuotationLine({ price: '12.50', price_currency: 'EUR', vat_type: '21.5', amount: '2,5' })
    expect(line).toMatchObject({ total: '31.25', vat: '6.56' })
  })
  it('sums a chapter in its currency, the tenant currency when empty', () => {
    const rows = [
      { total: '10.00', total_currency: 'EUR', vat: '2.10', vat_currency: 'EUR' },
      { total: '5.00', total_currency: 'EUR', vat: '1.05', vat_currency: 'EUR' },
    ].map((row) => ({ ...row, ...hydrateQuotationLinePrices({ ...row, price: '0.00', price_currency: 'EUR' }) }))
    expect(sumChapterTotals(rows, 'USD')).toMatchObject({ total: '15.00', vat: '3.15', total_currency: 'EUR' })
    expect(sumChapterTotals([], 'USD')).toMatchObject({ total: '0.00', total_currency: 'USD' })
  })
  it('hydrates a stored line, a default currency overriding the row', () => {
    const record = { price: '1.00', price_currency: 'EUR', total: '2.00', total_currency: 'EUR', vat: '0.42', vat_currency: 'EUR' }
    expect(hydrateQuotationLinePrices(record).total_dinero.getAmount()).toBe(200)
    expect(hydrateQuotationLinePrices({ ...record, default_currency: 'GBP' }).vat_dinero.getCurrency()).toBe('GBP')
  })
})
