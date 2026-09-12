import { vStudentUserWriteRequestWritable } from '@/api/valibot.gen'
import { type FieldMessages } from '@/features/forms/validation'
import {
  emptyUserIdentity,
  IDENTITY_FIELD_MESSAGES,
  userFormContract,
  type UserFieldErrors,
  type UserFormValues,
} from '../user-form'
import { $trans } from '@/services/i18n'

export type StudentUserFormValues = UserFormValues<typeof vStudentUserWriteRequestWritable>
export type StudentUserFieldErrors = UserFieldErrors<'dob' | 'student_user'>

export function emptyStudentUser(): StudentUserFormValues {
  return {
    ...emptyUserIdentity(),
    student_user: {
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
    },
  }
}

export const FIELD_MESSAGES = {
  ...IDENTITY_FIELD_MESSAGES,
  student_user: {
    dob: () => $trans('Please use yyyy-mm-dd for the date of birth'),
  },
} satisfies FieldMessages

/**
 * Only the two inputs the schema cannot take blank need shaping. `dob` is
 * nullish, so an untouched one rides as null; `iban` is optional-but-non-empty,
 * so an untouched one stays off.
 */
function payloadOf(values: StudentUserFormValues) {
  const { dob, iban, ...sub } = values.student_user
  return {
    ...values,
    student_user: {
      ...sub,
      dob: dob === '' ? null : dob,
      ...(iban ? { iban } : {}),
    },
  }
}

export const { validate: validateStudentUserForm, parse: parseStudentUserForm } = userFormContract<
  typeof vStudentUserWriteRequestWritable, StudentUserFormValues, 'dob' | 'student_user'
>({
  schema: vStudentUserWriteRequestWritable,
  messages: FIELD_MESSAGES,
  payloadOf,
})
