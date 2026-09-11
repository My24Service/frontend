import { describe, expect, test } from 'vitest'

import { rowDinero, tryToDinero } from '@/features/shared/dinero-helpers'

// Regression tests for an edge-case crash this review fixed: the
// maintenance-contract list and view built money values with a throwing
// `toDinero` straight in the render path, so one unparseable backend value
// took the whole screen down. `tryToDinero` is the null-returning seam both
// screens now share; these tests pin its contract.

describe('tryToDinero', () => {
  test('parses a money string into cents', () => {
    expect(tryToDinero('12.50', 'EUR').getAmount()).toBe(1250)
  })

  test('absent values yield nothing instead of zero-money', () => {
    expect(tryToDinero(null, 'EUR')).toBeNull()
    expect(tryToDinero(undefined, 'EUR')).toBeNull()
    expect(tryToDinero('', 'EUR')).toBeNull()
  })

  test('garbage yields null instead of throwing mid-render', () => {
    expect(tryToDinero('not-money', 'EUR')).toBeNull()
    expect(tryToDinero('10.00', 'XXX')).toBeNull()
  })
})

describe('rowDinero', () => {
  test('a staged dinero wins over the tariff fields', () => {
    const staged = tryToDinero('4.00', 'EUR')
    expect(rowDinero({ tariff: '9.99', tariff_currency: 'USD', tariff_dinero: staged }, 'EUR')).toBe(staged)
  })

  test('falls back to the row currency, then the tenant default', () => {
    expect(rowDinero({ tariff: '4.00', tariff_currency: 'USD' }, 'EUR').getCurrency()).toBe('USD')
    expect(rowDinero({ tariff: '4.00' }, 'EUR').toFormat('$0.00')).toBe('€4.00')
  })
})
