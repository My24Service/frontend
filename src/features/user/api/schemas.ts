import * as v from 'valibot'
import { format } from 'date-fns'

import { vApiUserRequestWritable, vApiUserSubRequest } from '@/api/valibot.gen'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import {
  passwordErrors,
  usernameMessage,
  USER_MESSAGES,
  withPassword,
  type UserIdentityValues,
} from '../user-form'
import { $trans } from '@/services/i18n'

/**
 * This form parses `vApiUserRequestWritable` — the `Request body:` of
 * `POST /api/company/apiuser/` (and `PUT .../{id}/`) — which already declares
 * everything the legacy form re-checked by hand: the username charset regex,
 * the `name` minLength(1), and the `expire_in_days` integer range. The one rule
 * it adds is `expire_start_dt` required (see `apiUserFormSchema`); the
 * create/edit password asymmetry and the username probe ride alongside the
 * schema exactly like the sales, planning and customer forms.
 */

/**
 * The flat form state. Only the username/password half of
 * `UserIdentityValues` applies — the API-user request carries no
 * first_name/last_name/email — so this picks that half rather than extending
 * the whole interface. The state is flat while the wire nests `api_user`;
 * `payloadOf` does that nesting.
 */
export type ApiUserFormValues = Pick<UserIdentityValues, 'username' | 'password1' | 'password2'> & {
  /** The integration's display name; rides nested as `api_user.name`. */
  name: string
  /**
   * `YYYY-MM-DD` for the native date input; the wire takes an ISO timestamp.
   * `payloadOf` stamps midnight UTC onto the picked day, so the round-trip is
   * timezone-stable (constructing a Date from the timestamp would shift the
   * day in timezones behind UTC).
   */
  expire_start_dt: string
  /** Days of token validity; rides nested as `api_user.expire_in_days`. */
  expire_in_days: number
}

export function emptyApiUser(): ApiUserFormValues {
  return {
    username: '',
    password1: '',
    password2: '',
    name: '',
    // The legacy model prefilled today (`expire_start_dt = moment()`).
    expire_start_dt: format(new Date(), 'yyyy-MM-dd'),
    expire_in_days: 365,
  }
}

export type ApiUserFieldErrors = FieldErrors<
  'username' | 'password1' | 'password2' | 'name' | 'expire_start_dt' | 'expire_in_days'
>

const MESSAGES = {
  ...USER_MESSAGES,
  name_required: () => $trans('Name is required'),
  valid_from_required: () => $trans('Please enter date'),
  // The legacy form showed 'Name is required' under this input too (a
  // copy-paste slip); the converted form says what it wants.
  expire_in_days_required: () => $trans('Please enter the number of days'),
} as const

export const USERNAME_TAKEN_MESSAGE = MESSAGES.username_taken

export const FIELD_MESSAGES = {
  username: usernameMessage,
  password1: MESSAGES.password_required,
  password2: MESSAGES.passwords_mismatch,
  // The request nests the token's own fields, so their copy is addressed by
  // its path — `api_user.name` — and lands beside the input that types it.
  api_user: {
    name: MESSAGES.name_required,
    expire_start_dt: MESSAGES.valid_from_required,
    expire_in_days: MESSAGES.expire_in_days_required,
  },
} satisfies FieldMessages<'username' | 'password1' | 'password2' | 'api_user'>

/**
 * `vApiUserRequestWritable` with the one rule the legacy form enforced that
 * codegen does not: `api_user.expire_start_dt` is optional on the wire
 * (`ApiUserSubRequest` requires only `name` and `expire_in_days`), but a token
 * without a start has no validity window to display, so the form will not save
 * without one. Piped onto the generated entry, so the `isoTimestamp` format
 * stays where codegen puts it.
 *
 * A form-only rule by the second case in docs/agents/form-schemas.md: an
 * absent start degrades the list's "Valid until" cell rather than failing the
 * request, so the endpoint stays permissive and the form is stricter.
 */
export const apiUserFormSchema = v.object({
  ...vApiUserRequestWritable.entries,
  api_user: v.object({
    ...vApiUserSubRequest.entries,
    expire_start_dt: v.pipe(v.unwrap(vApiUserSubRequest.entries.expire_start_dt), v.minLength(1)),
  }),
})

/**
 * A cleared number input arrives as `''` at runtime despite the state type;
 * `Number('')` is 0, which would silently save a zero-day token, so the value
 * goes absent instead and the required entry refuses it.
 */
function toExpireInDays(value: number): number | undefined {
  return (value as unknown) === '' ? undefined : Number(value)
}

/** The flat form state as the endpoint wants it: sub-object fields nested. */
export function payloadOf(values: ApiUserFormValues) {
  return {
    username: values.username,
    api_user: {
      name: values.name,
      // A cleared date input is `''` — leaving the key absent lets the
      // strengthened entry refuse it instead of sending an unparseable string.
      ...(values.expire_start_dt !== '' ? {expire_start_dt: `${values.expire_start_dt}T00:00:00Z`} : {}),
      expire_in_days: toExpireInDays(values.expire_in_days),
    },
  }
}

export function validateApiUserForm(
  values: ApiUserFormValues,
  options: { isCreate: boolean },
): ApiUserFieldErrors {
  // One parse of the composed schema: `fieldErrors` walks the message tree
  // down to the `api_user` leaves, so the sub-object needs no second call
  // against its own entry. `passwordErrors` adds the create/edit password
  // rules the schema cannot see — the same composition `userFormErrors`
  // performs, which this form cannot call directly: its values lack the
  // first/last/email half of `UserIdentityValues` the request never carries.
  const errors: ApiUserFieldErrors = fieldErrors(apiUserFormSchema, payloadOf(values), FIELD_MESSAGES)
  return {...errors, ...passwordErrors(values, options)}
}

export function parseApiUserForm(
  values: ApiUserFormValues,
  options: { isCreate: boolean; password?: string },
): v.InferOutput<typeof vApiUserRequestWritable> {
  // The create/edit asymmetry `withPassword` encodes: on create password1
  // rides as `password`; on edit `password` rides only when one was typed.
  return withPassword(v.parse(apiUserFormSchema, payloadOf(values)), values, options)
}
