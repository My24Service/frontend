import { describe, expect, it } from 'vitest'
import {
  calculateInvoiceLine, costAmount, costToInvoiceLine,
  createInvoiceLines, hydrateInvoicePrices, invoiceLineType,
  normalizeCostDuration, sumInvoiceTotals,
} from '@/features/invoice/form/calculations'

const price = { price: '12.50', price_currency: 'EUR', vat_type: '21.00' }

/**
 * A cost row as the server priced it: the totals are stored data the client
 * passes through, never computes. The server-side rules live in my24service's
 * test_api_cost_pricing.py; the numbers below are that suite's answers,
 * repeated here as response fixtures.
 */
function stored(input) {
  const record = {
    ...price, total: '0.00', total_currency: 'EUR', vat: '0.00', vat_currency: 'EUR',
    ...input,
  }
  return { ...record, ...hydrateInvoicePrices(record) }
}
const hoursTypes = ['work_hours', 'travel_hours', 'extra_work', 'actual_work']

describe('stored cost rows pass through server totals', () => {
  it('carries fractional material totals without recalculating them', () => {
    const input = Object.freeze({ ...price, cost_type: 'used_materials', amount_decimal: '2.5', total: '31.25', vat: '6.56' })
    const result = stored(input)
    expect(result).toMatchObject({ price: '12.50', total: '31.25', vat: '6.56', total_currency: 'EUR', vat_currency: 'EUR' })
    expect(result.total_dinero.getAmount()).toBe(3125)
    expect(costAmount({ cost_type: 'used_materials', amount_decimal: '2.5' })).toBe('2.5')
    expect(input).not.toHaveProperty('total_dinero')
  })

  it.each(hoursTypes)('carries %s totals keyed off seconds, not the display duration', cost_type => {
    const result = stored({ cost_type, amount_duration_secs: 5400, amount_duration_read: '99:00', total: '18.75', vat: '3.94' })
    expect(result).toMatchObject({ total: '18.75', vat: '3.94' })
    expect(costAmount(result)).toBe('99:00')
  })

  it.each(['distance', 'call_out_costs'])('carries %s totals for the integer quantity', cost_type => {
    const result = stored({ cost_type, amount_int: 3, total: '37.50', vat: '7.88' })
    expect(result).toMatchObject({ total: '37.50', vat: '7.88' })
    expect(costAmount(result)).toBe(3)
  })

  it('rejects unrecognized cost types when mapping amounts and line types', () => {
    expect(() => costAmount({ cost_type: 'unknown' })).toThrow('Unknown invoice calculation option')
    expect(() => invoiceLineType('unknown')).toThrow('Unknown invoice calculation option')
  })
})

