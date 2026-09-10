import * as v from 'valibot'

import { vEngineerRequestWritable } from '@/api/valibot.gen'
import { type FieldErrors, type FieldMessages } from '@/features/shared/form-validation'
import {
  usernameMessage,
  userFormErrors,
  USER_MESSAGES,
  withPassword,
  type UserIdentityValues,
} from '../user-form'
import { $trans } from '@/utils'

/**
 * This form adds nothing to `vEngineerRequestWritable` except the preferred
 * location (see `validateEngineerUserForm`). Since the six user serializers
 * gained `required: True, allow_blank: False` on email, first_name and
 * last_name, it declares everything else the form enforces: the identity
 * fields, the username charset regex, and the decimal regexes DRF coerces the
 * legacy form's digit strings with.
 */

/**
 * The flat form state: the identity fields plus the `engineer` sub-object's
 * fields as the form edits them. Flat rather than nested because each input
 * binds one field; `payloadOf` nests them again for the wire.
 */
export interface EngineerUserFormValues extends UserIdentityValues {
  mobile: string
  address: string
  postal: string
  city: string
  /** The form holds '' for unchosen; the payload maps it to absent. */
  country_code: string
  passport: string
  email_tablet: string
  vca: string
  cost_price: string
  license_plate: string
  contract_hours_week: string
  hourly_rate: string
  /** Read-only companion the record carries in for the PriceInput; the parse drops it again. */
  hourly_rate_currency?: string
  /** Null until a location is picked; the form refuses null (see `validateEngineerUserForm`). */
  preferred_location: number | null
  hide_from_dispatch: boolean
}

export function emptyEngineerUser(): EngineerUserFormValues {
  return {
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password1: '',
    password2: '',
    mobile: '',
    address: '',
    postal: '',
    city: '',
    country_code: '',
    passport: '',
    email_tablet: '',
    vca: '',
    cost_price: '0.00',
    license_plate: '',
    contract_hours_week: '38.00',
    hourly_rate: '0.00',
    hourly_rate_currency: 'EUR',
    preferred_location: null,
    hide_from_dispatch: false,
  }
}

export type EngineerUserFieldErrors = FieldErrors<
  'username' | 'first_name' | 'last_name' | 'email' | 'password1' | 'password2'
  | 'preferred_location'
>

const MESSAGES = {
  ...USER_MESSAGES,
  email_invalid: () => $trans('Please enter a valid email'),
  preferred_location_required: () => $trans('Please select a preferred location'),
} as const

export const USERNAME_TAKEN_MESSAGE = MESSAGES.username_taken

export const FIELD_MESSAGES = {
  username: usernameMessage,
  first_name: MESSAGES.first_name_required,
  last_name: MESSAGES.last_name_required,
  email: MESSAGES.email_invalid,
  password1: MESSAGES.password_required,
  password2: MESSAGES.passwords_mismatch,
  preferred_location: MESSAGES.preferred_location_required,
} satisfies FieldMessages<keyof EngineerUserFormValues & string>

/** The flat form state as the endpoint wants it: sub-object fields nested. */
function payloadOf(values: EngineerUserFormValues) {
  return {
    username: values.username,
    email: values.email,
    first_name: values.first_name,
    last_name: values.last_name,
    engineer: {
      mobile: values.mobile,
      address: values.address,
      postal: values.postal,
      city: values.city,
      // `country_code` is optional but not nullish: '' would fail its
      // minLength(1), so an unchosen country rides as absent.
      country_code: values.country_code === '' ? undefined : values.country_code,
      passport: values.passport,
      // An untouched tablet email is '' and would fail the email format the
      // entry declares; null is what "no tablet email" means on the wire.
      email_tablet: values.email_tablet === '' ? null : values.email_tablet,
      vca: values.vca,
      // A cleared decimal reads as '' in the input; null round-trips a record
      // that holds none, where '' would fail the decimal regex.
      cost_price: values.cost_price === '' ? null : values.cost_price,
      license_plate: values.license_plate,
      contract_hours_week: values.contract_hours_week === '' ? null : values.contract_hours_week,
      preferred_location: values.preferred_location,
      hourly_rate: values.hourly_rate,
      hide_from_dispatch: values.hide_from_dispatch,
    },
  }
}

export function validateEngineerUserForm(
  values: EngineerUserFormValues,
  options: { isCreate: boolean },
): EngineerUserFieldErrors {
  const errors = userFormErrors(
    vEngineerRequestWritable, payloadOf(values), values, FIELD_MESSAGES, options,
  )
  // The one rule the form adds to the schema: `preferred_location` stays
  // nullable on the wire (existing engineers predate it), but the form still
  // refuses an unchosen location, as the legacy form did. A form-level check
  // beside the parse, like the password rules in `../user-form.ts` — not a
  // redeclared entry — so codegen keeps everything underneath.
  if (values.preferred_location === null) {
    errors.preferred_location = FIELD_MESSAGES.preferred_location()
  }
  return errors
}

export function parseEngineerUserForm(
  values: EngineerUserFormValues,
  options: { isCreate: boolean; password?: string },
): v.InferOutput<typeof vEngineerRequestWritable> {
  return withPassword(v.parse(vEngineerRequestWritable, payloadOf(values)), values, options)
}
