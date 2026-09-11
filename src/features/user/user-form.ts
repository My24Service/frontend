import * as v from 'valibot'

import { PASSWORD_MESSAGES, passwordErrors } from '@/features/forms/password-rules'
import {
  fieldErrors,
  type FieldErrors,
  type FieldMessages,
} from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

export interface UserIdentityValues {
  username: string
  first_name: string
  last_name: string
  email: string
  password1: string
  password2: string
}

export type UserIdentityField = keyof UserIdentityValues

export function emptyUserIdentity(): UserIdentityValues {
  return {
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password1: '',
    password2: '',
  }
}

export const USER_MESSAGES = {
  username_required: () => $trans('Username is required'),
  username_taken: () => $trans('Username is already in use'),
  // The charset the API enforces, and which these forms stopped checking
  // when they redeclared `username` instead of using the generated entry.
  username_invalid: () => $trans('Please use only letters, digits and @ . + - _'),
  first_name_required: () => $trans('Please enter a first name'),
  last_name_required: () => $trans('Please enter a last name'),
  // The two password lines every user form shows; they belong to the shared
  // rule, so they are declared in `forms/password-rules.ts` and spread in
  // here for the per-type `FIELD_MESSAGES` maps.
  ...PASSWORD_MESSAGES,
} as const

/** Debounced, not per keystroke — the company-code ticket's half-second. */
export const USERNAME_PROBE_DEBOUNCE_MS = 500

/** Blank vs. a charset violation — the generated entry checks both. */
export function usernameMessage(issue?: v.BaseIssue<unknown>): string {
  return issue?.type === 'regex'
    ? USER_MESSAGES.username_invalid()
    : USER_MESSAGES.username_required()
}

export function userFormErrors<K extends string>(
  schema: v.GenericSchema,
  payload: unknown,
  values: UserIdentityValues,
  messages: FieldMessages,
  options: { isCreate: boolean },
): FieldErrors<K> & FieldErrors<'password1' | 'password2'> {
  const errors: FieldErrors<K> = fieldErrors(schema, payload, messages)
  return {...errors, ...passwordErrors(values, options)}
}

export function withPassword<T extends object>(
  parsed: T,
  values: Pick<UserIdentityValues, 'password1'>,
  { isCreate, password }: { isCreate: boolean; password?: string },
): T & { password?: string } {
  if (isCreate) return { ...parsed, password: values.password1 }
  if (password !== undefined) return { ...parsed, password }
  return parsed
}
