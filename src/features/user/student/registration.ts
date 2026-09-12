import * as v from 'valibot'

import { vAccountsRegisterCreateBody, vStudentSubWriteRequest } from '@/api/valibot.gen'
import { E164_PATTERN, normalizePhone } from '@/features/forms/phone'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

/**
 * The public registration form: a student signing themselves up, before any
 * account exists. It shares the student-user *endpoint body* with the staff
 * form (`POST /accounts/register/` takes the same `StudentUserWriteRequest`)
 * but not its contract: no username or password is asked — the email doubles
 * as the username and the password is set through the verification link —
 * and the address, mobile and introduction the staff form leaves optional are
 * required here.
 */
export type StudentRegistrationField =
  | 'email' | 'first_name' | 'last_name'
  | 'mobile' | 'street' | 'house_number' | 'postal' | 'city' | 'info'

export type StudentRegistrationErrors = FieldErrors<StudentRegistrationField>

const required = () => v.pipe(v.string(), v.minLength(1))

/**
 * The generated request body, tightened to what the registration asks for.
 * The generated entries stay the base so a field the API stops accepting
 * still fails here first.
 */
export const studentRegistrationSchema = v.object({
  ...vAccountsRegisterCreateBody.entries,
  student_user: v.object({
    ...vStudentSubWriteRequest.entries,
    // Checked on the normalized number (see `toWire`), so the user's own
    // formatting is never what fails.
    mobile: v.pipe(v.string(), v.regex(E164_PATTERN)),

    // Optional on the wire because the staff form shares this body; the
    // registration requires them — docs/schema-strengthenings.md, entry 12.
    street: required(),
    house_number: required(),
    postal: required(),
    city: required(),
    info: required(),
  }),
})

/**
 * The form binds the wire shape directly: nothing the registrant types is
 * client-only, so there is no flat "values" shape to translate from. The one
 * derived field, `username`, is filled in at parse time.
 */
export type StudentRegistrationValues = v.InferInput<typeof studentRegistrationSchema>
export type StudentRegistration = v.InferOutput<typeof studentRegistrationSchema>

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
 * The values as the wire takes them: the email doubles as the username, and
 * the mobile goes out normalized while the input keeps what was typed.
 * Nothing the form does not ask for rides — the legacy screen posted the
 * staff form's defaults for gender, driving licence and box truck on a
 * registrant's behalf, which no registrant ever chose.
 */
function toWire(values: StudentRegistrationValues): StudentRegistrationValues {
  return {
    ...values,
    username: values.email,
    student_user: { ...values.student_user, mobile: normalizePhone(values.student_user.mobile ?? '') },
  }
}

export function validateStudentRegistration(
  values: StudentRegistrationValues,
): StudentRegistrationErrors {
  return fieldErrors(studentRegistrationSchema, toWire(values), REGISTRATION_FIELD_MESSAGES)
}

export function parseStudentRegistration(values: StudentRegistrationValues): StudentRegistration {
  return v.parse(studentRegistrationSchema, toWire(values))
}
