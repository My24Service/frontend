import * as v from 'valibot'

const linkParamsSchema = v.object({
  user_id: v.pipe(
    v.union([v.string(), v.number()]),
    v.transform((raw) => Number(raw)),
    v.check((value) => Number.isInteger(value) && value > 0, 'Expected integer'),
  ),
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
