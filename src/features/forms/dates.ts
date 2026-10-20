/**
 * Format a Date as the `YYYY-MM-DD` the DateFields expect — local-time
 * getters, not `toISOString()`, which reports the previous day for any
 * evening in CET.
 */
export function toApiDate(value: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

/**
 * The next working day: tomorrow, or Monday when tomorrow falls in the weekend.
 * Computed per call, so a session left open past midnight does not keep
 * handing out yesterday's tomorrow. The default date of a new order and of a
 * new purchase order.
 */
export function nextWorkingDay(from: Date = new Date()): Date {
  const date = new Date(from)
  date.setDate(date.getDate() + 1)
  if (date.getDay() === 0) date.setDate(date.getDate() + 1)
  else if (date.getDay() === 6) date.setDate(date.getDate() + 2)
  return date
}
