import * as v from 'valibot'

import { vStudentUserWriteRequestWritable } from '@/api/valibot.gen'
import { type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import {
  emptyUserIdentity,
  usernameMessage,
  userFormErrors,
  USER_MESSAGES,
  withPassword,
  type UserIdentityValues,
} from '../user-form'
import { $trans } from '@/services/i18n'

/**
 * This form adds nothing to `vStudentUserWriteRequestWritable` - see the sales
 * schema for what it carries on its own. That const is the request body of
 * `POST /api/company/studentuser/` (and of `PUT`, and of the register
 * endpoint the register follow-up will ride); the edit PATCHes through
 * `vPatchedStudentUserWriteRequestWritable`, whose entries are identical, so
 * the one parse serves both directions.
 *
 * `payloadOf` below shapes; it does not validate. Two inputs need shaping
 * because the wire is stricter than an empty input: `dob` is a nullish ISO
 * date, so an untouched input rides as null, and `iban` is optional with
 * `minLength(1)`, so an untouched input rides as absent - the legacy form
 * deleted it too. Everything else the form holds already parses: the
 * selects never leave their wire values, and every other sub-object entry
 * is nullish without a minimum, so a blank string rides as-is.
 *
 * `uses_time_registration`, `contract_hours_week`, `remarks`, `picture`,
 * `lon`/`lat` and the read-only companions (`uuid`, `rating_avg`,
 * `picture_url`) are not form state: the legacy normal form never rendered
 * them, and the register endpoint proves the backend mints valid students
 * without them, so the parse drops them and the backend defaults apply.
 */

/** The flat form state: the identity fields plus the `student_user` sub-object, held flat as strings. */
export interface StudentUserFormValues extends UserIdentityValues {
  street: string
  house_number: string
  house_number_addition: string
  postal: string
  city: string
  country_code: string
  mobile: string
  iban: string
  gender: string
  dob: string
  drivers_licence: string
  drivers_licence_type: string
  box_truck: string
  bsn: string
  info: string
}

export function emptyStudentUser(): StudentUserFormValues {
  return {
    ...emptyUserIdentity(),
    street: '',
    house_number: '',
    house_number_addition: '',
    postal: '',
    city: '',
    country_code: 'NL',
    mobile: '',
    iban: '',
    gender: 'M',
    dob: '',
    drivers_licence: 'N',
    drivers_licence_type: '',
    box_truck: 'N',
    bsn: '',
    info: '',
  }
}

export type StudentUserFieldErrors = FieldErrors<
  'username' | 'first_name' | 'last_name' | 'email' | 'password1' | 'password2'
  // A mistyped date of birth is the one sub-object failure the form has copy
  // for, and it is addressed by its path, so it is reported at the dob input
  // rather than under the sub-object's key. Any other sub-object failure has
  // no copy of its own and falls back to `student_user`, which the form
  // renders at the same input as a last resort.
  | 'dob' | 'student_user'
>

const MESSAGES = {
  ...USER_MESSAGES,
  email_invalid: () => $trans('Please enter a valid email'),
  dob_invalid: () => $trans('Please use yyyy-mm-dd for the date of birth'),
} as const

export const USERNAME_TAKEN_MESSAGE = MESSAGES.username_taken

export const FIELD_MESSAGES = {
  username: usernameMessage,
  first_name: MESSAGES.first_name_required,
  last_name: MESSAGES.last_name_required,
  email: MESSAGES.email_invalid,
  password1: MESSAGES.password_required,
  password2: MESSAGES.passwords_mismatch,
  // Addressed by its path (`student_user.dob`), so the message lands beside
  // the date-of-birth input instead of under the sub-object's key.
  student_user: {
    dob: MESSAGES.dob_invalid,
  },
} satisfies FieldMessages<
  'username' | 'first_name' | 'last_name' | 'email' | 'password1' | 'password2' | 'student_user'
>

/** The flat form state as the endpoint wants it: sub-object fields nested. */
export function payloadOf(values: StudentUserFormValues) {
  return {
    username: values.username,
    email: values.email,
    first_name: values.first_name,
    last_name: values.last_name,
    student_user: {
      street: values.street,
      house_number: values.house_number,
      house_number_addition: values.house_number_addition,
      postal: values.postal,
      city: values.city,
      country_code: values.country_code,
      mobile: values.mobile,
      dob: values.dob === '' ? null : values.dob,
      ...(values.iban === '' ? {} : { iban: values.iban }),
      gender: values.gender,
      drivers_licence: values.drivers_licence,
      drivers_licence_type: values.drivers_licence_type,
      box_truck: values.box_truck,
      bsn: values.bsn,
      info: values.info,
    },
  }
}

export function validateStudentUserForm(
  values: StudentUserFormValues,
  options: { isCreate: boolean },
): StudentUserFieldErrors {
  return userFormErrors(
    vStudentUserWriteRequestWritable, payloadOf(values), values, FIELD_MESSAGES, options,
  )
}

export function parseStudentUserForm(
  values: StudentUserFormValues,
  options: { isCreate: boolean; password?: string },
): v.InferOutput<typeof vStudentUserWriteRequestWritable> {
  return withPassword(v.parse(vStudentUserWriteRequestWritable, payloadOf(values)), values, options)
}
