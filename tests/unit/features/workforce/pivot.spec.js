import { describe, expect, test } from 'vitest'
import moment from 'moment'
import {
  dateColumnLabel,
  detailRows,
  totalsFieldLabel,
  totalsTitle,
  userRows,
} from '@/features/workforce/hours/pivot'

/**
 * The payload-to-rows transforms, on their own: no wire, no DOM. The endpoint
 * answers a dict rather than records, so this is where the shape of every
 * table this screen draws is decided.
 */
const DATES = ['2026-02-02', '2026-02-03', '2026-02-04']
const INTERVALS = [2, 3, 4]

function totalsRow(userId, interval, intervalTotal, total) {
  return {
    bucket: `${DATES[0]}T00:00:00Z`,
    full_name: 'Jan Jansen',
    user_id: userId,
    interval,
    work_total: {total, interval_total: intervalTotal},
  }
}

function payload(overrides = {}) {
  return {
    totals_fields: ['work_total'],
    totals: [
      totalsRow(7, 2, '8:00', '16:00'),
      totalsRow(7, 3, '4:00', '16:00'),
      totalsRow(9, 2, '0:00', '0:00'),
    ],
    intervals: INTERVALS,
    date_list: DATES,
    ...overrides,
  }
}

describe('dateColumnLabel', () => {
  test('a week window heads a column with the weekday and the day', () => {
    moment.locale('nl')
    expect(dateColumnLabel('2026-02-02', 'week')).toBe('ma. 02')
  })

  test('a month window heads a column with the week number', () => {
    expect(dateColumnLabel('2026-02-02', 'month')).toBe('week 6')
  })

  test('a year window heads a column with the month number', () => {
    expect(dateColumnLabel('2026-02-01', 'year')).toBe('02')
  })
})

describe('totalsFieldLabel', () => {
  test('names the field the screen knows', () => {
    expect(totalsFieldLabel('work_total')).toBe('Work total')
  })

  test('falls back to the field name for one it does not', () => {
    expect(totalsFieldLabel('something_new')).toBe('something_new')
  })

  test('joins the fields a window sums into one heading', () => {
    expect(totalsTitle(['work_total', 'travel_total'])).toBe('Work total / Travel total')
  })
})

describe('userRows', () => {
  test('one row per user, a cell per interval and the window total', () => {
    const rows = userRows(payload())

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({user_id: 7, full_name: 'Jan Jansen', field0: '8:00', field1: '4:00', field2: '', total: '16:00'})
    expect(rows[1]).toMatchObject({user_id: 9, field0: '0:00', total: '0:00'})
  })

  test('a user the endpoint repeated is one row', () => {
    const rows = userRows(payload({
      totals: [totalsRow(7, 2, '8:00', '8:00'), totalsRow(7, 2, '8:00', '8:00')],
    }))

    expect(rows).toHaveLength(1)
  })

  test('several totals fields in one window read side by side', () => {
    const rows = userRows({
      totals_fields: ['work_total', 'travel_total'],
      totals: [{
        full_name: 'Jan Jansen',
        user_id: 7,
        interval: 2,
        work_total: {total: '8:00', interval_total: '8:00'},
        travel_total: {total: '1:00', interval_total: '1:00'},
      }],
      intervals: [2],
      date_list: [DATES[0]],
    })

    expect(rows[0].field0).toBe('8:00 | 1:00')
    expect(rows[0].total).toBe('8:00 | 1:00')
  })
})

describe('detailRows', () => {
  test('one row per totals field, the user window cells and its total', () => {
    const rows = detailRows(payload())

    expect(rows).toEqual([
      {field: 'Work total', field0: '8:00', field1: '4:00', field2: '', total: '16:00'},
    ])
  })

  test('an empty payload draws no rows', () => {
    expect(detailRows({totals_fields: [], totals: [], intervals: [], date_list: []})).toEqual([])
  })
})
