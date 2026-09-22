import { describe, expect, test } from 'vitest'

import { validateSetPassword } from '@/features/account'
import { PASSWORD_MESSAGES, passwordErrors } from '@/features/forms'

/**
 * One implementation of the password rule, and one copy, shared by the seven
 * user forms and the account reset-password form.
 *
 * It used to exist twice — byte-identical logic with byte-identical strings,
 * in `user/user-form.ts` and again in `account/schemas.ts` — so a change to
 * one of them could disagree with the other without any spec noticing. These
 * pin the shared rule's create/edit asymmetry and the account form's place in
 * it.
 */

describe('passwordErrors, the create half', () => {
  test('requires both passwords and a match', () => {
    expect(passwordErrors({ password1: '', password2: '' }, { isCreate: true }))
      .toEqual({
        password1: 'Please enter a password',
        password2: 'Passwords do not match',
      })
    expect(passwordErrors({ password1: 'secret', password2: 'other' }, { isCreate: true }))
      .toEqual({ password2: 'Passwords do not match' })
    expect(passwordErrors({ password1: 'secret', password2: 'secret' }, { isCreate: true }))
      .toEqual({})
  })
})

describe('passwordErrors, the edit half', () => {
  test('an untouched pair passes, a filled first password still needs its confirm', () => {
    expect(passwordErrors({ password1: '', password2: '' }, { isCreate: false })).toEqual({})
    expect(passwordErrors({ password1: 'secret', password2: '' }, { isCreate: false }))
      .toEqual({ password2: 'Passwords do not match' })
    expect(passwordErrors({ password1: 'secret', password2: 'secret' }, { isCreate: false }))
      .toEqual({})
  })
})

describe('validateSetPassword, the account form', () => {
  test('is the shared rule\'s create half, message for message', () => {
    for (const values of [
      { password1: '', password2: '' },
      { password1: 'secret', password2: '' },
      { password1: 'secret', password2: 'other' },
      { password1: 'secret', password2: 'secret' },
    ]) {
      expect(validateSetPassword(values)).toEqual(passwordErrors(values, { isCreate: true }))
    }
  })
})

describe('the password copy', () => {
  test('is declared once, where both features read it', () => {
    expect(PASSWORD_MESSAGES.password_required()).toBe('Please enter a password')
    expect(PASSWORD_MESSAGES.passwords_mismatch()).toBe('Passwords do not match')
  })
})
