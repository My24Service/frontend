import * as v from 'valibot'

import { vSalesUserRequestWritable } from '@/api/valibot.gen'
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

/**
 * This form adds nothing to `vSalesUserRequestWritable`. Since the six user
 * serializers gained `required: True, allow_blank: False` on email, first_name
 * and last_name, it declares everything the form enforces: the identity
 * fields, the username charset regex, and the `contract_hours_week` decimal
 * regex DRF coerces the legacy form's digit strings with.
 */

/** The flat form state: the identity fields plus the `sales_user` sub-object. */
export interface SalesUserFormValues extends UserIdentityValues {
  uses_time_registration: boolean
  contract_hours_week: string
  uuid?: string
}

export function emptySalesUser(): SalesUserFormValues {
  return {
    ...emptyUserIdentity(),
    uses_time_registration: false,
    contract_hours_week: '0.00',
  }
}

export type SalesUserFieldErrors = FieldErrors<
  'username' | 'first_name' | 'last_name' | 'email' | 'password1' | 'password2'
  | 'contract_hours_week'
>

const MESSAGES = {
  ...USER_MESSAGES,
  email_invalid: () => $trans('Please enter a valid email address'),
} as const

export const USERNAME_TAKEN_MESSAGE = MESSAGES.username_taken

export const FIELD_MESSAGES = {
  username: usernameMessage,
  first_name: MESSAGES.first_name_required,
  last_name: MESSAGES.last_name_required,
  email: MESSAGES.email_invalid,
  password1: MESSAGES.password_required,
  password2: MESSAGES.passwords_mismatch,
} satisfies FieldMessages<keyof SalesUserFormValues & string>

/** The flat form state as the endpoint wants it: sub-object fields nested. */
export function payloadOf(values: SalesUserFormValues) {
  return {
    username: values.username,
    email: values.email,
    first_name: values.first_name,
    last_name: values.last_name,
    sales_user: {
      uses_time_registration: values.uses_time_registration,
      contract_hours_week: values.contract_hours_week,
    },
  }
}

export function validateSalesUserForm(
  values: SalesUserFormValues,
  options: { isCreate: boolean },
): SalesUserFieldErrors {
  return userFormErrors(
    vSalesUserRequestWritable, payloadOf(values), values, FIELD_MESSAGES, options,
  )
}

export function parseSalesUserForm(
  values: SalesUserFormValues,
  options: { isCreate: boolean; password?: string },
): v.InferOutput<typeof vSalesUserRequestWritable> {
  return withPassword(v.parse(vSalesUserRequestWritable, payloadOf(values)), values, options)
}
