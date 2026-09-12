import { describe, expect, test } from 'vitest'

import { E164_PATTERN, normalizePhone } from '@/features/forms/phone'

/**
 * The phone normalizer sits at a form's wire boundary: the user types
 * however they like, the API only ever sees the canonical form. These pin
 * the formats found in the production backup (every failing engineer
 * mobile there is one of these shapes) and the two things it must not do.
 */

describe('normalizePhone', () => {
  test.each([
    ['+31612345678', '+31612345678'],
    ['+31 6 12345678', '+31612345678'],
    ['+31 (0)6-1234 5678', '+31612345678'],
    ['06-12345678', '+31612345678'],
    ['06 12345678', '+31612345678'],
    ['0318 300 618', '+31318300618'],
    ['033-2474020', '+31332474020'],
    ['0031612345678', '+31612345678'],
    ['+32 477 12 34 56', '+32477123456'],
    ['  +31612345678  ', '+31612345678'],
  ])('%s → %s', (typed, wire) => {
    expect(normalizePhone(typed)).toBe(wire)
  })

  test('the country code is a parameter, defaulting to the Netherlands', () => {
    expect(normalizePhone('0477 12 34 56', '+32')).toBe('+32477123456')
  })

  test('a blank stays blank, so "not filled" is still distinguishable', () => {
    expect(normalizePhone('')).toBe('')
    expect(normalizePhone('   ')).toBe('')
  })

  test('what is not a number comes back as typed, for the validator to refuse', () => {
    expect(normalizePhone('call me')).toBe('callme')
    expect(normalizePhone('++31612345678')).toBe('++31612345678')
  })
})

describe('E164_PATTERN', () => {
  test('accepts the normalized forms and refuses the typed ones', () => {
    expect(E164_PATTERN.test('+31612345678')).toBe(true)
    expect(E164_PATTERN.test('+32477123456')).toBe(true)
    expect(E164_PATTERN.test('+31 6 12345678')).toBe(false)
    expect(E164_PATTERN.test('0612345678')).toBe(false)
    expect(E164_PATTERN.test('+0612345678')).toBe(false)
    expect(E164_PATTERN.test('+3161234')).toBe(false)
  })
})
