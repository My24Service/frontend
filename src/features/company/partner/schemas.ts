import * as v from 'valibot'

import { vPartnerRequestRequest } from '@/api/valibot.gen'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
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

export const FIELD_MESSAGES = {
  to_member: () => $trans('Please select a member'),
} satisfies FieldMessages<keyof PartnerRequestFormValues & string>

/**
 * The wire-shaped body. `from_member` rides as null: the generated entry is
 * required-but-nullable, and the viewset overwrites it with the sending
 * tenant on create - the legacy screen sent the same null.
 */
function shaped(values: PartnerRequestFormValues) {
  return { from_member: null, to_member: values.to_member }
}

/**
 * A request needs its destination. The generated entry leaves `to_member`
 * nullable because stored rows predate the field; this form never submits
 * without one. The rule pipes a check onto the generated entry rather than
 * redeclaring it, so the integer underneath stays where codegen puts it -
 * and the issue reports on the field, which is what puts the message there.
 * A whole-form rule, not a contract gap.
 *
 * Slice-ledger case 2 (docs/schema-strengthenings.md) - the API must stay
 * lax about it, because existing rows carry the null.
 */
const toMemberRequired = v.pipe(
  vPartnerRequestRequest.entries.to_member,
  v.check((id) => id != null),
)

const partnerRequestFormSchema = v.object({
  ...vPartnerRequestRequest.entries,
  to_member: toMemberRequired,
})

export function validatePartnerRequest(values: PartnerRequestFormValues): PartnerRequestFormErrors {
  return fieldErrors(partnerRequestFormSchema, shaped(values), FIELD_MESSAGES)
}

/**
 * The body to send, as the generated create component resolves it.
 */
export function parsePartnerRequest(values: PartnerRequestFormValues) {
  return v.parse(vPartnerRequestRequest, shaped(values))
}
