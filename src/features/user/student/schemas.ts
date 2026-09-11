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
  student_user: {
    dob: MESSAGES.dob_invalid,
  },
} satisfies FieldMessages<
  'username' | 'first_name' | 'last_name' | 'email' | 'password1' | 'password2' | 'student_user'
>

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
