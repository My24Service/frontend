import * as v from 'valibot'

import type { FieldLabels } from './validated-form-context'
import { requiredMessage, ruleMessage, type FieldMessages } from './validation'

/**
 * The rules a "send by e-mail" form (the invoice e-mail, the quotation offer)
 * adds on top of its generated request component. The component lets a draft
 * be blank - it is stored unsent - but sending needs somewhere to send it and
 * a subject. Case 2 in `docs/schema-strengthenings.md`.
 */

/** One address, as the recipients tag input accepts it. */
export const tagValidator = (tag: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(tag)

type NullishString = v.NullishSchema<v.GenericSchema<string, string>, undefined>

/** The comma-joined recipients entry: at least one, every one an address. */
export function sendableRecipients<TEntry extends NullishString>(entry: TEntry) {
  return v.pipe(
    v.unwrap(entry),
    v.check((value: string) => value.length > 0 && value.split(',').every(tagValidator)),
  )
}

/** The subject entry: present and not blank; the generated maximum stays underneath. */
export function sendableSubject<TEntry extends NullishString>(entry: TEntry) {
  return v.pipe(v.unwrap(entry), v.check((value: string) => value.trim().length > 0))
}

/** The labels of a "send by e-mail" form's three fields. */
export const SEND_FIELD_LABELS = {
  recipients: () => $trans('Email recipients'),
  subject: () => $trans('Subject'),
  body: () => $trans('Body'),
} as const satisfies FieldLabels<'recipients' | 'subject' | 'body'>

/**
 * Both rules are `check`s, whose issue says nothing a rule line could read:
 * the recipients must all be addresses, the subject blank-after-trim. The
 * over-long subject reads the rule's own line.
 */
export const SEND_FIELD_MESSAGES = {
  recipients: () => $trans('You must provide at least 1 valid email recipient'),
  subject: (issue) => issue?.type === 'max_length'
    ? ruleMessage(issue, SEND_FIELD_LABELS.subject())
    : requiredMessage(SEND_FIELD_LABELS.subject()),
} as const satisfies FieldMessages<'recipients' | 'subject'>
