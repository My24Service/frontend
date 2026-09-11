import * as v from 'valibot'

import { PASSWORD_MESSAGES, passwordErrors } from '@/features/forms/password-rules'
import {
  fieldErrors,
  type FieldErrors,
  type FieldMessages,
} from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

/**
 * The half of a user form that is the same for sales, planning and customer
 * users: the Django `User` fields and the two client-side password inputs.
 * Only the role sub-object (`sales_user` / `planning_user` / `customer_user`)
 * differs, and each role file passes its own. The password rule itself is
 * shared with the account forms — see `@/features/forms/password-rules`.
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
 * The blank identity half every full user form starts from.
 *
 * Lives beside `UserIdentityValues` rather than in the `forms/` kit: the kit
 * may not carry domain concepts (ADR-0002 amendment), and the shared half of
 * several forms belongs in a module beside them (`docs/agents/form-schemas.md`).
 * A fresh object per call, so callers spreading it never share state.
 */
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

/**
 * Parse the request payload for its field messages, then add the password
 * rules the schema cannot see (the shared `passwordErrors`). The username
 * probe verdict arrives separately (see use-username-probe.ts) - this only
 * validates what the fields say.
 */
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

/**
 * On create the legacy form copied password1 into `password`; on edit it sent
 * `password` only when one was typed.
 *
 * Only `password1` is read, so the api form — whose request carries no
 * first/last/email — passes its narrower values here too.
 */
export function withPassword<T extends object>(
  parsed: T,
  values: Pick<UserIdentityValues, 'password1'>,
  { isCreate, password }: { isCreate: boolean; password?: string },
): T & { password?: string } {
  if (isCreate) return { ...parsed, password: values.password1 }
  if (password !== undefined) return { ...parsed, password }
  return parsed
}
