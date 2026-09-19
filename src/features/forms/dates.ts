/**
 * Format a Date as the `YYYY-MM-DD` the DateFields expect — local-time
 * getters, not `toISOString()`, which reports the previous day for any
 * evening in CET.
 */
export function toApiDate(value: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}
