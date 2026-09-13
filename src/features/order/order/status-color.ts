import type { Statuscode } from '@/api/types.gen'

const DEFAULT_COLOR = '#ccc'

/**
 * The statuscode an order's `last_status` names.
 *
 * A status is the code followed by whatever text the user appended
 * (`"done left keys"`), so the match is "the status contains the code",
 * case-insensitively — the first code that does wins, in tenant order. The
 * legacy helper built a RegExp from the code, which the same text matched
 * unless the code held a metacharacter.
 */
export function statuscodeFor(statuscodes: Statuscode[], status: string | null | undefined): Statuscode | null {
  if (!status) return null
  const haystack = status.toLowerCase()
  return statuscodes.find((code) => haystack.includes(code.statuscode.toLowerCase())) ?? null
}

/** The colour to draw a status in: the matched code's, `#`-prefixed, or grey. */
export function statusColor(statuscodes: Statuscode[], status: string | null | undefined): string {
  const color = statuscodeFor(statuscodes, status)?.color
  if (!color) return DEFAULT_COLOR
  return color.startsWith('#') ? color : `#${color}`
}
