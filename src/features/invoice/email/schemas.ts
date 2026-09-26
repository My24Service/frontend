import * as v from 'valibot'

import {
  fieldErrors,
  requiredMessage,
  ruleMessage,
  type FieldMessages,
  type FieldLabels,
} from '@/features/forms'
export const tagValidator = (tag: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(tag)

export const emailFormSchema = v.object({
  ...schemas.vInvoiceEmailRequest.entries,
  // Case 2: a draft may be blank, but sending requires valid recipients and a subject.
  recipients: v.pipe(
    v.unwrap(schemas.vInvoiceEmailRequest.entries.recipients),
    v.check(value => value.length > 0 && value.split(',').every(tagValidator)),
  ),
  subject: v.pipe(v.unwrap(schemas.vInvoiceEmailRequest.entries.subject), v.check(value => value.trim().length > 0)),
})

export type EmailFormValues = v.InferInput<typeof emailFormSchema>
export type EmailField = keyof EmailFormValues

/**
 * Both fields are `check`s, whose issue says nothing a rule line could read:
 * the recipients must all be addresses, the subject blank-after-trim. The
 * over-long subject reads the rule's own line.
 */
export const FIELD_MESSAGES = {
  recipients: () => $trans('You must provide at least 1 valid email recipient'),
  subject: (issue) => issue?.type === 'max_length'
    ? ruleMessage(issue, FIELD_LABELS.subject())
    : requiredMessage(FIELD_LABELS.subject()),
} as const satisfies FieldMessages<EmailField>

export const FIELD_LABELS = {
  recipients: () => $trans('Email recipients'),
  subject: () => $trans('Subject'),
  body: () => $trans('Body'),
} as const satisfies FieldLabels<EmailField>

export function validateEmail(values: EmailFormValues) {
  return fieldErrors(emailFormSchema, values, FIELD_MESSAGES, FIELD_LABELS)
}
