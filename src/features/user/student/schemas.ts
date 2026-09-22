import { vStudentUserWriteRequestWritable } from '@/api/valibot.gen'
import {
  normalizePhone,
  type FieldMessages,
  type FieldLabels,
} from '@/features/forms'
import {
  emptyUserIdentity,
  IDENTITY_FIELD_LABELS,
  IDENTITY_FIELD_MESSAGES,
  userFormContract,
  type UserFieldErrors,
  type UserFormValues,
} from '../user-form'
export type StudentUserFormValues = UserFormValues<typeof vStudentUserWriteRequestWritable>
export type StudentUserFieldErrors = UserFieldErrors<'student_user.dob' | 'student_user.mobile' | 'student_user'>

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
    // A shape the rule's line would not say.
    dob: () => $trans('Please use yyyy-mm-dd for the date of birth'),
  },
} satisfies FieldMessages

export const FIELD_LABELS = {
  ...IDENTITY_FIELD_LABELS,
  'student_user.mobile': () => $trans('Mobile'),
} satisfies FieldLabels

/**
 * Only the inputs the schema cannot take as typed need shaping. `dob` is
 * nullish, so an untouched one rides as null; `iban` is optional-but-non-empty,
 * so an untouched one stays off; the mobile goes out normalized (the schema
 * wants E.164 or blank) while the input keeps what was typed.
 */
function payloadOf(values: StudentUserFormValues) {
  const { dob, iban, mobile, ...sub } = values.student_user
  return {
    ...values,
    student_user: {
      ...sub,
      dob: dob === '' ? null : dob,
      ...(iban ? { iban } : {}),
      mobile: normalizePhone(mobile ?? '', '+31'),
    },
  }
}

export const { validate: validateStudentUserForm, parse: parseStudentUserForm } = userFormContract<
  typeof vStudentUserWriteRequestWritable, StudentUserFormValues, 'student_user.dob' | 'student_user.mobile' | 'student_user'
>({
  schema: vStudentUserWriteRequestWritable,
  messages: FIELD_MESSAGES,
  labels: FIELD_LABELS,
  payloadOf,
})
