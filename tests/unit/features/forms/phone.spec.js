import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import { normalizePhone } from '@/features/forms'
import { vStudentSubRegisterRequest } from '@/api/valibot.gen'

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
    expect(normalizePhone(typed, '+31')).toBe(wire)
  })

  test('the country code is a required parameter', () => {
    expect(normalizePhone('0477 12 34 56', '+32')).toBe('+32477123456')
  })

  test('a blank stays blank, so "not filled" is still distinguishable', () => {
    expect(normalizePhone('', '+31')).toBe('')
    expect(normalizePhone('   ', '+31')).toBe('')
  })

  test('what is not a number comes back as typed, for the validator to refuse', () => {
    expect(normalizePhone('call me', '+31')).toBe('callme')
    expect(normalizePhone('++31612345678', '+31')).toBe('++31612345678')
  })
})

describe('the generated mobile entry', () => {
  // The rule is the backend's; this only pins that what normalizePhone
  // produces is what the generated regex checks, and that the typed forms
  // would not have passed it.
  const mobile = vStudentSubRegisterRequest.entries.mobile
  const passes = (value) => v.safeParse(mobile, value).success

  test('accepts the normalized forms and refuses the typed ones', () => {
    expect(passes('+31612345678')).toBe(true)
    expect(passes('+32477123456')).toBe(true)
    expect(passes('+31 6 12345678')).toBe(false)
    expect(passes('0612345678')).toBe(false)
    expect(passes('+0612345678')).toBe(false)
    expect(passes('+3161234')).toBe(false)
  })
})
