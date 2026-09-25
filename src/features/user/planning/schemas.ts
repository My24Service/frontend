
import {
  emptyUserIdentity,
  IDENTITY_FIELD_MESSAGES,
  userFormContract,
  type UserFieldErrors,
  type UserFormValues,
} from '../user-form'

export type PlanningUserFormValues = UserFormValues<typeof schemas.vPlanningUserRequestWritable>
export type PlanningUserFieldErrors = UserFieldErrors

export function emptyPlanningUser(): PlanningUserFormValues {
  return {
    ...emptyUserIdentity(),
    planning_user: {
      uses_time_registration: false,
      contract_hours_week: '0.00',
    },
  }
}

export const FIELD_MESSAGES = IDENTITY_FIELD_MESSAGES

export const { validate: validatePlanningUserForm, parse: parsePlanningUserForm } = userFormContract({
  schema: schemas.vPlanningUserRequestWritable,
  messages: FIELD_MESSAGES,
})
