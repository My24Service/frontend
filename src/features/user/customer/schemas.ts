import * as v from 'valibot'

import { vCustomerUserRequestWritable } from '@/api/valibot.gen'
import { type FieldErrors, type FieldMessages } from '@/features/shared/form-validation'
import {
  requiredIdentity,
  usernameMessage,
  userFormErrors,
  USER_MESSAGES,
  withPassword,
  type UserIdentityValues,
} from '../user-form'
import { $trans } from '@/utils'

/**
 * The generated request schema with the three identity fields made required
 * (see requiredIdentity). The customer link stays as generated - nullable:
 * the legacy form leaves `customer_user.customer` null until the user picks
 * one from the autocomplete, so the form validates the identity fields and
 * the passwords only.
 */
export const customerUserFormSchema = v.object({
  ...vCustomerUserRequestWritable.entries,
  ...requiredIdentity(vCustomerUserRequestWritable.entries),
})

/** The flat form state: the identity fields plus the `customer_user` sub-object. */
export interface CustomerUserFormValues extends UserIdentityValues {
  customer: number | null
  settings_group: string
}

export function emptyCustomerUser(): CustomerUserFormValues {
  return {
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password1: '',
    password2: '',
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

/** The flat form state as the endpoint wants it: sub-object fields nested. */
function payloadOf(values: CustomerUserFormValues) {
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
    customerUserFormSchema, payloadOf(values), values, FIELD_MESSAGES, options,
  )
}

export function parseCustomerUserForm(
  values: CustomerUserFormValues,
  options: { isCreate: boolean; password?: string },
): v.InferOutput<typeof customerUserFormSchema> {
  return withPassword(v.parse(customerUserFormSchema, payloadOf(values)), values, options)
}
