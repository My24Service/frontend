import * as v from 'valibot'

import { vAccountsRegisterCreateBody } from '@/api/valibot.gen'
import { normalizePhone } from '@/features/forms/phone'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

/**
 * The public registration form: a student signing themselves up, before any
 * account exists. `POST /accounts/register/` has its own request body — no
 * username or password (the backend derives the username from the email;
 * the password is set through the verification link) and the address,
 * mobile and introduction required — so the generated schema is the whole
 * contract and the form binds its input shape directly.
 */
export type StudentRegistrationValues = v.InferInput<typeof vAccountsRegisterCreateBody>
export type StudentRegistration = v.InferOutput<typeof vAccountsRegisterCreateBody>

export function emptyStudentRegistration(): StudentRegistrationValues {
  return {
    email: '',
    first_name: '',
    last_name: '',
    student_user: {
      mobile: '',
      street: '',
      house_number: '',
      house_number_addition: '',
      postal: '',
      city: '',
      country_code: 'NL',
      info: '',
    },
  }
}

export type StudentRegistrationField =
  | 'email' | 'first_name' | 'last_name'
  | 'mobile' | 'street' | 'house_number' | 'postal' | 'city' | 'info'

export type StudentRegistrationErrors = FieldErrors<StudentRegistrationField>

const MESSAGES = {
  email_invalid: () => $trans('Please provide a valid email'),
  first_name_required: () => $trans('Please provide your first name'),
  last_name_required: () => $trans('Please provide your last name'),
  mobile_invalid: () => $trans('Please provide a valid mobile'),
  street_required: () => $trans('Please provide your street'),
  house_number_required: () => $trans('Please provide your house number'),
  postal_required: () => $trans('Please provide your postal code'),
  city_required: () => $trans('Please provide your city'),
  info_required: () => $trans('Please tell us something about yourself'),
} as const

export const REGISTRATION_FIELD_MESSAGES = {
  email: MESSAGES.email_invalid,
  first_name: MESSAGES.first_name_required,
  last_name: MESSAGES.last_name_required,
  student_user: {
    mobile: MESSAGES.mobile_invalid,
    street: MESSAGES.street_required,
    house_number: MESSAGES.house_number_required,
    postal: MESSAGES.postal_required,
    city: MESSAGES.city_required,
    info: MESSAGES.info_required,
  },
} satisfies FieldMessages<'email' | 'first_name' | 'last_name' | 'student_user'>

/**
 * The values as the wire takes them: the mobile goes out normalized (the
 * schema wants E.164) while the input keeps what was typed.
 */
function toWire(values: StudentRegistrationValues): StudentRegistrationValues {
  return {
    ...values,
    student_user: { ...values.student_user, mobile: normalizePhone(values.student_user.mobile) },
  }
}

export function validateStudentRegistration(
  values: StudentRegistrationValues,
): StudentRegistrationErrors {
  return fieldErrors(vAccountsRegisterCreateBody, toWire(values), REGISTRATION_FIELD_MESSAGES)
}

export function parseStudentRegistration(values: StudentRegistrationValues): StudentRegistration {
  return v.parse(vAccountsRegisterCreateBody, toWire(values))
}
