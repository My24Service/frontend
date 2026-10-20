import {
  emptyUserIdentity,
  IDENTITY_FIELD_MESSAGES,
  userFormContract,
  type UserFieldErrors,
  type UserFormValues,
} from '../user-form'

export type SalesUserFormValues = UserFormValues<typeof schemas.vSalesUserRequestWritable>
export type SalesUserFieldErrors = UserFieldErrors

export function emptySalesUser(): SalesUserFormValues {
  return {
    ...emptyUserIdentity(),
    sales_user: {
      uses_time_registration: false,
      contract_hours_week: '0.00',
    },
  }
}

export const FIELD_MESSAGES = IDENTITY_FIELD_MESSAGES

export const { validate: validateSalesUserForm, parse: parseSalesUserForm } = userFormContract({
  schema: schemas.vSalesUserRequestWritable,
  messages: FIELD_MESSAGES,
})
