import * as v from 'valibot'

/**
 * The emailed reset and verify links land on bare paths with user_id,
 * timestamp and signature in the query string. Both the set-password form and
 * the student-registration verify screen read them through here. The query
 * arrives as strings, so the schema coerces timestamp to the number the
 * generated request schemas demand. A failed parse means the link is
 * unusable. Callers fail fast with the generic error toast instead of posting
 * at an endpoint that answers 400.
 *
 * The source stays the route query. The table kit reads shared filter state
 * through useUrlSearchParams because back and forward rewrite it. These links
 * are read once from an email URL the router already parsed, so a second
 * reactive copy of the same query would only add a watcher the screens never
 * use.
 */
const linkParamsSchema = v.object({
  user_id: v.pipe(v.string(), v.minLength(1)),
  signature: v.pipe(v.string(), v.minLength(1)),
  timestamp: v.pipe(
    v.union([v.string(), v.number()]),
    v.transform((raw) => Number(raw)),
    v.check((value) => Number.isInteger(value) && value > 0, 'Expected integer'),
  ),
})

export type AccountLinkParams = v.InferOutput<typeof linkParamsSchema>

export function readLinkParams(query: Record<string, unknown>): AccountLinkParams | null {
  const result = v.safeParse(linkParamsSchema, {
    user_id: query.user_id,
    signature: query.signature,
    timestamp: query.timestamp,
  })

  if (!result.success) return null
  return result.output
}
