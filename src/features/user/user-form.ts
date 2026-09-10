import * as v from 'valibot'

import {
  fieldErrors,
  type FieldErrors,
  type FieldMessages,
} from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

/**
 * The half of a user form that is the same for sales, planning and customer
 * users: the Django `User` fields, the two client-side password inputs, and
 * the create/edit password rules. Only the role sub-object
 * (`sales_user` / `planning_user` / `customer_user`) differs, and each role
 * file passes its own.
 */

export interface UserIdentityValues {
  username: string
  first_name: string
  last_name: string
  email: string
  password1: string
  password2: string
}

export type UserIdentityField = keyof UserIdentityValues

/**
 * Copy shared by all three roles. `email_invalid` differs between them (the
 * sales form says "email address"), so each role file supplies its own map;
 * these are the strings the maps are built from.
 */
export const USER_MESSAGES = {
  username_required: () => $trans('Username is required'),
  username_taken: () => $trans('Username is already in use'),
  // The charset the API enforces, and which these forms stopped checking
  // when they redeclared `username` instead of using the generated entry.
  username_invalid: () => $trans('Please use only letters, digits and @ . + - _'),
  first_name_required: () => $trans('Please enter a first name'),
  last_name_required: () => $trans('Please enter a last name'),
  password_required: () => $trans('Please enter a password'),
  passwords_mismatch: () => $trans('Passwords do not match'),
} as const

/** Debounced, not per keystroke — the company-code ticket's half-second. */
export const USERNAME_PROBE_DEBOUNCE_MS = 500

/**
 * The create/edit asymmetry the legacy form encoded in two vuelidate blocks:
 * on create both passwords are required and must match; on edit they are
 * optional, but a filled first password still requires a matching confirm.
 * Neither field is a schema field - `password2` never rides the wire, and
 * `password1` reaches it under the name `password`.
 */
/** Blank vs. a charset violation — the generated entry checks both. */
export function usernameMessage(issue?: v.BaseIssue<unknown>): string {
  return issue?.type === 'regex'
    ? USER_MESSAGES.username_invalid()
    : USER_MESSAGES.username_required()
}

export function passwordErrors(
  values: Pick<UserIdentityValues, 'password1' | 'password2'>,
  { isCreate }: { isCreate: boolean },
): FieldErrors<'password1' | 'password2'> {
  const errors: FieldErrors<'password1' | 'password2'> = {}

  if ((isCreate || values.password1 !== '') && values.password1 === '') {
    errors.password1 = USER_MESSAGES.password_required()
  }
  if (isCreate || values.password2 !== '' || values.password1 !== '') {
    if (values.password2 === '' || values.password2 !== values.password1) {
      errors.password2 = USER_MESSAGES.passwords_mismatch()
    }
  }

  return errors
}

/**
 * Parse the request payload for its field messages, then add the password
 * rules the schema cannot see. The username probe verdict arrives separately
 * (see use-username-probe.ts) - this only validates what the fields say.
 */
export function userFormErrors<K extends string>(
  schema: v.GenericSchema,
  payload: unknown,
  values: UserIdentityValues,
  messages: FieldMessages<K>,
  options: { isCreate: boolean },
): FieldErrors<K> & FieldErrors<'password1' | 'password2'> {
  return {...fieldErrors(schema, payload, messages), ...passwordErrors(values, options)}
}

/**
 * On create the legacy form copied password1 into `password`; on edit it sent
 * `password` only when one was typed.
 */
export function withPassword<T extends object>(
  parsed: T,
  values: UserIdentityValues,
  { isCreate, password }: { isCreate: boolean; password?: string },
): T & { password?: string } {
  if (isCreate) return { ...parsed, password: values.password1 }
  if (password !== undefined) return { ...parsed, password }
  return parsed
}
