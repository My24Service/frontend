
import {
  emptyUserIdentity,
  IDENTITY_FIELD_MESSAGES,
  userFormContract,
  type UserFieldErrors,
  type UserFormValues,
} from '../user-form'

export type EmployeeUserFormValues = UserFormValues<typeof schemas.vEmployeeUserRequestWritable>
export type EmployeeUserFieldErrors = UserFieldErrors

export function emptyEmployeeUser(): EmployeeUserFormValues {
  return {
    ...emptyUserIdentity(),
    employee_user: {
      contract_hours_week: '0.00',
      // The branch picker is empty rather than absent until chosen; the
      // generated entry is nullish, so `null` is the untouched state the wire
      // accepts.
      branch: null,
    },
  }
}

export const FIELD_MESSAGES = IDENTITY_FIELD_MESSAGES

export const { validate: validateEmployeeUserForm, parse: parseEmployeeUserForm } = userFormContract({
  schema: schemas.vEmployeeUserRequestWritable,
  messages: FIELD_MESSAGES,
})
