import * as v from 'valibot'

import {
  fieldErrors,
  type FieldMessages,
  type FieldLabels,
  SEND_FIELD_LABELS,
  SEND_FIELD_MESSAGES,
  sendableRecipients,
  sendableSubject,
} from '@/features/forms'

export const emailFormSchema = v.object({
  ...schemas.vInvoiceEmailRequest.entries,
  // Case 2: a draft may be blank, but sending requires valid recipients and a subject.
  recipients: sendableRecipients(schemas.vInvoiceEmailRequest.entries.recipients),
  subject: sendableSubject(schemas.vInvoiceEmailRequest.entries.subject),
})

export type EmailFormValues = v.InferInput<typeof emailFormSchema>
export type EmailField = keyof EmailFormValues

export const FIELD_MESSAGES = SEND_FIELD_MESSAGES satisfies FieldMessages<EmailField>
export const FIELD_LABELS = SEND_FIELD_LABELS satisfies FieldLabels<EmailField>

export function validateEmail(values: EmailFormValues) {
  return fieldErrors(emailFormSchema, values, FIELD_MESSAGES, FIELD_LABELS)
}
