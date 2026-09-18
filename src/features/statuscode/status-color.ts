import type { Statuscode } from '@/api/types.gen'

const DEFAULT_COLOR = '#ccc'

/**
 * The statuscode a record's `last_status` names.
 *
 * Prefer an exact match: a status is often the code followed by whatever text
 * the user appended (`"done left keys"`), but two codes can nest (`new` and
 * `new-order`), and only the exact match is right when the status is the code
 * itself. Failing that, the first code the status contains wins, in tenant
 * order, case-insensitively. The legacy helper built a RegExp from the code,
 * which the same text matched unless the code held a metacharacter.
 */
export function statuscodeFor(statuscodes: Statuscode[], status: string | null | undefined): Statuscode | null {
  if (!status) return null
  const exact = statuscodes.find((code) => code.statuscode === status)
  if (exact) return exact
  const haystack = status.toLowerCase()
  return statuscodes.find((code) => haystack.includes(code.statuscode.toLowerCase())) ?? null
}

/** The colour to draw a status in: the matched code's, `#`-prefixed, or grey. */
export function statusColor(statuscodes: Statuscode[], status: string | null | undefined): string {
  const color = statuscodeFor(statuscodes, status)?.color
  if (!color) return DEFAULT_COLOR
  return color.startsWith('#') ? color : `#${color}`
}
