import { describe, expect, test } from 'vitest'

import { toDinero } from '@/utils'
import priceMixin from '@/mixins/price'

describe('toDinero', () => {
  test.each(['EUR', 'USD', 'GBP'])('converts a decimal amount for %s', (currency) => {
    const amount = toDinero(12.34, currency)
    expect(amount.getAmount()).toBe(1234)
    expect(amount.getCurrency()).toBe(currency)
  })

  test('treats a falsy amount as zero', () => {
    expect(toDinero(0, 'EUR').getAmount()).toBe(0)
    expect(toDinero(null, 'EUR').getAmount()).toBe(0)
    expect(toDinero(undefined, 'EUR').getAmount()).toBe(0)
  })

  test('accepts a decimal string', () => {
    expect(toDinero('12.34', 'EUR').getAmount()).toBe(1234)
  })

  test('rounds to whole cents', () => {
    expect(toDinero(12.345, 'EUR').getAmount()).toBe(1235)
    expect(toDinero(12.344, 'EUR').getAmount()).toBe(1234)
  })

  test('avoids the float representation error on x.07 amounts', () => {
    // 8.07 * 100 is 806.9999... in IEEE754; the toFixed(0) guards against it.
    expect(toDinero(8.07, 'EUR').getAmount()).toBe(807)
    expect(toDinero(1.1, 'EUR').getAmount()).toBe(110)
  })

  test('handles negative amounts', () => {
    expect(toDinero(-5.5, 'EUR').getAmount()).toBe(-550)
  })

  test('throws on an unsupported currency', () => {
    expect(() => toDinero(1, 'JPY')).toThrow(/JPY not supported/)
    expect(() => toDinero(1, undefined)).toThrow(/not supported/)
  })

  test('throws on a non-numeric amount', () => {
    expect(() => toDinero('not a number', 'EUR')).toThrow(/invalid input for amount/)
  })
})

describe('priceMixin', () => {
  // The mixin is mixed onto model prototypes with Object.assign, so any object
  // carrying a `priceFields` list can exercise it.
  function modelWith(fields, data) {
    const model = Object.assign(Object.create(priceMixin), { priceFields: fields })
    return { model, data }
  }

  test('setPriceField populates the value, dinero and currency fields', () => {
    const { model } = modelWith(['price'])
    model.setPriceField('price', toDinero(12.5, 'EUR'))

    expect(model.price).toBe('12.50')
    expect(model.price_currency).toBe('EUR')
    expect(model.price_dinero.getAmount()).toBe(1250)
  })

  test('setPriceField formats to two decimals', () => {
    const { model } = modelWith(['price'])
    model.setPriceField('price', toDinero(5, 'EUR'))

    expect(model.price).toBe('5.00')
  })

  test('setPriceFields uses the per-field currency', () => {
    const { model, data } = modelWith(['price'], { price: 10, price_currency: 'GBP' })
    model.setPriceFields(data)

    expect(model.price).toBe('10.00')
    expect(model.price_currency).toBe('GBP')
  })

  test('default_currency takes precedence over the per-field currency', () => {
    const { model, data } = modelWith(['price'], {
      price: 10,
      price_currency: 'GBP',
      default_currency: 'USD',
    })
    model.setPriceFields(data)

    expect(model.price_currency).toBe('USD')
  })

  test('handles several price fields at once', () => {
    const { model, data } = modelWith(['price', 'vat'], {
      price: 100,
      vat: 21,
      default_currency: 'EUR',
    })
    model.setPriceFields(data)

    expect(model.price).toBe('100.00')
    expect(model.vat).toBe('21.00')
  })

  test('skips a field with no value', () => {
    const { model, data } = modelWith(['price'], { price: null, default_currency: 'EUR' })
    model.setPriceFields(data)

    expect(model.price).toBeUndefined()
    expect(model.price_dinero).toBeUndefined()
  })

  test('skips a field with no currency', () => {
    const { model, data } = modelWith(['price'], { price: 10 })
    model.setPriceFields(data)

    expect(model.price).toBeUndefined()
  })

  test('a zero price is skipped, because 0 is falsy', () => {
    // KNOWN QUIRK, pinned deliberately: setPriceFields guards with `if (obj[field])`,
    // so a genuine 0 amount is treated the same as a missing one and never
    // becomes a dinero. Change this expectation if that guard is tightened.
    const { model, data } = modelWith(['price'], { price: 0, default_currency: 'EUR' })
    model.setPriceFields(data)

    expect(model.price).toBeUndefined()
  })
})
