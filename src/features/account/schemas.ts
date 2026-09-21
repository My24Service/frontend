import * as v from 'valibot'

import {
  vAccountsResetPasswordCreateBody,
  vAccountsSendResetPasswordLinkCreateBody,
} from '@/api/valibot.gen'
import {
  PASSWORD_MESSAGES,
  passwordErrors,
  fieldErrors,
  type FieldErrors,
  type FieldMessages,
  type FieldLabels,
} from '@/features/forms'
import { $trans } from '@/services/i18n'

import type { AccountLinkParams } from './link-params'

export const sendResetLinkSchema = v.required(vAccountsSendResetPasswordLinkCreateBody, ['email'])

export interface SendResetLinkValues {
  email: string
}

export type SendResetLinkErrors = FieldErrors<'email'>

export const SEND_RESET_LINK_FIELD_LABELS = {
  email: () => $trans('email'),
} satisfies FieldLabels<'email'>

export function validateSendResetLink(values: SendResetLinkValues): SendResetLinkErrors {
  return fieldErrors(sendResetLinkSchema, values, {}, SEND_RESET_LINK_FIELD_LABELS)
}

export function parseSendResetLink(values: SendResetLinkValues) {
  return v.parse(sendResetLinkSchema, values)
}

export interface SetPasswordValues {
  password1: string
  password2: string
}

export type SetPasswordErrors = FieldErrors<'password1' | 'password2'>

export const SET_PASSWORD_FIELD_LABELS = {
  password1: () => $trans('Password'),
  password2: () => $trans('Password again'),
} satisfies FieldLabels<'password1' | 'password2'>

/**
 * The copy under each box: the same two lines the user forms show, owned by
 * the shared password rule rather than re-spelled here.
 */
export const SET_PASSWORD_FIELD_MESSAGES = {
  password1: PASSWORD_MESSAGES.password_required,
  password2: PASSWORD_MESSAGES.passwords_mismatch,
} satisfies FieldMessages<'password1' | 'password2'>

export function validateSetPassword(values: SetPasswordValues): SetPasswordErrors {
  return passwordErrors(values, { isCreate: true })
}

export function parseSetPassword(link: AccountLinkParams, password: string) {
  return v.parse(vAccountsResetPasswordCreateBody, { ...link, password })
}
