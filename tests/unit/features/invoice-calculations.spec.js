import { describe, expect, it } from 'vitest'
import {
  calculateCost, calculateInvoiceLine, costAmount, costRate, costToInvoiceLine,
  createInvoiceLines, hourlyPrice, hydrateInvoicePrices, invoiceLineType,
  materialPrice, materialSellingPrice, normalizeCostDuration, sumInvoiceTotals,
} from '@/features/invoice/form/calculations'

const price = { price: '12.50', price_currency: 'EUR', vat_type: '21.00' }
const hoursTypes = ['work_hours', 'travel_hours', 'extra_work', 'actual_work']
function cost(input) {
  const value = { ...price, ...input }
  return { ...value, ...calculateCost(value) }
}

describe('invoice cost calculations', () => {
  it('calculates fractional materials and leaves inputs untouched', () => {
    const input = Object.freeze({ ...price, cost_type: 'used_materials', amount_decimal: '2.5' })
    const result = calculateCost(input)
    expect(result).toMatchObject({ price: '12.50', total: '31.25', vat: '6.56', total_currency: 'EUR', vat_currency: 'EUR' })
    expect(result.total_dinero.getAmount()).toBe(3125)
    expect(input).not.toHaveProperty('total')
  })

  it.each(hoursTypes)('uses seconds for %s rather than the display duration', cost_type => {
    const result = cost({ cost_type, amount_duration_secs: 5400, amount_duration_read: '99:00' })
    expect(result).toMatchObject({ total: '18.75', vat: '3.94' })
    expect(costAmount(result)).toBe('99:00')
  })

  it.each([null, undefined, 0])('uses zero for missing duration %s', amount_duration_secs => {
    expect(cost({ cost_type: 'work_hours', amount_duration_secs, amount_duration_read: '0:00' }).total).toBe('0.00')
  })

  it.each(['distance', 'call_out_costs'])('uses integer quantity for %s', cost_type => {
    const result = cost({ cost_type, amount_int: 3 })
    expect(result).toMatchObject({ total: '37.50', vat: '7.88' })
    expect(costAmount(result)).toBe(3)
  })

  it('retains Dinero half-even rounding and integer VAT parsing', () => {
    expect(cost({ cost_type: 'used_materials', amount_decimal: 1.5, price: '0.03' }).total).toBe('0.04')
    expect(cost({ cost_type: 'work_hours', amount_duration_secs: 1800, amount_duration_read: '0:30', price: '0.01' }).total).toBe('0.00')
    expect(cost({ cost_type: 'distance', amount_int: 1, price: '100', vat_type: '9.75' }).vat).toBe('9.00')
  })

  it.each([undefined, null, '', 0])('treats absent price %s as zero', inputPrice => {
    expect(cost({ cost_type: 'distance', amount_int: 5, price: inputPrice }).total).toBe('0.00')
  })

  it('keeps credits and Dinero signed-zero VAT formatting', () => {
    expect(cost({ cost_type: 'used_materials', amount_decimal: -2, vat_type: '0' })).toMatchObject({ total: '-25.00', vat: '-0.00' })
  })

  it.each(['EUR', 'USD', 'GBP'])('uses supported currency %s throughout', price_currency => {
    const result = cost({ cost_type: 'distance', amount_int: 1, price_currency })
    expect([result.price_currency, result.total_currency, result.vat_currency]).toEqual([price_currency, price_currency, price_currency])
  })

  it('rejects unsupported currencies and unrecognized cost types', () => {
    expect(() => cost({ cost_type: 'distance', amount_int: 1, price_currency: 'JPY' })).toThrow()
    expect(() => cost({ cost_type: 'unknown' })).toThrow('Unknown invoice calculation option')
  })
})

