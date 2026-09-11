import * as v from 'valibot'

import { vCustomerUserRequestWritable } from '@/api/valibot.gen'
import { type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import {
  emptyUserIdentity,
  usernameMessage,
  userFormErrors,
  USER_MESSAGES,
  withPassword,
  type UserIdentityValues,
} from '../user-form'
import { $trans } from '@/services/i18n'

export interface CustomerUserFormValues extends UserIdentityValues {
  customer: number | null
  settings_group: string
}

export function emptyCustomerUser(): CustomerUserFormValues {
  return {
    ...emptyUserIdentity(),
    customer: null,
    settings_group: '',
  }
}

export type CustomerUserFieldErrors = FieldErrors<
  'username' | 'first_name' | 'last_name' | 'email' | 'password1' | 'password2'
>

const MESSAGES = {
  ...USER_MESSAGES,
  email_invalid: () => $trans('Please enter a valid email'),
} as const

export const USERNAME_TAKEN_MESSAGE = MESSAGES.username_taken

export const FIELD_MESSAGES = {
  username: usernameMessage,
  first_name: MESSAGES.first_name_required,
  last_name: MESSAGES.last_name_required,
  email: MESSAGES.email_invalid,
  password1: MESSAGES.password_required,
  password2: MESSAGES.passwords_mismatch,
} satisfies FieldMessages<keyof CustomerUserFormValues & string>

export function payloadOf(values: CustomerUserFormValues) {
  return {
    username: values.username,
    email: values.email,
    first_name: values.first_name,
    last_name: values.last_name,
    customer_user: {
      customer: values.customer,
      settings_group: values.settings_group,
    },
  }
}

export function validateCustomerUserForm(
  values: CustomerUserFormValues,
  options: { isCreate: boolean },
): CustomerUserFieldErrors {
  return userFormErrors(
    vCustomerUserRequestWritable, payloadOf(values), values, FIELD_MESSAGES, options,
  )
}

export function parseCustomerUserForm(
  values: CustomerUserFormValues,
  options: { isCreate: boolean; password?: string },
): v.InferOutput<typeof vCustomerUserRequestWritable> {
  return withPassword(v.parse(vCustomerUserRequestWritable, payloadOf(values)), values, options)
}
