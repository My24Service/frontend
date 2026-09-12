/**
 * Phone numbers as the wire takes them.
 *
 * A user types a number however they like — `+31 6 12345678`, `06-12345678`,
 * `(0)6 1234 5678` — and the form must neither refuse the formatting nor
 * send it: the API validates the stored form, and a valid number should not
 * be rejected over the spaces in it. So the payload normalizes silently and
 * the input keeps what was typed.
 *
 * Deliberately NL-first (a Belgian number arrives with its own country
 * code): a national number gets `+31`. The backend is the one that owns the
 * real rule; when it publishes an E.164 pattern this file loses nothing, the
 * generated schema simply starts checking what this already produces.
 */

/** E.164: a `+`, a non-zero first digit, 8–15 digits in all. */
export const E164_PATTERN = /^\+[1-9]\d{7,14}$/

const SEPARATORS = /[\s.()/-]/g

/**
 * Strip formatting, turn `00` and a national `0` into a country code, keep
 * an already-international number as it is. The bracketed trunk zero of
 * `+31 (0)6…` is dropped — it is the `0` a caller abroad must not dial —
 * while a leading `(0)6…` is the national form and keeps its zero. Anything
 * that is not a phone number (letters, a second `+`) comes back as typed,
 * for the validator to refuse.
 */
export function normalizePhone(raw: string, countryCode = '+31'): string {
  const trimmed = raw.trim()
  const international = trimmed.startsWith('+')
  const compact = (international ? trimmed.replace(/\(0\)/g, '') : trimmed).replace(SEPARATORS, '')
  if (compact === '') return ''
  if (international) return compact
  if (/^00\d/.test(compact)) return `+${compact.slice(2)}`
  if (/^0\d/.test(compact)) return `${countryCode}${compact.slice(1)}`
  return compact
}
