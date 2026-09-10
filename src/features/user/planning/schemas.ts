import * as v from 'valibot'

import { vPlanningUserRequestWritable } from '@/api/valibot.gen'
import { type FieldErrors, type FieldMessages } from '@/features/shared/form-validation'
import {
  requiredIdentity,
  usernameMessage,
  userFormErrors,
  USER_MESSAGES,
  withPassword,
  type UserIdentityValues,
} from '../user-form'
import { $trans } from '@/utils'

/**
 * The generated request schema with the three identity fields made required
 * (see requiredIdentity). Everything else is used as generated, including the
 * username charset regex and the `contract_hours_week` decimal regex.
 */
export const planningUserFormSchema = v.object({
  ...vPlanningUserRequestWritable.entries,
  ...requiredIdentity(vPlanningUserRequestWritable.entries),
})

/** The flat form state: the identity fields plus the `planning_user` sub-object. */
export interface PlanningUserFormValues extends UserIdentityValues {
  uses_time_registration: boolean
  contract_hours_week: string
}

export function emptyPlanningUser(): PlanningUserFormValues {
  return {
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password1: '',
    password2: '',
    uses_time_registration: false,
    contract_hours_week: '0.00',
  }
}

export type PlanningUserFieldErrors = FieldErrors<
  'username' | 'first_name' | 'last_name' | 'email' | 'password1' | 'password2'
  | 'contract_hours_week'
>

const MESSAGES = {
  ...USER_MESSAGES,
  email_invalid: () => $trans('Please enter a valid email'),
} as const

export const USERNAME_TAKEN_MESSAGE = MESSAGES.username_taken

export const FIELD_MESSAGES = {
  username: usernameMessage,
  first_name: MESSAGES.first_name_required,
  last_name: MESSAGES.last_name_required,
  email: MESSAGES.email_invalid,
  password1: MESSAGES.password_required,
  password2: MESSAGES.passwords_mismatch,
} satisfies FieldMessages<keyof PlanningUserFormValues & string>

/** The flat form state as the endpoint wants it: sub-object fields nested. */
function payloadOf(values: PlanningUserFormValues) {
  return {
    username: values.username,
    email: values.email,
    first_name: values.first_name,
    last_name: values.last_name,
    planning_user: {
      uses_time_registration: values.uses_time_registration,
      contract_hours_week: values.contract_hours_week,
    },
  }
}

export function validatePlanningUserForm(
  values: PlanningUserFormValues,
  options: { isCreate: boolean },
): PlanningUserFieldErrors {
  return userFormErrors(
    planningUserFormSchema, payloadOf(values), values, FIELD_MESSAGES, options,
  )
}

export function parsePlanningUserForm(
  values: PlanningUserFormValues,
  options: { isCreate: boolean; password?: string },
): v.InferOutput<typeof planningUserFormSchema> {
  return withPassword(v.parse(planningUserFormSchema, payloadOf(values)), values, options)
}
