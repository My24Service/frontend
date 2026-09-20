import * as v from 'valibot'

import { PASSWORD_MESSAGES, passwordErrors, type PasswordValues } from '@/features/forms/password-rules'
import type { FieldLabels } from '@/features/forms/validated-form-context'
import {
  fieldErrors,
  requiredMessage,
  type FieldErrors,
  type FieldMessages,
} from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

export function emptyUserIdentity() {
  return {
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password1: '',
    password2: '',
  }
}

export type UserIdentityValues = ReturnType<typeof emptyUserIdentity>

/**
 * A user form's values: the request body as the form holds it (input side,
 * nested exactly as the wire nests it) plus the identity block the panel
 * edits — which makes `username` required and adds the two client-only
 * password fields.
 */
export type UserFormValues<TSchema extends v.GenericSchema> = v.InferInput<TSchema> & UserIdentityValues

/**
 * The form's fields, filled from a record where the record has them. The
 * keys come from `defaults`, so a read-only companion the record carries
 * (`uuid`, `picture_url`, a rating) never lands on the form, and a null the
 * API sends for an untouched field becomes the form's blank.
 */
export function filledFrom<T extends object>(
  defaults: T,
  source: { [K in keyof T]?: T[K] | null } | null | undefined,
): T {
  const values = { ...defaults }
  if (!source) return values
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const value = source[key]
    if (value != null) values[key] = value
  }
  return values
}

export type UserIdentityField = keyof UserIdentityValues

/**
 * The lines the rules cannot say on their own. The first and last name and
 * the email read the rule's line under their label; the two password lines
 * belong to the shared rule in `forms/password-rules.ts`.
 */
const USER_MESSAGES = {
  username_taken: () => $trans('Username is already in use'),
  // The charset the API enforces, and which these forms stopped checking
  // when they redeclared `username` instead of using the generated entry.
  username_invalid: () => $trans('Please use only letters, digits and @ . + - _'),
  ...PASSWORD_MESSAGES,
} as const

/** Debounced, not per keystroke — the company-code ticket's half-second. */
export const USERNAME_PROBE_DEBOUNCE_MS = 500

/** Blank vs. a charset violation — the generated entry checks both. */
function usernameMessage(issue?: v.BaseIssue<unknown>): string {
  return issue?.type === 'regex'
    ? USER_MESSAGES.username_invalid()
    : requiredMessage(IDENTITY_FIELD_LABELS.username())
}

export const USERNAME_TAKEN_MESSAGE = USER_MESSAGES.username_taken

/** The copy for the identity block; a per-type map spreads it and adds its own. */
export const IDENTITY_FIELD_MESSAGES = {
  username: usernameMessage,
  password1: USER_MESSAGES.password_required,
  password2: USER_MESSAGES.passwords_mismatch,
} satisfies FieldMessages<UserIdentityField>

/**
 * What the identity block calls its fields, written once because the panel draws
 * these rows for all seven forms. The two a single form renames stay the panel's
 * own overrides; the panel renders the `username` row itself, so its label only
 * names the field in a validation line.
 */
export const IDENTITY_FIELD_LABELS = {
  username: () => $trans('Username'),
  password1: () => $trans('Password'),
  password2: () => $trans('Password again'),
  first_name: () => $trans('First name'),
  last_name: () => $trans('Last name'),
  email: () => $trans('Email'),
} satisfies FieldLabels<UserIdentityField>

/** The errors a user form can show: the identity block's plus its own leaves. */
export type UserFieldErrors<K extends string = never> = FieldErrors<UserIdentityField | K>

function userFormErrors<K extends string>(
  schema: v.GenericSchema,
  payload: unknown,
  values: PasswordValues,
  messages: FieldMessages,
  labels: FieldLabels,
  options: { isCreate: boolean },
): FieldErrors<K> & FieldErrors<'password1' | 'password2'> {
  const errors: FieldErrors<K> = fieldErrors(schema, payload, messages, labels)
  return {...errors, ...passwordErrors(values, options)}
}

function withPassword<T extends object>(
  parsed: T,
  values: Pick<PasswordValues, 'password1'>,
  { isCreate, password }: { isCreate: boolean; password?: string },
): T & { password?: string } {
  if (isCreate) return { ...parsed, password: values.password1 }
  if (password !== undefined) return { ...parsed, password }
  return parsed
}

/**
 * The validate/parse pair every user form hands `useUserForm`, built once
 * from the type's request schema and message tree.
 *
 * `payloadOf` shapes the values for the wire where a schema cannot take an
 * input blank (a nullish date, an optional-but-non-empty IBAN); most types
 * are wire-shaped as they are. The parse strips whatever the
 * schema does not declare — the passwords, a record's read-only companions
 * — and `withPassword` adds the one the wrapper assembled.
 */
export function userFormContract<
  S extends v.GenericSchema<unknown, object>,
  V extends PasswordValues = UserFormValues<S>,
  K extends string = never,
>({
  schema,
  messages,
  labels = IDENTITY_FIELD_LABELS,
  payloadOf = (values) => values,
}: {
  schema: S
  messages: FieldMessages
  /** The identity labels, plus a type's own nested ones keyed by path. */
  labels?: FieldLabels
  payloadOf?: (values: V) => unknown
}) {
  return {
    validate(values: V, options: { isCreate: boolean }): FieldErrors<K> & FieldErrors<'password1' | 'password2'> {
      return userFormErrors<K>(schema, payloadOf(values), values, messages, labels, options)
    },
    parse(values: V, options: { isCreate: boolean; password?: string }): v.InferOutput<S> & { password?: string } {
      return withPassword(v.parse(schema, payloadOf(values)), values, options)
    },
  }
}
