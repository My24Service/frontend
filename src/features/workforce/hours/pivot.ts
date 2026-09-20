import moment from 'moment'
import type { Moment } from 'moment'

import { $trans } from '@/services/i18n'

/**
 * What the time-registration endpoint answers, turned into table rows.
 *
 * The endpoint does not answer a page of records: `TimeRegistrationListView.list`
 * builds a dict by hand - the totals per user and interval, the interval labels,
 * the list of dates the window covers, and (for a user window) that user's
 * worked hours and leave as two flat lists. Everything here is a pure function
 * of that dict, which is why it lives beside the screen rather than inside it.
 */

/**
 * One totals field of one row, as the endpoint nests it: `total` is the user's
 * whole-window figure, `interval_total` the figure for the one interval the row
 * belongs to.
 */
export interface TotalEntry {
  total: string | number
  interval_total?: string | number
}

/** A row of `totals`: one user, one interval, and one entry per totals field. */
export type TotalsRow = {
  user_id: string | number | null
  full_name: string
  interval: string | number
} & Record<string, TotalEntry>

export interface TimeRegistrationPayload {
  full_name?: string | null
  totals_fields: string[]
  totals: TotalsRow[]
  intervals: (string | number)[]
  date_list: string[]
  /** A user window only. */
  workhour_data?: WorkhourRow[]
  /** A user window only. */
  leave_data?: LeaveRow[]
}

export interface WorkhourRow {
  id: number
  source: string
  date?: string
  work_start?: string
  work_end?: string
  work_correction?: string
  travel_to?: string
  travel_back?: string
  distance_to?: number
  distance_back?: number
  project?: string | null
  description?: string | null
  [key: string]: unknown
}

export interface LeaveRow {
  id: number
  date?: string
  leave_duration?: string | number
  leave_type?: string | null
  [key: string]: unknown
}

export interface PivotField {
  key: string
  label: string
  thClass?: string
  sortable?: boolean
}

/** A list row: the user, one cell per date, and the window total. */
export interface UserPivotRow {
  user_id: string | number | null
  full_name: string
  total: string
  [field: string]: string | number | null
}

/** A detail row: one totals field, one cell per date, and its window total. */
export interface DetailPivotRow {
  field: string
  total: string
  [field_: string]: string | number | null
}

/** The window the screen shows, as the endpoint names it. */
export type WindowMode = 'week' | 'month' | 'year'

const TOTALS_FIELD_LABELS: Record<string, () => string> = {
  work_total: () => $trans('Work total'),
  break_total: () => $trans('Breaks total'),
  travel_total: () => $trans('Travel total'),
  distance_total: () => $trans('Distance total'),
  extra_work: () => $trans('Total extra work'),
  actual_work: () => $trans('Total actual work'),
  unforeseen_work: () => $trans('Total unforeseen work'),
  distance_fixed_rate_amount: () => $trans('Total trips'),
}

/** What a totals field is called, with the field name as the fallback. */
export function totalsFieldLabel(field: string): string {
  return TOTALS_FIELD_LABELS[field]?.() ?? field
}

/** The heading over the table: the window's totals fields, joined. */
export function totalsTitle(totalsFields: string[]): string {
  return totalsFields.map(totalsFieldLabel).join(' / ')
}

/**
 * What one date column is headed: the weekday and day in a week window, the
 * week number in a month window, the month in a year window.
 */
export function dateColumnLabel(dateIn: string, mode: WindowMode): string {
  const date = moment(dateIn)
  if (mode === 'week') return date.format('ddd DD')
  if (mode === 'month') return date.format('[week] W')
  return date.format('MM')
}

/** The date columns, one per date the window covers. */
export function dateColumns(dateList: string[], mode: WindowMode): PivotField[] {
  return dateList.map((dateIn, index) => ({
    key: `field${index}`,
    label: dateColumnLabel(dateIn, mode),
    sortable: true,
  }))
}

/** The intervals as moment objects, for the drill-down links in the cells. */
export function intervalMoments(dateList: string[]): Moment[] {
  return dateList.map((dateIn) => moment(dateIn))
}

/**
 * A cell's text: the field's totals for that interval, joined - the legacy
 * screen's rendering, which shows "8:00 | 0:15" when a window sums more than
 * one field.
 */
function cellText(entries: TotalEntry[]): string {
  const parts = entries
    .map((entry) => entry.total)
    .filter((total) => total !== null && total !== undefined && total !== '')
    .map((total) => String(total))
  return parts.length ? parts.join(' | ') : ''
}

/** One row per user, in the order the endpoint answered, cells per interval. */
export function userRows(payload: TimeRegistrationPayload): UserPivotRow[] {
  const seen = new Set<string | number | null>()
  const rows: UserPivotRow[] = []

  for (const entry of payload.totals) {
    if (seen.has(entry.user_id)) continue
    seen.add(entry.user_id)

    const row: UserPivotRow = {
      user_id: entry.user_id,
      full_name: entry.full_name,
      total: '',
    }

    payload.intervals.forEach((interval, index) => {
      const match = payload.totals.find((row_) => row_.user_id === entry.user_id && row_.interval === interval)
      // A cell is the interval's own total, where the row's total is the
      // window's - the endpoint nests both under the same field name.
      row[`field${index}`] = match
        ? cellText(payload.totals_fields
          .map((field) => ({total: match[field]?.interval_total, field}))
          .filter((cell) => cell.total !== undefined))
        : ''
    })

    row.total = cellText(payload.totals_fields.map((field) => entry[field]).filter(Boolean))
    rows.push(row)
  }

  return rows
}

/** One row per totals field, cells per interval - the drill-down table. */
export function detailRows(payload: TimeRegistrationPayload): DetailPivotRow[] {
  const rows: DetailPivotRow[] = []

  for (const field of payload.totals_fields) {
    const row: DetailPivotRow = {field: totalsFieldLabel(field), total: ''}

    payload.intervals.forEach((interval, index) => {
      const match = payload.totals.find((row_) => row_.user_id === payload.totals[0]?.user_id && row_.interval === interval)
      row[`field${index}`] = match?.[field]?.interval_total === undefined ? '' : String(match[field].interval_total)
    })

    const first = payload.totals[0]
    const total = first?.[field]?.total
    row.total = total === undefined || total === null ? '' : String(total)
    rows.push(row)
  }

  return rows
}
