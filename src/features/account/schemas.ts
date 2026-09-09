import * as v from 'valibot'

import {
  vAccountsResetPasswordCreateBody,
  vAccountsSendResetPasswordLinkCreateBody,
} from '@/api/valibot.gen'
import { $trans } from '@/utils'

import type { AccountLinkParams } from './link-params'

/**
 * Strengthenings for required fields. The generated bodies accept blanks the
 * legacy vuelidate `required` rules rejected, so each form adds minLength(1)
 * with a reason. The parse output is the request body. Query parsing and its
 * timestamp coercion live in link-params.ts, which is where the untyped
 * boundary is.
 */

export const sendResetLinkSchema = v.object({
  ...vAccountsSendResetPasswordLinkCreateBody.entries,
  // Generator accepts a blank or absent email. The legacy form required one.
  email: v.pipe(v.string(), v.minLength(1)),
})

export interface SendResetLinkValues {
  email: string
}

export type SendResetLinkErrors = Partial<Record<'email', string>>

export function validateSendResetLink(values: SendResetLinkValues): SendResetLinkErrors {
  const result = v.safeParse(sendResetLinkSchema, { ...values, isRegistration: false })

  if (result.success) return {}
  return { email: MESSAGES.email_required() }
}

export function parseSendResetLink(values: SendResetLinkValues) {
  return v.parse(sendResetLinkSchema, { ...values, isRegistration: false })
}

export const setPasswordSchema = v.object({
  ...vAccountsResetPasswordCreateBody.entries,
  // Generator accepts empty strings. The legacy form required both fields.
  user_id: v.pipe(v.string(), v.minLength(1)),
  signature: v.pipe(v.string(), v.minLength(1)),
  password: v.pipe(v.string(), v.minLength(1)),
})

export interface SetPasswordValues {
  password1: string
  password2: string
}

export type SetPasswordErrors = Partial<Record<'password1' | 'password2', string>>

export function validateSetPassword(values: SetPasswordValues): SetPasswordErrors {
  const errors: SetPasswordErrors = {}

  if (values.password1 === '') {
    errors.password1 = MESSAGES.password_required()
  }
  // The confirm field never rides the wire. A mismatch is client-only, the
  // legacy vuelidate sameAs rule in new clothes. The group shows the mismatch
  // copy for an empty confirm too, exactly like the legacy template.
  if (values.password2 === '' || values.password2 !== values.password1) {
    errors.password2 = MESSAGES.passwords_mismatch()
  }

  return errors
}

export function parseSetPassword(link: AccountLinkParams, password: string) {
  return v.parse(setPasswordSchema, { ...link, password })
}

const MESSAGES = {
  email_required: () => $trans('Please enter an email'),
  password_required: () => $trans('Please enter a password'),
  passwords_mismatch: () => $trans('Passwords do not match'),
} as const