describe('invoice lines and totals', () => {
  it('previews a manual line from amount and price before it is saved', () => {
    const input = Object.freeze({ ...price, amount: '1,5' })
    expect(calculateInvoiceLine(input)).toMatchObject({ total: '18.75', vat: '3.94' })
    expect(input.amount).toBe('1,5')
  })

  it('hydrates stored prices without recalculating their independent totals', () => {
    const record = Object.freeze({ price: '10', price_currency: 'USD', total: '99', total_currency: 'GBP', vat: '4', vat_currency: 'EUR' })
    expect(hydrateInvoicePrices(record)).toMatchObject({ price: '10.00', total: '99.00', vat: '4.00', price_currency: 'USD', total_currency: 'GBP', vat_currency: 'EUR' })
    expect(hydrateInvoicePrices({ ...record, default_currency: 'GBP' })).toMatchObject({ price_currency: 'GBP', total_currency: 'GBP', vat_currency: 'GBP' })
  })

  it('sums stored item totals and VAT rather than repricing the sum', () => {
    const item = stored({ cost_type: 'distance', amount_int: 1, price: '0.03', vat_type: 21, total: '0.03', vat: '0.01' })
    expect(sumInvoiceTotals([item, item], 'EUR')).toMatchObject({ total: '0.06', vat: '0.02' })
  })

  it('sums an empty collection in the passed currency instead of guessing one', () => {
    expect(sumInvoiceTotals([], 'USD')).toMatchObject({ total: '0.00', vat: '0.00', total_currency: 'USD', vat_currency: 'USD' })
  })

  it('rejects mixed currencies', () => {
    const euro = stored({ cost_type: 'distance', amount_int: 1, total: '12.50', vat: '2.63' })
    const dollar = stored({ cost_type: 'distance', amount_int: 1, price_currency: 'USD', total_currency: 'USD', vat_currency: 'USD', total: '12.50', vat: '2.63' })
    expect(() => sumInvoiceTotals([euro, dollar], 'EUR')).toThrow()
  })

  it.each([
    ['used_materials', 'used-materials', { amount_decimal: '2.5' }, '2.5', '31.25', '6.56'],
    ['work_hours', 'work', { amount_duration_read: '1:30', amount_duration_secs: 5400 }, '1:30', '18.75', '3.94'],
    ['travel_hours', 'travel', { amount_duration_read: '1:30', amount_duration_secs: 5400 }, '1:30', '18.75', '3.94'],
    ['extra_work', 'extra-work', { amount_duration_read: '1:30', amount_duration_secs: 5400 }, '1:30', '18.75', '3.94'],
    ['actual_work', 'actual-work', { amount_duration_read: '1:30', amount_duration_secs: 5400 }, '1:30', '18.75', '3.94'],
    ['distance', 'distance', { amount_int: 2 }, 2, '25.00', '5.25'],
    ['call_out_costs', 'call-out-costs', { amount_int: 2 }, 2, '25.00', '5.25'],
  ])('converts %s to %s with the current amount', (cost_type, type, amountFields, amount, total, vat) => {
    const input = stored({ cost_type, ...amountFields, total, vat })
    const line = costToInvoiceLine(Object.freeze(input), 'Description')
    expect(invoiceLineType(cost_type)).toBe(type)
    expect(line).toMatchObject({ type, amount, description: 'Description', total: input.total, vat: input.vat })
    expect(line.price_text).toBe(input.price_dinero.toFormat('$0.00'))
    expect(line).not.toHaveProperty('vat_type')
    expect(line).not.toHaveProperty('cost_type')
  })

  it('preserves stored totals during cost conversion even after amount changes', () => {
    const input = stored({ cost_type: 'distance', amount_int: 1, total: '12.50', vat: '2.63' })
    expect(costToInvoiceLine({ ...input, amount_int: 8 }, 'Stored')).toMatchObject({ amount: 8, total: '12.50' })
  })

  it('creates item lines, total-only lines with a star price, or no lines', () => {
    const costs = Object.freeze([
      stored({ cost_type: 'distance', amount_int: 2, price_currency: 'GBP', total_currency: 'GBP', vat_currency: 'GBP', vat_type: 21, total: '25.00', vat: '5.25' }),
      stored({ cost_type: 'distance', amount_int: 3, price_currency: 'GBP', total_currency: 'GBP', vat_currency: 'GBP', vat_type: 9, total: '37.50', vat: '3.38' }),
    ])
    const descriptions = { item: item => 'Distance ' + item.amount_int, total: 'Distance' }
    const summary = { type: 'distance', amount: 5 }
    expect(createInvoiceLines(costs, 'user_totals', descriptions, summary, 'GBP').map(line => line.description)).toEqual(['Distance 2', 'Distance 3'])
    expect(createInvoiceLines(costs, 'total', descriptions, summary, 'GBP')).toMatchObject([{
      type: 'distance', amount: 5, description: 'Distance', price: '0.00', price_currency: 'GBP',
      price_text: '*', total: '62.50', total_currency: 'GBP', vat: '8.63', vat_currency: 'GBP',
    }])
    expect(createInvoiceLines(costs, 'none', descriptions, summary, 'GBP')).toEqual([])
    expect(() => createInvoiceLines(costs, 'unknown', descriptions, summary, 'GBP')).toThrow()
  })
})

describe('editor duration', () => {
  it.each([
    ['2', '2:00', 7200], ['01:5', '1:05', 3900], ['1:30:59', '1:30', 5400], ['0:00', '0:00', 0],
  ])('normalizes duration %s', (input, display, seconds) => {
    expect(normalizeCostDuration(input)).toEqual({ amount_duration_read: display, amount_duration: display + ':00', amount_duration_secs: seconds })
  })
})
