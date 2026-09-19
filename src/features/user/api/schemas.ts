import { format } from 'date-fns'

import { vApiUserRequestWritable } from '@/api/valibot.gen'
import { type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import {
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
  username: IDENTITY_FIELD_MESSAGES.username,
  password1: IDENTITY_FIELD_MESSAGES.password1,
  password2: IDENTITY_FIELD_MESSAGES.password2,
  // The request nests the token's own fields, so their copy is addressed by
  // its path — `api_user.name` — and lands beside the input that types it.
  api_user: {
    name: () => $trans('Name is required'),
    expire_start_dt: () => $trans('Please enter date'),
    // The legacy form showed 'Name is required' under this input too (a
    // copy-paste slip); the converted form says what it wants.
    expire_in_days: () => $trans('Please enter the number of days'),
  },
} satisfies FieldMessages<'username' | 'password1' | 'password2' | 'api_user'>

function toExpireInDays(value: number): number | undefined {
  return (value as unknown) === '' ? undefined : Number(value)
}

function payloadOf(values: ApiUserFormValues) {
  return {
    username: values.username,
    api_user: {
      name: values.name,
      // A cleared date input is `''`; left absent, the API starts the token
      // now (the column's default), which is what the prefilled today says.
      ...(values.expire_start_dt !== '' ? {expire_start_dt: `${values.expire_start_dt}T00:00:00Z`} : {}),
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
  payloadOf,
})
