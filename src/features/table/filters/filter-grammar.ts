/**
 * The column-filter wire grammar, as the backend's `apps/core/filters.py`
 * reads it — parsed into values the editors can bind to and described in
 * words a chip can show.
 *
 * Numbers: `25` exact; `18...80` an inclusive range, `18..80` an exclusive
 * one; a blank endpoint is open (`18...`, `...80`).
 *
 * Dates: `2026-09-15` a day, `2026-09` a month, `2026` a year — each names
 * the whole period — and the same `..`/`...` ranges over periods
 * (`2026-09...2026-10`, `2026-11...`).
 *
 * Selects: `a,b` any of the items, a comma inside an item written `\,`
 * (the backend's `ArrayFilter` and its `split_array_items`).
 *
 * Pure: no component state, no DOM. `describe*` reads the translation
 * catalogue for its few words.
 */
import { format } from 'date-fns'
import { $trans } from '@/services/i18n'

// ---------------------------------------------------------------- selects

/** The wire value of several picks: comma-joined, a comma inside a pick escaped. */
export function joinArrayItems(items: string[]): string {
  return items.map((item) => item.replace(/,/g, '\\,')).join(',')
}

/** The picks in a wire value; the mirror of `joinArrayItems`, and of the backend's split. */
export function splitArrayItems(raw: string): string[] {
  const items: string[] = []
  let current = ''
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i]
    if (char === '\\' && raw[i + 1] === ',') {
      current += ','
      i++
    } else if (char === ',') {
      items.push(current)
      current = ''
    } else {
      current += char
    }
  }
  items.push(current)
  return items.map((item) => item.trim()).filter((item) => item !== '')
}

// ---------------------------------------------------------------- numbers

export type NumberFilterValue =
  | {kind: 'exact'; value: string}
  | {kind: 'range'; low: string | null; high: string | null; inclusive: boolean}

function isNumber(raw: string): boolean {
  return raw.trim() !== '' && Number.isFinite(Number(raw))
}

/** Split on the first `...`, else the first `..` — the backend's own order. */
function splitRange(raw: string): {low: string; high: string; inclusive: boolean} | null {
  // '...' contains '..' - the inclusive spelling must be matched first.
  const separator = raw.includes('...') ? '...' : raw.includes('..') ? '..' : null
  if (!separator) return null
  const at = raw.indexOf(separator)
  return {
    low: raw.slice(0, at).trim(),
    high: raw.slice(at + separator.length).trim(),
    inclusive: separator === '...',
  }
}

/** `null` when the value is not something the backend would accept. */
export function parseNumberFilter(raw: string): NumberFilterValue | null {
  const value = raw.trim()
  if (value === '') return null
  const range = splitRange(value)
  if (!range) return isNumber(value) ? {kind: 'exact', value} : null

  const low = range.low === '' ? null : range.low
  const high = range.high === '' ? null : range.high
  if (low === null && high === null) return null
  if ((low !== null && !isNumber(low)) || (high !== null && !isNumber(high))) return null
  return {kind: 'range', low, high, inclusive: range.inclusive}
}

export function formatNumberFilter(value: NumberFilterValue): string {
  if (value.kind === 'exact') return value.value
  if (value.low === null && value.high === null) return ''
  return `${value.low ?? ''}${value.inclusive ? '...' : '..'}${value.high ?? ''}`
}

/** The chip's words for a number filter: `25`, `18 – 80`, `≥ 18`, `> 18`, ... */
export function describeNumberFilter(value: NumberFilterValue): string {
  if (value.kind === 'exact') return value.value
  const {low, high, inclusive} = value
  if (low !== null && high !== null) {
    return inclusive ? `${low} – ${high}` : `${low} – ${high} (${$trans('excl.')})`
  }
  if (low !== null) return `${inclusive ? '≥' : '>'} ${low}`
  return `${inclusive ? '≤' : '<'} ${high}`
}

// ------------------------------------------------------------------ dates

export type DatePrecision = 'day' | 'month' | 'year'

