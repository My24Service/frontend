
import {
  emptyUserIdentity,
  IDENTITY_FIELD_MESSAGES,
  userFormContract,
  type UserFieldErrors,
  type UserFormValues,
} from '../user-form'

export type CustomerUserFormValues = UserFormValues<typeof schemas.vCustomerUserRequestWritable>
export type CustomerUserFieldErrors = UserFieldErrors

export function emptyCustomerUser(): CustomerUserFormValues {
  return {
    ...emptyUserIdentity(),
    customer_user: {
      customer: null,
      settings_group: '',
    },
  }
}

export const FIELD_MESSAGES = IDENTITY_FIELD_MESSAGES

export const { validate: validateCustomerUserForm, parse: parseCustomerUserForm } = userFormContract({
  schema: schemas.vCustomerUserRequestWritable,
  messages: FIELD_MESSAGES,
})
