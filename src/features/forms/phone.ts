/**
 * Phone numbers as the wire takes them.
 *
 * A user types a number however they like — `+31 6 12345678`, `06-12345678`,
 * `(0)6 1234 5678` — and the form must neither refuse the formatting nor
 * send it: the API validates the stored form, and a valid number should not
 * be rejected over the spaces in it. So the payload normalizes silently and
 * the input keeps what was typed.
 *
 * The country code is the caller's: a national number gets it, while a
 * number that already carries one (`+`, or `00`) keeps it. The backend owns
 * the rule — the generated `mobile` entries carry the E.164 regex — and
 * this produces what that regex checks.
 */

const SEPARATORS = /[\s.()/-]/g

/**
 * Strip formatting, turn `00` and a national `0` into a country code, keep
 * an already-international number as it is. The bracketed trunk zero of
 * `+31 (0)6…` is dropped — it is the `0` a caller abroad must not dial —
 * while a leading `(0)6…` is the national form and keeps its zero. Anything
 * that is not a phone number (letters, a second `+`) comes back as typed,
 * for the validator to refuse.
 */
export function normalizePhone(raw: string, countryCode: string): string {
  const trimmed = raw.trim()
  const international = trimmed.startsWith('+')
  const compact = (international ? trimmed.replace(/\(0\)/g, '') : trimmed).replace(SEPARATORS, '')
  if (compact === '') return ''
  if (international) return compact
  if (/^00\d/.test(compact)) return `+${compact.slice(2)}`
  if (/^0\d/.test(compact)) return `${countryCode}${compact.slice(1)}`
  return compact
}
