import { vStudentUserWriteRequestWritable } from '@/api/valibot.gen'
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

export type StudentUserFormValues = UserFormValues<typeof vStudentUserWriteRequestWritable>
export type StudentUserFieldErrors = UserFieldErrors<'dob' | 'mobile' | 'student_user'>

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
    mobile: () => $trans('Please provide a valid mobile'),
  },
} satisfies FieldMessages

/**
 * Only the inputs the schema cannot take as typed need shaping. `dob` is
 * nullish, so an untouched one rides as null; `iban` is optional-but-non-empty,
 * so an untouched one stays off; the mobile goes out normalized (the schema
 * wants E.164) while the input keeps what was typed.
 */
function payloadOf(values: StudentUserFormValues) {
  const { dob, iban, mobile, ...sub } = values.student_user
  return {
    ...values,
    student_user: {
      ...sub,
      dob: dob === '' ? null : dob,
      ...(iban ? { iban } : {}),
      mobile: normalizePhone(mobile ?? '') || null,
    },
  }
}

export const { validate: validateStudentUserForm, parse: parseStudentUserForm } = userFormContract<
  typeof vStudentUserWriteRequestWritable, StudentUserFormValues, 'dob' | 'mobile' | 'student_user'
>({
  schema: vStudentUserWriteRequestWritable,
  messages: FIELD_MESSAGES,
  payloadOf,
})
