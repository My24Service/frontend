/**
 * Times as they cross the form/wire boundary.
 *
 * The forms take `HH:mm` (or `H:mm`) and the serializers declare
 * `HH:mm:ss`, while the board shows the wire's `HH:mm:ss` back as `HH:mm` -
 * so both directions meet here rather than once per form.
 */

const SHORT_TIME = /^\d{1,2}:\d{2}$/

/**
 * An `HH:mm` the field hands over as the `HH:mm:ss` the wire takes: the hour
 * is padded (`8:00` to `08:00`) and the seconds are appended. Anything else
 * passes through for the validator to refuse.
 */
export function completeTime(value: string): string {
  return SHORT_TIME.test(value) ? `${value.padStart(5, '0')}:00` : value
}

/**
 * A wire `HH:mm:ss` back to the `HH:mm` a field or a cell shows: only the
 * hour and minute survive. A value with no colon is not a time at all - a
 * half-typed `08` the field must not hand on - so there is nothing to show.
 */
export function truncateTime(value: string | null | undefined): string | undefined {
  if (!value || value.indexOf(':') === -1) return undefined
  const parts = value.split(':')
  return `${parts[0]}:${parts[1]}`
}
