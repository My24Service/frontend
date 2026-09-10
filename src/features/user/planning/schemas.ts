import * as v from 'valibot'

import { vPlanningUserWritable } from '@/api/valibot.gen'
import { $trans } from '@/utils'

/**
 * Strengthenings for required fields — see ADR-0003 and member/README.md rules.
 *
 * Same shape as the sales schemas: the generated create body accepts blanks
 * the legacy vuelidate `required` rules rejected, so the form adds
 * minLength(1) to username and the names, and an email check the legacy form
 * enforced with vuelidate's `email`. Passwords are create-only client fields
 * (see below); the probe verdict arrives separately (see
 * ../use-username-probe.ts).
 */

export const planningUserFormSchema = v.object({
  ...vPlanningUserWritable.entries,
  username: v.pipe(v.string(), v.minLength(1), v.maxLength(150)),
  email: v.pipe(v.string(), v.email(), v.maxLength(254)),
  first_name: v.pipe(v.string(), v.minLength(1), v.maxLength(150)),
  last_name: v.pipe(v.string(), v.minLength(1), v.maxLength(150)),
})

export interface PlanningUserFormValues {
  username: string
  first_name: string
  last_name: string
  email: string
  password1: string
  password2: string
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

export type PlanningUserFieldErrors = Partial<Record<
  'username' | 'first_name' | 'last_name' | 'email' | 'password1' | 'password2'
  | 'contract_hours_week',
  string
>>

const MESSAGES = {
  username_required: () => $trans('Username is required'),
  username_taken: () => $trans('Username is already in use'),
  first_name_required: () => $trans('Please enter a first name'),
  last_name_required: () => $trans('Please enter a last name'),
  email_invalid: () => $trans('Please enter a valid email'),
  password_required: () => $trans('Please enter a password'),
  passwords_mismatch: () => $trans('Passwords do not match'),
} as const

export const USERNAME_TAKEN_MESSAGE = MESSAGES.username_taken

export const FIELD_MESSAGES = {
  username: MESSAGES.username_required,
  first_name: MESSAGES.first_name_required,
  last_name: MESSAGES.last_name_required,
  email: MESSAGES.email_invalid,
  password1: MESSAGES.password_required,
  password2: MESSAGES.passwords_mismatch,
} as const

/**
 * The create/edit asymmetry the legacy form encoded in two vuelidate blocks:
 * on create both passwords are required and must match; on edit they are
 * optional, but a filled first password still requires a matching confirm.
 */
export function validatePlanningUserForm(
  values: PlanningUserFormValues,
  { isCreate }: { isCreate: boolean },
): PlanningUserFieldErrors {
  const result = v.safeParse(planningUserFormSchema, {
    username: values.username,
    email: values.email,
    first_name: values.first_name,
    last_name: values.last_name,
    planning_user: {
      uses_time_registration: values.uses_time_registration,
      contract_hours_week: values.contract_hours_week,
    },
  })

  const errors: PlanningUserFieldErrors = {}
  if (!result.success) {
    for (const issue of result.issues) {
      const field = issue.path?.[0]?.key as keyof PlanningUserFieldErrors | undefined
      if (!field || errors[field]) continue
      if (field === 'username') errors.username = MESSAGES.username_required()
      else if (field === 'email') errors.email = MESSAGES.email_invalid()
      else if (field === 'first_name') errors.first_name = MESSAGES.first_name_required()
      else if (field === 'last_name') errors.last_name = MESSAGES.last_name_required()
      else errors[field] = String(issue.message)
    }
  }

  if (isCreate || values.password1 !== '') {
    if (values.password1 === '') {
      errors.password1 = MESSAGES.password_required()
    }
  }
  if (isCreate || values.password2 !== '' || values.password1 !== '') {
    if (values.password2 === '' || values.password2 !== values.password1) {
      errors.password2 = MESSAGES.passwords_mismatch()
    }
  }

  return errors
}

export function parsePlanningUserForm(
  values: PlanningUserFormValues,
  { isCreate, password }: { isCreate: boolean; password?: string },
): v.InferOutput<typeof planningUserFormSchema> {
  const parsed = v.parse(planningUserFormSchema, {
    username: values.username,
    email: values.email,
    first_name: values.first_name,
    last_name: values.last_name,
    planning_user: {
      uses_time_registration: values.uses_time_registration,
      contract_hours_week: values.contract_hours_week,
    },
  })
  // The confirm field never rides the wire; on create the legacy form copied
  // password1 into password, on edit it sent password only when filled.
  if (isCreate || password !== undefined) {
    return { ...parsed, password: (isCreate ? values.password1 : password) as string }
  }
  return parsed
}
