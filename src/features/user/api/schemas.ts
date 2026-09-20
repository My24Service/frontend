import { format } from 'date-fns'

import { vApiUserRequestWritable } from '@/api/valibot.gen'
import { requiredMessages, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import type { FieldLabels } from '@/features/forms/validated-form-context'
import {
  IDENTITY_FIELD_LABELS,
  IDENTITY_FIELD_MESSAGES,
  userFormContract,
} from '../user-form'
import { $trans } from '@/services/i18n'

export function emptyApiUser() {
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

export type ApiUserFormValues = ReturnType<typeof emptyApiUser>

export type ApiUserFieldErrors = FieldErrors<
  | 'username' | 'password1' | 'password2'
  | 'api_user.name' | 'api_user.expire_start_dt' | 'api_user.expire_in_days'
>

export const FIELD_MESSAGES = {
  ...IDENTITY_FIELD_MESSAGES,
  api_user: {
    // "Valid from" is no noun the rule's line could name; a date is asked for.
    expire_start_dt: () => $trans('Please enter a date'),
  },
} satisfies FieldMessages

// The request nests the token's own fields, so their labels are keyed by
// the path `fieldErrors` reports them under — `api_user.name` — and the
// line lands beside the input that types it.
export const FIELD_LABELS = {
  ...IDENTITY_FIELD_LABELS,
  'api_user.name': () => $trans('Name'),
  'api_user.expire_start_dt': () => $trans('Valid from'),
  'api_user.expire_in_days': () => $trans('Expire in days'),
} satisfies FieldLabels

/** The line under an untouched token field: the same required line the validation shows. */
export const PLACEHOLDERS = { ...requiredMessages(FIELD_LABELS), 'api_user.expire_start_dt': FIELD_MESSAGES.api_user.expire_start_dt }

function toExpireInDays(value: number): number | undefined {
  return (value as unknown) === '' ? undefined : Number(value)
}

function payloadOf(values: ApiUserFormValues) {
  return {
    username: values.username,
    api_user: {
      name: values.name,
      // A cleared date input is `''`; left absent, the API starts the token
      // today (the column's default), which is what the prefilled today says.
      ...(values.expire_start_dt !== '' ? {expire_start_dt: values.expire_start_dt} : {}),
      expire_in_days: toExpireInDays(values.expire_in_days),
    },
  }
}

// An API user has no first/last/email half, so the contract takes its own
// values shape; the request nests the token's fields, so their errors key by
// that path — `api_user.name`.
export const { validate: validateApiUserForm, parse: parseApiUserForm } = userFormContract<
  typeof vApiUserRequestWritable, ApiUserFormValues, 'api_user.name' | 'api_user.expire_start_dt' | 'api_user.expire_in_days'
>({
  schema: vApiUserRequestWritable,
  messages: FIELD_MESSAGES,
  labels: FIELD_LABELS,
  payloadOf,
})
