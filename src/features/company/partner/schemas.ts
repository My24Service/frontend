import * as v from 'valibot'

import { vPartnerRequestRequest } from '@/api/valibot.gen'
import { fieldErrors, type FieldErrors } from '@/features/forms/validation'
import type { FieldLabels } from '@/features/forms/validated-form-context'
import { $trans } from '@/services/i18n'

/**
 * The new-request form's own state: the picked member's id, null until
 * chosen. The request's `from_member` is the sending tenant, which the
 * endpoint sets itself - the form never asks for it.
 */
export interface PartnerRequestFormValues {
  to_member: number | null
}

export type PartnerRequestFormErrors = FieldErrors<keyof PartnerRequestFormValues & string>

export function emptyPartnerRequest(): PartnerRequestFormValues {
  return { to_member: null }
}

export const FIELD_LABELS = {
  to_member: () => $trans('Member'),
} satisfies FieldLabels<keyof PartnerRequestFormValues & string>

/**
 * The wire-shaped body. `from_member` rides as null: the generated entry is
 * required-but-nullable, and the viewset overwrites it with the sending
 * tenant on create - the legacy screen sent the same null.
 */
function shaped(values: PartnerRequestFormValues) {
  return { from_member: null, to_member: values.to_member }
}

export function validatePartnerRequest(values: PartnerRequestFormValues): PartnerRequestFormErrors {
  return fieldErrors(vPartnerRequestRequest, shaped(values), {}, FIELD_LABELS)
}

/**
 * The body to send, as the generated create component resolves it.
 */
export function parsePartnerRequest(values: PartnerRequestFormValues) {
  return v.parse(vPartnerRequestRequest, shaped(values))
}
