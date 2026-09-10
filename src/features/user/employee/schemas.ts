import * as v from 'valibot'

import { vEmployeeUserRequestWritable } from '@/api/valibot.gen'
import { type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import {
  usernameMessage,
  userFormErrors,
  USER_MESSAGES,
  withPassword,
  type UserIdentityValues,
} from '../user-form'
import { $trans } from '@/services/i18n'

/**
 * This form adds nothing to `vEmployeeUserRequestWritable` - see the sales
 * schema for what it carries on its own.
 */

/** The flat form state: the identity fields plus the `employee_user` sub-object. */
export interface EmployeeUserFormValues extends UserIdentityValues {
  // The legacy form never rendered this - only the model's create default -
  // but the legacy create posted it and the legacy edit round-tripped the
  // record's value, so the payload keeps it: `true` on a fresh form, the
  // record's value under edit. The API must be lax here, the form need not be.
  uses_time_registration: boolean
  contract_hours_week: string
  // The branch picker is empty rather than absent until chosen; the generated
  // entry is nullish, so `null` is the untouched state the wire accepts.
  branch: number | null
}

export function emptyEmployeeUser(): EmployeeUserFormValues {
  return {
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password1: '',
    password2: '',
    uses_time_registration: true,
    contract_hours_week: '0.00',
    branch: null,
  }
}

export type EmployeeUserFieldErrors = FieldErrors<
  'username' | 'first_name' | 'last_name' | 'email' | 'password1' | 'password2'
  | 'contract_hours_week'
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
} satisfies FieldMessages<keyof EmployeeUserFormValues & string>

/** The flat form state as the endpoint wants it: sub-object fields nested. */
export function payloadOf(values: EmployeeUserFormValues) {
  return {
    username: values.username,
    email: values.email,
    first_name: values.first_name,
    last_name: values.last_name,
    employee_user: {
      uses_time_registration: values.uses_time_registration,
      contract_hours_week: values.contract_hours_week,
      branch: values.branch,
    },
  }
}

export function validateEmployeeUserForm(
  values: EmployeeUserFormValues,
  options: { isCreate: boolean },
): EmployeeUserFieldErrors {
  return userFormErrors(
    vEmployeeUserRequestWritable, payloadOf(values), values, FIELD_MESSAGES, options,
  )
}

export function parseEmployeeUserForm(
  values: EmployeeUserFormValues,
  options: { isCreate: boolean; password?: string },
): v.InferOutput<typeof vEmployeeUserRequestWritable> {
  return withPassword(v.parse(vEmployeeUserRequestWritable, payloadOf(values)), values, options)
}
