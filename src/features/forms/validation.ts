import * as v from 'valibot'

import type { FieldLabels } from './validated-form-context'

export type FieldMessage = (issue?: v.BaseIssue<unknown>) => string

/** A **message tree**: a leaf thunk, or a subtree keyed by the next segment. */
export type FieldMessageTree = {
  [segment: string]: FieldMessage | FieldMessageTree | undefined
}

export type FieldMessages<K extends PropertyKey = string> = {
  [P in Extract<K, string>]?: FieldMessage | FieldMessageTree
}

export type FieldErrors<K extends PropertyKey = string> =
  TF.Simplify<Partial<Record<Extract<K, string>, string>>>

/**
 * The fields a schema's errors can be keyed by. A bare `GenericSchema` names
 * none, so its errors fall back to any string key.
 */
export type SchemaField<S extends v.GenericSchema> =
  unknown extends v.InferInput<S> ? string : TF.Paths<NonNullable<v.InferInput<S>>>

/**
 * A settings-style key made readable: `order_entry_status` becomes
 * "Order entry status". Shared by the statuscode roles and the member
 * settings labels, which were the same split-capitalize written twice.
 */
export function humanizeKey(key: string): string {
  const words = key.split('_').filter(Boolean).join(' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * A label as it reads mid-sentence: "Customer ID" becomes "customer ID",
 * while "VAT number" and "E-mail" keep their capital because the second
 * character is not a lower-case letter.
 */
function inSentence(label: string): string {
  return /^[A-Z][a-z]/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label
}

/**
 * The article a noun takes: "an order type", "a customer". The letter test
 * covers the labels this application has; the two sets cover the words whose
 * first letter lies about their sound — "user" opens with a vowel and reads as
 * a consonant, "hour" the other way round. The label arrives already
 * translated, so the article follows the language actually on screen.
 */
const CONSONANT_SOUND = new Set(['user', 'users', 'username', 'unit', 'url', 'utility'])
const VOWEL_SOUND = new Set(['hour', 'hours', 'honest', 'honour'])

function articleFor(label: string): string {
  const word = (label.trim().split(/\s+/)[0] ?? '').toLowerCase()
  if (VOWEL_SOUND.has(word)) return 'an'
  if (CONSONANT_SOUND.has(word)) return 'a'
  return /^[aeiou]/.test(word) ? 'an' : 'a'
}

/**
 * The line a text field shows when it is left empty: the one template every
 * "Please enter a …" used to spell per field. Exported because a few forms
 * check emptiness outside the schema (the order form's role-dependent
 * address) and want the same line.
 *
 * The article is spelled into the template and not into the label, so a
 * translator still reads a sentence whose placeholder is the noun alone. A
 * language whose article does not depend on the noun's opening sound
 * translates the two templates to the same line.
 */
export function requiredMessage(label: string): string {
  const field = inSentence(label)
  return interpolate(
    articleFor(field) === 'an' ? $trans('Please enter an %(field)s') : $trans('Please enter a %(field)s'),
    { field },
  )
}

/** The same for a picker, list or file: chosen rather than typed. */
export function selectMessage(label: string): string {
  const field = inSentence(label)
  return interpolate(
    articleFor(field) === 'an' ? $trans('Please select an %(field)s') : $trans('Please select a %(field)s'),
    { field },
  )
}

/**
 * The required line for each labelled field, as thunks: what a template
 * shows under an untouched input before validation has run. Built from the
 * labels so the placeholder and the error read the same.
 */
export function requiredMessages<L extends FieldLabels, K extends Extract<keyof L, string> = Extract<keyof L, string>>(
  labels: L,
): TF.Simplify<Record<K, () => string>> {
  const out = {} as Record<K, () => string>
  for (const [key, label] of Object.entries(labels) as [K, (() => string) | undefined][]) {
    if (label) out[key] = () => requiredMessage(label())
  }
  return out
}

/**
 * The copy for an issue no form-specific message claims: one line per
 * valibot rule, with the field's label interpolated where the line needs
 * one. A form only writes its own message where the rule alone cannot say
 * what is wrong (a time that must read HH:mm, a company code that must be
 * unique), so most fields carry no copy at all and read their line from here.
 *
 * valibot's own message functions cannot do this: they run when the leaf
 * schema raises the issue, before the enclosing object prepends the path,
 * so they never see which field they speak for.
 */
export function ruleMessage(issue: v.BaseIssue<unknown>, label: string): string {
  const n = { n: String(issue.requirement) }
  const empty = issue.input === '' || (Array.isArray(issue.input) && issue.input.length === 0)
  switch (issue.type) {
    case 'non_empty':
      return Array.isArray(issue.input) ? selectMessage(label) : requiredMessage(label)
    case 'min_length':
      // Nothing entered at all is "required", whatever the minimum is.
      if (Array.isArray(issue.input)) return selectMessage(label)
      if (issue.requirement === 1 || empty) return requiredMessage(label)
      return interpolate($trans('Please use at least %(n)s characters'), n)
    case 'max_length':
      return interpolate($trans('Please use at most %(n)s characters'), n)
    case 'min_value':
      return interpolate($trans('Please enter a value of at least %(n)s'), n)
    case 'max_value':
      return interpolate($trans('Please enter a value of at most %(n)s'), n)
    case 'integer':
      return $trans('Please enter a whole number')
    case 'email':
      return $trans('Please enter a valid email')
    case 'url':
      return $trans('Please enter a website')
  }
  if (issue.kind === 'schema') {
    // A picker left on null or its empty option; a list or enum given nothing.
    if (issue.received === 'null' || issue.type === 'picklist' || issue.type === 'enum' || issue.type === 'array') {
      return selectMessage(label)
    }
    // A text field the values never set, or left empty.
    if (issue.received === 'undefined' || issue.received === '""') return requiredMessage(label)
    // A number input whose text did not parse.
    if (issue.received === 'NaN') return $trans('Please enter a number')
  }
  return interpolate($trans('Please enter a valid %(field)s'), { field: inSentence(label) })
}

/**
 * The recurring two-message field: one copy when the value is missing,
 * another when it is present but too long. Kept for the forms that still
 * spell both lines; a field with no message of its own gets the same two
 * lines from `ruleMessage`.
 */
export function requiredOrMaxLength(required: () => string, tooLong: () => string): FieldMessage {
  return (issue?: v.BaseIssue<unknown>) => (issue?.type === 'max_length' ? tooLong() : required())
}

function deepestMessage(
  messages: FieldMessages,
  path: readonly string[],
): { key: string; message: FieldMessage } | undefined {
  let tree = messages
  for (const [index, segment] of path.entries()) {
    const entry = tree[segment]
    if (typeof entry === 'function') {
      // The key is the field's whole path, not its last segment: a nested
      // `student_user.mobile` and a top-level `mobile` are different fields,
      // and keying both as `mobile` lets one shadow the other.
      return { key: path.slice(0, index + 1).join('.'), message: entry }
    }
    if (entry === undefined) return undefined
    tree = entry
  }
  return undefined
}

/**
 * What to call the field in a rule's line: the form's label for its whole
 * path, else for its last segment, else the key made readable. The last
 * is the English fallback for a form that has not named the field yet.
 */
function labelOf(labels: FieldLabels, path: readonly string[]): string {
  const last = path[path.length - 1] ?? ''
  const label = labels[path.join('.')] ?? labels[last]
  return label ? label() : humanizeKey(last)
}

export function fieldErrors<S extends v.GenericSchema, K extends PropertyKey = SchemaField<S>>(
  schema: S,
  values: unknown,
  messages: FieldMessages = {},
  labels: FieldLabels = {},
): FieldErrors<K> {
  const result = v.safeParse(schema, values)
  if (result.success) return {} as FieldErrors<K>

  const errors = {} as FieldErrors<K>
  for (const issue of result.issues) {
    const path = (issue.path ?? []).map((segment) => String(segment.key))
    const leaf = deepestMessage(messages, path)
    // With no message to name the field, the issue's own path is the field.
    const field = (leaf?.key ?? (path.length ? path.join('.') : undefined)) as Extract<K, string> | undefined
    if (field === undefined || errors[field] !== undefined) continue

    errors[field] = leaf ? leaf.message(issue) : ruleMessage(issue, labelOf(labels, path))
  }
  return errors
}
