import * as v from 'valibot'

import type { StudentUserRegisterRequest } from '@/api/types.gen'
import { vAccountsRegisterCreateBody } from '@/api/valibot.gen'
import { normalizePhone } from '@/features/forms'
import type { FieldLabels } from '@/features/forms'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms'
import { $trans } from '@/services/i18n'

/**
 * The public registration form: a student signing themselves up, before any
 * account exists. `POST /accounts/register/` has its own request body — no
 * username or password (the backend derives the username from the email;
 * the password is set through the verification link) and the address,
 * mobile and introduction required — so the generated schema is the whole
 * contract and the form binds its input shape directly.
 */
export function emptyStudentRegistration(): StudentUserRegisterRequest {
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

/** The error keys: each field by its whole path on the form object. */
export type StudentRegistrationField =
  | 'email' | 'first_name' | 'last_name'
  | 'student_user.mobile' | 'student_user.street' | 'student_user.house_number'
  | 'student_user.postal' | 'student_user.city' | 'student_user.info'

export type StudentRegistrationErrors = FieldErrors<StudentRegistrationField>

/**
 * The names the fields bind under. The six nested fields are named relative to
 * the `student_user` provider, so their labels are their own names rather than
 * the path the error is keyed by.
 */
type StudentRegistrationLabel =
  | 'email' | 'first_name' | 'last_name'
  | 'mobile' | 'street' | 'house_number' | 'postal' | 'city' | 'info'

/**
 * The one line the rules cannot say under a label: the info field's label
 * is a prompt rather than a noun, so its required line is its own.
 */
export const REGISTRATION_FIELD_MESSAGES = {
  student_user: {
    info: () => $trans('Please tell us something about yourself'),
  },
} satisfies FieldMessages<'email' | 'first_name' | 'last_name' | 'student_user'>

/**
 * The nine labels the two nested providers read: the outer trio and the six
 * fields under `student_user`.
 */
export const FIELD_LABELS = {
  email: () => $trans('Email'),
  first_name: () => $trans('First name'),
  last_name: () => $trans('Last name'),
  mobile: () => $trans('Mobile'),
  street: () => $trans('Street'),
  house_number: () => $trans('House nr./addition'),
  postal: () => $trans('Postal'),
  city: () => $trans('City'),
  info: () => $trans('Tell something about yourself'),
} satisfies FieldLabels<StudentRegistrationLabel>

/**
 * The values as the wire takes them: the mobile goes out normalized (the
 * schema wants E.164) while the input keeps what was typed.
 */
function toWire(values: StudentUserRegisterRequest): StudentUserRegisterRequest {
  return {
    ...values,
    student_user: { ...values.student_user, mobile: normalizePhone(values.student_user.mobile, '+31') },
  }
}

export function validateStudentRegistration(
  values: StudentUserRegisterRequest,
): StudentRegistrationErrors {
  return fieldErrors(vAccountsRegisterCreateBody, toWire(values), REGISTRATION_FIELD_MESSAGES, FIELD_LABELS)
}

export function parseStudentRegistration(values: StudentUserRegisterRequest): StudentUserRegisterRequest {
  return v.parse(vAccountsRegisterCreateBody, toWire(values))
}