describe('invoice lines and totals', () => {
  it('normalizes manual decimal commas without mutating the line', () => {
    const input = Object.freeze({ ...price, amount: '1,5' })
    expect(calculateInvoiceLine(input)).toMatchObject({ total: '18.75', vat: '3.94' })
    expect(input.amount).toBe('1,5')
  })

  it('hydrates stored prices without recalculating their independent totals', () => {
    const record = Object.freeze({ price: '10', price_currency: 'USD', total: '99', total_currency: 'GBP', vat: '4', vat_currency: 'EUR' })
    expect(hydrateInvoicePrices(record)).toMatchObject({ price: '10.00', total: '99.00', vat: '4.00', price_currency: 'USD', total_currency: 'GBP', vat_currency: 'EUR' })
    expect(hydrateInvoicePrices({ ...record, default_currency: 'GBP' })).toMatchObject({ price_currency: 'GBP', total_currency: 'GBP', vat_currency: 'GBP' })
  })

  it('sums already-rounded item VAT rather than recalculating VAT on the sum', () => {
    const item = cost({ cost_type: 'distance', amount_int: 1, price: '0.03', vat_type: 21 })
    expect(sumInvoiceTotals([item, item])).toMatchObject({ total: '0.06', vat: '0.02' })
  })

  it('uses EUR for empty collections and rejects mixed currencies', () => {
    expect(sumInvoiceTotals([])).toMatchObject({ total: '0.00', vat: '0.00', total_currency: 'EUR', vat_currency: 'EUR' })
    const euro = cost({ cost_type: 'distance', amount_int: 1 })
    const dollar = cost({ cost_type: 'distance', amount_int: 1, price_currency: 'USD' })
    expect(() => sumInvoiceTotals([euro, dollar])).toThrow()
  })

  it.each([
    ['used_materials', 'used-materials', { amount_decimal: '2.5' }, '2.5'],
    ['work_hours', 'work', { amount_duration_read: '1:30', amount_duration_secs: 5400 }, '1:30'],
    ['travel_hours', 'travel', { amount_duration_read: '1:30', amount_duration_secs: 5400 }, '1:30'],
    ['extra_work', 'extra-work', { amount_duration_read: '1:30', amount_duration_secs: 5400 }, '1:30'],
    ['actual_work', 'actual-work', { amount_duration_read: '1:30', amount_duration_secs: 5400 }, '1:30'],
    ['distance', 'distance', { amount_int: 2 }, 2],
    ['call_out_costs', 'call-out-costs', { amount_int: 2 }, 2],
  ])('converts %s to %s with the current amount', (cost_type, type, amountFields, amount) => {
    const input = cost({ cost_type, ...amountFields })
    const line = costToInvoiceLine(Object.freeze(input), 'Description')
    expect(invoiceLineType(cost_type)).toBe(type)
    expect(line).toMatchObject({ type, amount, description: 'Description', total: input.total, vat: input.vat })
    expect(line.price_text).toBe(input.price_dinero.toFormat('$0.00'))
    expect(line).not.toHaveProperty('vat_type')
    expect(line).not.toHaveProperty('cost_type')
  })

  it('preserves stored totals during cost conversion even after amount changes', () => {
    const input = cost({ cost_type: 'distance', amount_int: 1 })
    expect(costToInvoiceLine({ ...input, amount_int: 8 }, 'Stored')).toMatchObject({ amount: 8, total: '12.50' })
  })

  it('creates item lines, total-only lines with a star price, or no lines', () => {
    const costs = Object.freeze([
      cost({ cost_type: 'distance', amount_int: 2, price_currency: 'GBP', vat_type: 21 }),
      cost({ cost_type: 'distance', amount_int: 3, price_currency: 'GBP', vat_type: 9 }),
    ])
    const descriptions = { item: item => 'Distance ' + item.amount_int, total: 'Distance' }
    const summary = { type: 'distance', amount: 5 }
    expect(createInvoiceLines(costs, 'user_totals', descriptions, summary).map(line => line.description)).toEqual(['Distance 2', 'Distance 3'])
    expect(createInvoiceLines(costs, 'total', descriptions, summary)).toMatchObject([{
      type: 'distance', amount: 5, description: 'Distance', price: '0.00', price_currency: 'EUR',
      price_text: '*', total: '62.50', total_currency: 'GBP', vat: '8.63', vat_currency: 'GBP',
    }])
    expect(createInvoiceLines(costs, 'none', descriptions, summary)).toEqual([])
    expect(() => createInvoiceLines(costs, 'unknown', descriptions, summary)).toThrow()
  })
})

describe('editor duration and rate selection', () => {
  it.each([
    ['2', '2:00', 7200], ['01:5', '1:05', 3900], ['1:30:59', '1:30', 5400], ['0:00', '0:00', 0],
  ])('normalizes duration %s', (input, display, seconds) => {
    expect(normalizeCostDuration(input)).toEqual({ amount_duration_read: display, amount_duration: display + ':00', amount_duration_secs: seconds })
  })

  it('calculates material markup with Dinero rounding, not gross margin', () => {
    expect(materialSellingPrice('80.00', 'GBP', '25').toFormat('0.00')).toBe('100.00')
    expect(materialSellingPrice('0.03', 'EUR', 50).getAmount()).toBe(4)
    expect(materialSellingPrice('10', 'USD', -10).toFormat('0.00')).toBe('9.00')
  })

  it.each(['purchase', 'selling', 'other'])('selects material %s price, overridden by Teamleader', option => {
    const prices = { purchase: '2', selling: '4', other: '3' }
    expect(materialPrice(option, prices)).toBe(prices[option])
    expect(materialPrice(option, { ...prices, teamleader: '0.00' })).toBe(0)
    expect(materialPrice(option, { ...prices, teamleader: '7.25' })).toBe(7.25)
  })

  it.each(['settings', 'customer', 'other'])('keeps the %s currency for distance and call-out rates', option => {
    const rates = Object.freeze({ settings: { price: '2', currency: 'EUR' }, customer: { price: '3', currency: 'GBP' }, other: { price: '4', currency: 'USD' } })
    expect(costRate(option, rates)).toEqual(rates[option])
    expect(costRate(option, rates)).not.toBe(rates[option])
  })

  it('selects all engineer rates with partner and missing-engineer parity', () => {
    const rates = { settings: '40', customer: '50', other: '60', user: { hourly_rate: '70' } }
    for (const option of ['settings', 'customer', 'other']) {
      expect(hourlyPrice(option, rates)).toBe(rates[option])
      expect(hourlyPrice(option, { ...rates, user: null, is_partner: true })).toBe(rates[option])
      expect(hourlyPrice(option, { ...rates, user: null })).toBeUndefined()
    }
    expect(hourlyPrice('user', rates)).toBe('70')
    expect(() => hourlyPrice('user', { ...rates, user: null, is_partner: true })).toThrow()
    expect(hourlyPrice('user', { ...rates, user: null, teamleader: { selling_price: '0.00' } })).toBe(0)
  })
})
