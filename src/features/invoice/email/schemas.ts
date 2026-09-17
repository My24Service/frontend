import * as v from 'valibot'
import { vInvoiceEmailRequest } from '@/api/valibot.gen'
import { fieldErrors, type FieldMessages } from '@/features/forms/validation'
import type { FieldLabels } from '@/features/forms/validated-form-context'
import { $trans } from '@/services/i18n'

export const tagValidator = (tag: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(tag)

export const emailFormSchema = v.object({
  ...vInvoiceEmailRequest.entries,
  // Case 2: a draft may be blank, but sending requires valid recipients and a subject.
  recipients: v.pipe(
    v.unwrap(vInvoiceEmailRequest.entries.recipients),
    v.check(value => value.length > 0 && value.split(',').every(tagValidator)),
  ),
  subject: v.pipe(v.unwrap(vInvoiceEmailRequest.entries.subject), v.check(value => value.trim().length > 0)),
})

export type EmailFormValues = v.InferInput<typeof emailFormSchema>
export type EmailField = keyof EmailFormValues & string

export function emptyEmail(invoice: number): EmailFormValues {
  return {invoice, recipients: '', subject: '', body: ''}
}

export const FIELD_MESSAGES = {
  recipients: () => $trans('You must provide at least 1 valid email recipient'),
  subject: (issue) => issue?.type === 'max_length'
    ? $trans('Email subject must be at most 255 characters')
    : $trans('Please enter the email subject'),
} satisfies FieldMessages<EmailField>

export const FIELD_LABELS = {
  recipients: () => $trans('Email recipients'),
  subject: () => $trans('Subject'),
  body: () => $trans('Body'),
} satisfies FieldLabels<EmailField>

export function validateEmail(values: EmailFormValues) {
  return fieldErrors<EmailField>(emailFormSchema, values, FIELD_MESSAGES)
}
