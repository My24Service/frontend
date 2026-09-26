import * as v from 'valibot'

import {
  fieldErrors,
  SEND_FIELD_LABELS,
  SEND_FIELD_MESSAGES,
  sendableRecipients,
  sendableSubject,
} from '@/features/forms'

/**
 * The offer as it is sent: the generated create body, with the two rules
 * every "send by e-mail" form adds (a draft may be blank, a send needs
 * recipients and a subject - case 2 in docs/schema-strengthenings.md). The
 * PATCH of a stored offer sends the same whole body, so the create body is
 * the one to validate and parse.
 */
export const offerSendSchema = v.object({
  ...schemas.vOfferRequest.entries,
  recipients: sendableRecipients(schemas.vOfferRequest.entries.recipients),
  subject: sendableSubject(schemas.vOfferRequest.entries.subject),
})

export type OfferSendValues = v.InferInput<typeof offerSendSchema>

export function validateOffer(values: OfferSendValues) {
  return fieldErrors(offerSendSchema, values, SEND_FIELD_MESSAGES, SEND_FIELD_LABELS)
}
