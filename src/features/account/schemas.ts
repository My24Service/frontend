import * as v from 'valibot'

import {
  vAccountsResetPasswordCreateBody,
  vAccountsSendResetPasswordLinkCreateBody,
} from '@/api/valibot.gen'
import { passwordErrors } from '@/features/forms/password-rules'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

import type { AccountLinkParams } from './link-params'

export const sendResetLinkSchema = v.required(vAccountsSendResetPasswordLinkCreateBody, ['email'])

export interface SendResetLinkValues {
  email: string
}

export type SendResetLinkErrors = FieldErrors<'email'>

const SEND_RESET_LINK_MESSAGES: FieldMessages<'email'> = {
  email: () => MESSAGES.email_required(),
}

export function validateSendResetLink(values: SendResetLinkValues): SendResetLinkErrors {
  return fieldErrors(sendResetLinkSchema, values, SEND_RESET_LINK_MESSAGES)
}

export function parseSendResetLink(values: SendResetLinkValues) {
  return v.parse(sendResetLinkSchema, values)
}

export interface SetPasswordValues {
  password1: string
  password2: string
}

export type SetPasswordErrors = FieldErrors<'password1' | 'password2'>

export function validateSetPassword(values: SetPasswordValues): SetPasswordErrors {
  return passwordErrors(values, { isCreate: true })
}

export function parseSetPassword(link: AccountLinkParams, password: string) {
  return v.parse(vAccountsResetPasswordCreateBody, { ...link, password })
}

const MESSAGES = {
  email_required: () => $trans('Please enter an email'),
} as const