/** One `YYYY[-MM[-DD]]` on the wire: the whole day, month or year it names. */
export interface DatePeriod {
  precision: DatePrecision
  year: number
  /** 1-12; absent on a year. */
  month?: number
  /** Absent on a month or a year. */
  day?: number
}

export type DateFilterValue =
  | {kind: 'period'; period: DatePeriod}
  | {kind: 'range'; low: DatePeriod | null; high: DatePeriod | null; inclusive: boolean}

const PERIOD = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/

function parsePeriod(raw: string): DatePeriod | null {
  const match = PERIOD.exec(raw.trim())
  if (!match) return null
  const year = Number(match[1])
  if (match[2] === undefined) return {precision: 'year', year}
  const month = Number(match[2])
  if (month < 1 || month > 12) return null
  if (match[3] === undefined) return {precision: 'month', year, month}
  const day = Number(match[3])
  // Round-trip through Date to reject the 31st of a 30-day month.
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return {precision: 'day', year, month, day}
}

/** `null` when the value is not something the backend would accept. */
export function parseDateFilter(raw: string): DateFilterValue | null {
  const value = raw.trim()
  if (value === '') return null
  const range = splitRange(value)
  if (!range) {
    const period = parsePeriod(value)
    return period ? {kind: 'period', period} : null
  }
  const low = range.low === '' ? null : parsePeriod(range.low)
  const high = range.high === '' ? null : parsePeriod(range.high)
  if (range.low !== '' && low === null) return null
  if (range.high !== '' && high === null) return null
  if (low === null && high === null) return null
  return {kind: 'range', low, high, inclusive: range.inclusive}
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatPeriod(period: DatePeriod): string {
  if (period.precision === 'year') return String(period.year)
  if (period.precision === 'month') return `${period.year}-${pad(period.month!)}`
  return `${period.year}-${pad(period.month!)}-${pad(period.day!)}`
}

export function formatDateFilter(value: DateFilterValue): string {
  if (value.kind === 'period') return formatPeriod(value.period)
  if (value.low === null && value.high === null) return ''
  const low = value.low ? formatPeriod(value.low) : ''
  const high = value.high ? formatPeriod(value.high) : ''
  return `${low}${value.inclusive ? '...' : '..'}${high}`
}

/** The first day of the period, at local midnight. */
export function periodStart(period: DatePeriod): Date {
  return new Date(period.year, (period.month ?? 1) - 1, period.day ?? 1)
}

/** The last day of the period, at local midnight. */
export function periodEnd(period: DatePeriod): Date {
  if (period.precision === 'day') return periodStart(period)
  if (period.precision === 'month') return new Date(period.year, period.month!, 0)
  return new Date(period.year, 11, 31)
}

export function periodFromDate(date: Date, precision: DatePrecision): DatePeriod {
  if (precision === 'year') return {precision, year: date.getFullYear()}
  if (precision === 'month') return {precision, year: date.getFullYear(), month: date.getMonth() + 1}
  return {precision, year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate()}
}

/** The period in the app's date spelling: `15/09/2026`, `09/2026`, `2026`. */
export function describePeriod(period: DatePeriod): string {
  const pattern = period.precision === 'day' ? 'dd/MM/yyyy' : period.precision === 'month' ? 'MM/yyyy' : 'yyyy'
  return format(periodStart(period), pattern)
}

/** The chip's words for a date filter: `09/2026`, `01/09/2026 – 30/09/2026`, `from 09/2026`, ... */
export function describeDateFilter(value: DateFilterValue): string {
  if (value.kind === 'period') return describePeriod(value.period)
  const {low, high, inclusive} = value
  if (inclusive) {
    if (low && high) return `${describePeriod(low)} – ${describePeriod(high)}`
    if (low) return `${$trans('from')} ${describePeriod(low)}`
    return `${$trans('until')} ${describePeriod(high!)}`
  }
  const parts: string[] = []
  if (low) parts.push(`${$trans('after')} ${describePeriod(low)}`)
  if (high) parts.push(`${$trans('before')} ${describePeriod(high)}`)
  return parts.join(', ')
}
