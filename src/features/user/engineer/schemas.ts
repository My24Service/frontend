import { vEngineerRequestWritable } from '@/api/valibot.gen'
import { normalizePhone } from '@/features/forms/phone'
import { type FieldMessages } from '@/features/forms/validation'
import {
  emptyUserIdentity,
  IDENTITY_FIELD_MESSAGES,
  userFormContract,
  type UserFieldErrors,
  type UserFormValues,
} from '../user-form'
import { $trans } from '@/services/i18n'

export type EngineerUserFormValues = UserFormValues<typeof vEngineerRequestWritable>
export type EngineerUserFieldErrors = UserFieldErrors<'mobile' | 'preferred_location'>

export function emptyEngineerUser(): EngineerUserFormValues {
  return {
    ...emptyUserIdentity(),
    engineer: {
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
      preferred_location: null,
      hide_from_dispatch: false,
    },
  }
}

export const FIELD_MESSAGES = {
  ...IDENTITY_FIELD_MESSAGES,
  engineer: {
    mobile: () => $trans('Please provide a valid mobile'),
    preferred_location: () => $trans('Please select a preferred location'),
  },
} satisfies FieldMessages

/**
 * Only the inputs the schema cannot take as typed need shaping. `country_code`
 * is optional but not nullish, so an unchosen country rides as absent;
 * `email_tablet` and the two decimals are nullish, so a cleared one rides as
 * null — '' would fail the format each entry declares; the mobile goes out
 * normalized (the schema wants E.164 or blank) while the input keeps what
 * was typed.
 */
function payloadOf(values: EngineerUserFormValues) {
  const { country_code, email_tablet, cost_price, contract_hours_week, mobile, ...sub } = values.engineer
  return {
    ...values,
    engineer: {
      ...sub,
      ...(country_code ? { country_code } : {}),
      email_tablet: email_tablet || null,
      cost_price: cost_price || null,
      contract_hours_week: contract_hours_week || null,
      mobile: normalizePhone(mobile ?? '', '+31'),
    },
  }
}

export const { validate: validateEngineerUserForm, parse: parseEngineerUserForm } = userFormContract<
  typeof vEngineerRequestWritable, EngineerUserFormValues, 'mobile' | 'preferred_location'
>({
  schema: vEngineerRequestWritable,
  messages: FIELD_MESSAGES,
  payloadOf,
  // The entry is nullish on the wire; the form requires a choice.
  check: (values, errors) => {
    if (values.engineer.preferred_location == null) {
      errors.preferred_location = FIELD_MESSAGES.engineer.preferred_location()
    }
  },
})
