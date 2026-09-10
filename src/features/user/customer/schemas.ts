import * as v from 'valibot'

import { vCustomerUserWritable } from '@/api/valibot.gen'
import { $trans } from '@/utils'

/**
 * Strengthenings for required fields — see ADR-0003 and member/README.md rules.
 *
 * Same shape as the sales/planning schemas, plus the customer link: the
 * legacy form left `customer_user.customer` null until the user picked a
 * customer from the autocomplete, so the link stays optional here and the
 * form validates only the identity fields plus the passwords.
 */

export const customerUserFormSchema = v.object({
  ...vCustomerUserWritable.entries,
  username: v.pipe(v.string(), v.minLength(1), v.maxLength(150)),
  email: v.pipe(v.string(), v.email(), v.maxLength(254)),
  first_name: v.pipe(v.string(), v.minLength(1), v.maxLength(150)),
  last_name: v.pipe(v.string(), v.minLength(1), v.maxLength(150)),
})

export interface CustomerUserFormValues {
  username: string
  first_name: string
  last_name: string
  email: string
  password1: string
  password2: string
  customer: number | null
  settings_group: string
}

export function emptyCustomerUser(): CustomerUserFormValues {
  return {
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password1: '',
    password2: '',
    customer: null,
    settings_group: '',
  }
}

export type CustomerUserFieldErrors = Partial<Record<
  'username' | 'first_name' | 'last_name' | 'email' | 'password1' | 'password2',
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
export function validateCustomerUserForm(
  values: CustomerUserFormValues,
  { isCreate }: { isCreate: boolean },
): CustomerUserFieldErrors {
  const result = v.safeParse(customerUserFormSchema, {
    username: values.username,
    email: values.email,
    first_name: values.first_name,
    last_name: values.last_name,
    customer_user: {
      customer: values.customer,
      settings_group: values.settings_group,
    },
  })

  const errors: CustomerUserFieldErrors = {}
  if (!result.success) {
    for (const issue of result.issues) {
      const field = issue.path?.[0]?.key as keyof CustomerUserFieldErrors | undefined
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

export function parseCustomerUserForm(
  values: CustomerUserFormValues,
  { isCreate, password }: { isCreate: boolean; password?: string },
): v.InferOutput<typeof customerUserFormSchema> {
  const parsed = v.parse(customerUserFormSchema, {
    username: values.username,
    email: values.email,
    first_name: values.first_name,
    last_name: values.last_name,
    customer_user: {
      customer: values.customer,
      settings_group: values.settings_group,
    },
  })
  // The confirm field never rides the wire; on create the legacy form copied
  // password1 into password, on edit it sent password only when filled.
  if (isCreate || password !== undefined) {
    return { ...parsed, password: (isCreate ? values.password1 : password) as string }
  }
  return parsed
}
