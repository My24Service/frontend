import { requiredMessage, type FieldErrors } from './validation'

/** The two lines the rule can show. Thunks: `$trans` runs when a form asks. */
export const PASSWORD_MESSAGES = {
  password_required: () => requiredMessage($trans('Password')),
  passwords_mismatch: () => $trans('Passwords do not match'),
} as const

export interface PasswordValues {
  password1: string
  password2: string
}

export function passwordErrors(
  values: PasswordValues,
  { isCreate }: { isCreate: boolean },
): FieldErrors<'password1' | 'password2'> {
  const errors: FieldErrors<'password1' | 'password2'> = {}

  if ((isCreate || values.password1 !== '') && values.password1 === '') {
    errors.password1 = PASSWORD_MESSAGES.password_required()
  }
  if (isCreate || values.password2 !== '' || values.password1 !== '') {
    if (values.password2 === '' || values.password2 !== values.password1) {
      errors.password2 = PASSWORD_MESSAGES.passwords_mismatch()
    }
  }

  return errors
}
