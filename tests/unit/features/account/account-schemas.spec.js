import { describe, expect, test } from 'vitest'

import {
  readLinkParams,
  parseSendResetLink,
  parseSetPassword,
  validateSendResetLink,
  validateSetPassword,
} from '@/features/account'

/**
 * Pure-function suite for the account schemas and link params. No network,
 * no seam. These pin the validation gates and the string-to-number coercion
 * the generated schemas demand.
 */

describe('validateSendResetLink', () => {
  test('it refuses an empty email', () => {
    expect(validateSendResetLink({ email: '' })).toEqual({
      email: 'Please enter an email',
    })
  })

  test('it accepts a filled email', () => {
    expect(validateSendResetLink({ email: 'user@example.test' })).toEqual({})
  })
})

describe('parseSendResetLink', () => {
  test('the parse output is the request body', () => {
    expect(parseSendResetLink({ email: 'user@example.test' })).toEqual({
      email: 'user@example.test',
      isRegistration: false,
    })
  })
})

describe('validateSetPassword', () => {
  test('it refuses an empty form', () => {
    expect(validateSetPassword({ password1: '', password2: '' })).toEqual({
      password1: 'Please enter a password',
      password2: 'Passwords do not match',
    })
  })

  test('it refuses mismatched passwords', () => {
    expect(validateSetPassword({ password1: 'new-secret', password2: 'other' })).toEqual({
      password2: 'Passwords do not match',
    })
  })

  test('it accepts matching passwords', () => {
    expect(validateSetPassword({ password1: 'new-secret', password2: 'new-secret' })).toEqual({})
  })
})

describe('parseSetPassword', () => {
  test('the parse output is the request body', () => {
    expect(
      parseSetPassword({ user_id: 7, timestamp: 1700000000, signature: 'sig-abc' }, 'new-secret'),
    ).toEqual({
      user_id: 7,
      timestamp: 1700000000,
      signature: 'sig-abc',
      password: 'new-secret',
    })
  })
})

describe('readLinkParams', () => {
  test('it coerces a full query into link params', () => {
    expect(
      readLinkParams({ user_id: '7', timestamp: '1700000000', signature: 'sig-abc' }),
    ).toEqual({ user_id: 7, timestamp: 1700000000, signature: 'sig-abc' })
  })

  test('it returns null when anything is missing', () => {
    expect(readLinkParams({})).toBeNull()
    expect(readLinkParams({ user_id: '7', timestamp: '1700000000' })).toBeNull()
    expect(readLinkParams({ user_id: '', timestamp: '1700000000', signature: 'sig' })).toBeNull()
  })

  test('it accepts a numeric timestamp as well as a string one', () => {
    expect(
      readLinkParams({ user_id: '7', timestamp: 1700000000, signature: 'sig-abc' }),
    ).toEqual({ user_id: 7, timestamp: 1700000000, signature: 'sig-abc' })
  })

  test('it returns null for a non-numeric timestamp', () => {
    expect(
      readLinkParams({ user_id: '7', timestamp: 'not-a-number', signature: 'sig' }),
    ).toBeNull()
  })

  // Number('') and Number(null) both coerce to 0, which the endpoint would
  // answer 400 to. The positivity half of the check keeps the fail-fast
  // promise: an empty or missing value never reaches the wire.
  test.each([['0'], [0], ['-5'], [''], [null], [undefined]])(
    'it returns null for a non-positive timestamp %p',
    (timestamp) => {
      expect(
        readLinkParams({ user_id: '7', timestamp, signature: 'sig' }),
      ).toBeNull()
    },
  )

  test('it returns null for a fractional timestamp', () => {
    expect(
      readLinkParams({ user_id: '7', timestamp: '1700000000.5', signature: 'sig' }),
    ).toBeNull()
  })
})
