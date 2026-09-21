import moment from 'moment'
import type { Moment } from 'moment'

import type { TimeRegistrationListResponse, TimeRegistrationTotalsRow } from '@/api/types.gen'
import { translateHoursField as totalsFieldLabel } from '@/features/field-service/timesheets/hours-fields'

/**
 * What the time-registration endpoint answers, turned into table rows.
 *
 * The endpoint does not answer a page of records: `TimeRegistrationListView.list`
 * builds a dict by hand - the totals per user and interval, the interval labels,
 * the list of dates the window covers, and (for a user window) that user's
 * worked hours and leave as two flat lists - and `openapi/schema.yaml` declares
 * it as `TimeRegistrationListResponse`. Everything here is a pure function of
 * that response, which is why it lives beside the screen rather than inside it.
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

/**
 * A row of `totals`, read through the field names `totals_fields` carries.
 *
 * The response types one row as a union of three shapes - a list row, a user
 * row and an engineer row - which differ in which totals fields they carry and
 * which all key a field on the `{total, interval_total}` pair. The screen draws
 * whatever `totals_fields` names, so a row is read here as that union plus the
 * field map the walk indexes; a field a row does not carry reads as absent.
 */
export type TotalsRow = TimeRegistrationTotalsRow & Record<string, TotalEntry>

/**
 * The response's totals rows, as that field map.
 *
 * The assertion is a reading rather than a claim about the wire: every variant
 * of the union declares only some of the fields, while `totals_fields` names
 * whichever ones the window sums, so the union type cannot be indexed by the
 * name the caller holds.
 */
function totalsRows(payload: TimeRegistrationListResponse): TotalsRow[] {
  return payload.totals as TotalsRow[]
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

/**
 * What a totals field is called, with the field name as the fallback.
 *
 * Owned by `field-service/timesheets/hours-fields`: the same eight keys label the
 * timesheet day fields there, so the map lives once and this module re-exports
 * it under the name this slice's screen already imports.
 */
export { totalsFieldLabel }

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
export function userRows(payload: TimeRegistrationListResponse): UserPivotRow[] {
  const seen = new Set<number | null>()
  const rows: UserPivotRow[] = []
  const totals = totalsRows(payload)

  for (const entry of totals) {
    if (seen.has(entry.user_id)) continue
    seen.add(entry.user_id)

    const row: UserPivotRow = {
      user_id: entry.user_id,
      full_name: entry.full_name,
      total: '',
    }

    payload.intervals.forEach((interval, index) => {
      const match = totals.find((row_) => row_.user_id === entry.user_id && row_.interval === interval)
      // A cell is the interval's own total, where the row's total is the
      // window's - the endpoint nests both under the same field name.
      row[`field${index}`] = match
        ? cellText(payload.totals_fields.flatMap((field) => {
          const intervalTotal = match[field]?.interval_total
          return intervalTotal === undefined ? [] : [{total: intervalTotal, field}]
        }))
        : ''
    })

    row.total = cellText(payload.totals_fields.map((field) => entry[field]).filter(Boolean))
    rows.push(row)
  }

  return rows
}

/** One row per totals field, cells per interval - the drill-down table. */
export function detailRows(payload: TimeRegistrationListResponse): DetailPivotRow[] {
  const rows: DetailPivotRow[] = []
  const totals = totalsRows(payload)

  for (const field of payload.totals_fields) {
    const row: DetailPivotRow = {field: totalsFieldLabel(field), total: ''}

    payload.intervals.forEach((interval, index) => {
      const match = totals.find((row_) => row_.user_id === totals[0]?.user_id && row_.interval === interval)
      row[`field${index}`] = match?.[field]?.interval_total === undefined ? '' : String(match[field].interval_total)
    })

    const first = totals[0]
    const total = first?.[field]?.total
    row.total = total === undefined || total === null ? '' : String(total)
    rows.push(row)
  }

  return rows
}
