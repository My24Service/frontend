import * as v from 'valibot'

/**
 * A field's copy. Called with the issue when a parse failed, and with nothing
 * by the templates, which show the same line as a hint under an untouched
 * input - so a message that varies by issue type must still answer sensibly
 * for `undefined` (the "what this field wants" phrasing).
 *
 * A thunk rather than a string because `$trans` must run when the form asks,
 * not when this module is imported.
 */
export type FieldMessage = (issue?: v.BaseIssue<unknown>) => string

export type FieldMessages<K extends string> = Partial<Record<K, FieldMessage>>

export type FieldErrors<K extends string> = Partial<Record<K, string>>

/**
 * Parse `values` and return the first message per failing field.
 *
 * This is where a field's copy belongs, not inside the schema. Putting it in
 * the schema means overriding the generated entry to attach it, and an
 * override replaces the whole generated pipe - which is how the three user
 * forms lost the username charset rule that `vSalesUserRequestWritable` and
 * its siblings declare. Keeping messages here lets every form parse the
 * generated schema unmodified.
 *
 * Only the first issue per field is reported: the forms show one message
 * under one input, and valibot reports issues in pipe order, so the first is
 * the most specific complaint about what the user actually typed.
 */
export function fieldErrors<K extends string>(
  schema: v.GenericSchema,
  values: unknown,
  messages: FieldMessages<K> = {},
): FieldErrors<K> {
  const result = v.safeParse(schema, values)
  if (result.success) return {}

  const errors: FieldErrors<K> = {}
  for (const issue of result.issues) {
    const field = issue.path?.[0]?.key as K | undefined
    if (field === undefined || errors[field] !== undefined) continue

    const message = messages[field]
    errors[field] = message ? message(issue) : String(issue.message)
  }
  return errors
}
