import * as v from 'valibot'

export type FieldMessage = (issue?: v.BaseIssue<unknown>) => string

/** A **message tree**: a leaf thunk, or a subtree keyed by the next segment. */
export type FieldMessageTree = {
  [segment: string]: FieldMessage | FieldMessageTree | undefined
}

export type FieldMessages<K extends string = string> = Partial<
  Record<K, FieldMessage | FieldMessageTree>
>

export type FieldErrors<K extends string> = Partial<Record<K, string>>

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
