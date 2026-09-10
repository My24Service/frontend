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

/** A **message tree**: a leaf thunk, or a subtree keyed by the next segment. */
export type FieldMessageTree = {
  [segment: string]: FieldMessage | FieldMessageTree | undefined
}

/**
 * A form's copy, keyed by field. A value may also be a subtree, which
 * addresses the message to a nested path: `{api_user: {name: msg}}` is the
 * copy for `api_user.name`.
 *
 * A request schema that nests a sub-object (`api_user`, `student_user`) needs
 * that: the leaf's message belongs beside the leaf's own input, and a tree
 * says so where a flat map could only name the sub-object's key.
 */
export type FieldMessages<K extends string = string> = Partial<
  Record<K, FieldMessage | FieldMessageTree>
>

export type FieldErrors<K extends string> = Partial<Record<K, string>>

/**
 * The deepest leaf `messages` can address for `path`, or `undefined` when
 * the tree stops short of it.
 *
 * Walks the path one segment at a time: a thunk ends the walk at the segment
 * it sits on, a subtree descends, and a segment the tree does not name ends
 * the walk with nothing.
 */
function deepestMessage(
  messages: FieldMessages,
  path: readonly string[],
): { key: string; message: FieldMessage } | undefined {
  let tree = messages
  for (const segment of path) {
    const entry = tree[segment]
    if (typeof entry === 'function') return { key: segment, message: entry }
    if (entry === undefined) return undefined
    tree = entry
  }
  return undefined
}

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
 * An issue is keyed by the deepest leaf the message tree maps for its path,
 * falling back to the first segment valibot blamed. A flat schema's messages
 * are all leaves on the first segment, so a flat schema keys exactly as it
 * always did; a nested tree keys the sub-object's failing leaves by their own
 * names, which is where their inputs are.
 *
 * Only the first issue per field is reported: the forms show one message
 * under one input, and valibot reports issues in pipe order, so the first is
 * the most specific complaint about what the user actually typed.
 */
export function fieldErrors<K extends string>(
  schema: v.GenericSchema,
  values: unknown,
  messages: FieldMessages = {},
): FieldErrors<K> {
  const result = v.safeParse(schema, values)
  if (result.success) return {}

  const errors: FieldErrors<K> = {}
  for (const issue of result.issues) {
    const path = (issue.path ?? []).map((segment) => String(segment.key))
    const leaf = deepestMessage(messages, path)
    const field = (leaf?.key ?? path[0]) as K | undefined
    if (field === undefined || errors[field] !== undefined) continue

    errors[field] = leaf ? leaf.message(issue) : String(issue.message)
  }
  return errors
}
