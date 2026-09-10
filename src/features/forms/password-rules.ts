import { $trans } from '@/services/i18n'

import type { FieldErrors } from './validation'

/**
 * The create/edit asymmetry the legacy password forms encoded in two
 * vuelidate blocks, shared by the seven user forms and the account
 * reset-password form.
 *
 * Neither field is a schema field: `password2` never rides the wire (it is the
 * old `sameAs` rule in new clothes), and `password1` reaches it under the name
 * `password`, only once the two agree — which is why the rule lives beside the
 * schemas rather than inside one.
 *
 * Lives in `forms/` rather than in either consumer: the user feature and the
 * account feature both need it, and the account forms must not import the user
 * feature.
 */

/** The two lines the rule can show. Thunks: `$trans` runs when a form asks. */
export const PASSWORD_MESSAGES = {
  password_required: () => $trans('Please enter a password'),
  passwords_mismatch: () => $trans('Passwords do not match'),
} as const

export interface PasswordValues {
  password1: string
  password2: string
}

/**
 * On create both passwords are required and must match; on edit they are
 * optional, but a filled first password still requires a matching confirm.
 *
 * A form that always requires a password — the account reset-password form —
 * is the create half of this rule, and passes `isCreate: true`.
 */
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
