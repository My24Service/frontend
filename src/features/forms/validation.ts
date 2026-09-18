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
 * The recurring two-message field: one copy when the value is missing,
 * another when it is present but too long. Covers a `v.pipe(v.string(),
 * v.minLength(1), v.maxLength(n))`-shaped entry, which is most of the
 * required text fields across the schemas — the thunks stay lazy so
 * `$trans` runs at call time, not at module load.
 */
export function requiredOrMaxLength(required: () => string, tooLong: () => string): FieldMessage {
  return (issue?: v.BaseIssue<unknown>) => (issue?.type === 'max_length' ? tooLong() : required())
}

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
