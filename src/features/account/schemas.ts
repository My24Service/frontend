import * as v from 'valibot'

import {
  vAccountsResetPasswordCreateBody,
  vAccountsSendResetPasswordLinkCreateBody,
} from '@/api/valibot.gen'
import { passwordErrors } from '@/features/forms/password-rules'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

import type { AccountLinkParams } from './link-params'

/**
 * Both forms parse their generated request schema. `vAccountsResetPasswordCreateBody`
 * needs nothing from this file - it already requires a non-blank user_id,
 * signature and password - so only the reset-link form has a schema here.
 * Query parsing and its timestamp coercion live in link-params.ts, which is
 * where the untyped boundary is.
 */

/**
 * The endpoint takes either a user_id or an email, so it cannot require the
 * email - this form only ever sends the email, so it does. `v.required`
 * rather than a redeclared entry: it lifts the optional off and keeps the
 * generated `minLength(1)` underneath.
 */
export const sendResetLinkSchema = v.required(vAccountsSendResetPasswordLinkCreateBody, ['email'])

export interface SendResetLinkValues {
  email: string
}

export type SendResetLinkErrors = FieldErrors<'email'>

const SEND_RESET_LINK_MESSAGES: FieldMessages<'email'> = {
  email: () => MESSAGES.email_required(),
}

export function validateSendResetLink(values: SendResetLinkValues): SendResetLinkErrors {
  return fieldErrors(
    sendResetLinkSchema,
    { ...values, isRegistration: false },
    SEND_RESET_LINK_MESSAGES,
  )
}

export function parseSendResetLink(values: SendResetLinkValues) {
  return v.parse(sendResetLinkSchema, { ...values, isRegistration: false })
}

export interface SetPasswordValues {
  password1: string
  password2: string
}

export type SetPasswordErrors = FieldErrors<'password1' | 'password2'>

/**
 * Not fieldErrors: neither field is a schema field. `password2` never rides
 * the wire and `password1` is only checked here for blankness, because the
 * schema sees it under the name `password` and only once the two agree.
 *
 * The rule and its copy are the shared `forms/password-rules` pair — this
 * form always requires a password, which is that rule's create half — so the
 * account forms and the seven user forms cannot drift apart.
 */
export function validateSetPassword(values: SetPasswordValues): SetPasswordErrors {
  return passwordErrors(values, { isCreate: true })
}

export function parseSetPassword(link: AccountLinkParams, password: string) {
  return v.parse(vAccountsResetPasswordCreateBody, { ...link, password })
}

const MESSAGES = {
  email_required: () => $trans('Please enter an email'),
} as const
