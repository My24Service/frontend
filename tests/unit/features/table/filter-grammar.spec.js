import { describe, expect, test } from 'vitest'

import {
  describeDateFilter,
  describeNumberFilter,
  formatDateFilter,
  formatNumberFilter,
  joinArrayItems,
  parseDateFilter,
  parseNumberFilter,
  periodEnd,
  periodFromDate,
  periodStart,
  splitArrayItems,
} from '@/features/table/filters/filter-grammar'

/**
 * The column-filter wire grammar (src/features/table/filters/filter-grammar.ts).
 *
 * Every spelling here is one the backend's `apps/core/filters.py` accepts, so
 * the parse/format pairs below are the contract the chips and editors rely
 * on: whatever the editor emits must come back out of `parse*` unchanged, and
 * whatever a shared URL carries must describe as the words the chip shows.
 */

describe('select grammar', () => {
  // The mirror of the backend's `split_array_items`: `\,` is the one escape.
  test.each([
    [['a', 'b'], 'a,b'],
    [['Storing'], 'Storing'],
    [['Wacht, op onderdelen', 'Order completed'], 'Wacht\\, op onderdelen,Order completed'],
    [[], ''],
  ])('joins %j as %s and splits it back', (items, wire) => {
    expect(joinArrayItems(items)).toBe(wire)
    expect(splitArrayItems(wire)).toEqual(items)
  })

  test('a split drops blank items and keeps a lone backslash', () => {
    expect(splitArrayItems(' a , ,b ')).toEqual(['a', 'b'])
    expect(splitArrayItems('back\\slash,tail\\')).toEqual(['back\\slash', 'tail\\'])
  })
})

describe('number grammar', () => {
  test.each([
    ['25', {kind: 'exact', value: '25'}],
    ['-3.5', {kind: 'exact', value: '-3.5'}],
    ['18...80', {kind: 'range', low: '18', high: '80', inclusive: true}],
    ['18..80', {kind: 'range', low: '18', high: '80', inclusive: false}],
    ['18...', {kind: 'range', low: '18', high: null, inclusive: true}],
    ['...80', {kind: 'range', low: null, high: '80', inclusive: true}],
    ['..80', {kind: 'range', low: null, high: '80', inclusive: false}],
    [' 18 ... 80 ', {kind: 'range', low: '18', high: '80', inclusive: true}],
  ])('parses %s', (raw, expected) => {
    expect(parseNumberFilter(raw)).toEqual(expected)
  })

  test.each(['', '   ', 'abc', '18...abc', '...', '..', '1..2..3', 'NaN', 'Infinity'])(
    'rejects %j',
    (raw) => {
      expect(parseNumberFilter(raw)).toBeNull()
    },
  )

  test.each(['25', '18...80', '18..80', '18...', '...80'])('round-trips %s through format', (raw) => {
    expect(formatNumberFilter(parseNumberFilter(raw))).toBe(raw)
  })

  test('formats a range with both ends open as nothing', () => {
    expect(formatNumberFilter({kind: 'range', low: null, high: null, inclusive: true})).toBe('')
  })

  test.each([
    ['25', '25'],
    ['18...80', '18 – 80'],
    ['18..80', '18 – 80 (excl.)'],
    ['18...', '≥ 18'],
    ['18..', '> 18'],
    ['...80', '≤ 80'],
    ['..80', '< 80'],
  ])('describes %s as %s', (raw, words) => {
    expect(describeNumberFilter(parseNumberFilter(raw))).toBe(words)
  })
})

describe('date grammar', () => {
  test.each([
    ['2026-09-15', {kind: 'period', period: {precision: 'day', year: 2026, month: 9, day: 15}}],
    ['2026-09', {kind: 'period', period: {precision: 'month', year: 2026, month: 9}}],
    ['2026', {kind: 'period', period: {precision: 'year', year: 2026}}],
    ['2026-09...2026-10', {
      kind: 'range',
      low: {precision: 'month', year: 2026, month: 9},
      high: {precision: 'month', year: 2026, month: 10},
      inclusive: true,
    }],
    ['2026-09-01..2026-09-30', {
      kind: 'range',
      low: {precision: 'day', year: 2026, month: 9, day: 1},
      high: {precision: 'day', year: 2026, month: 9, day: 30},
      inclusive: false,
    }],
    ['2026-11...', {kind: 'range', low: {precision: 'month', year: 2026, month: 11}, high: null, inclusive: true}],
    ['...2026', {kind: 'range', low: null, high: {precision: 'year', year: 2026}, inclusive: true}],
  ])('parses %s', (raw, expected) => {
    expect(parseDateFilter(raw)).toEqual(expected)
  })

  test.each(['', 'sept', '2026-13', '2026-02-30', '2026-9-1', '15/09/2026', '...', '2026-09...abc'])(
    'rejects %j',
    (raw) => {
      expect(parseDateFilter(raw)).toBeNull()
    },
  )

  test.each(['2026-09-15', '2026-09', '2026', '2026-09...2026-10', '2026-09-01..2026-09-30', '2026-11...', '...2026'])(
    'round-trips %s through format',
    (raw) => {
      expect(formatDateFilter(parseDateFilter(raw))).toBe(raw)
    },
  )

  test.each([
    ['2026-09-15', '15/09/2026'],
    ['2026-09', '09/2026'],
    ['2026', '2026'],
    ['2026-09...2026-10', '09/2026 – 10/2026'],
    ['2026-09-01...2026-09-30', '01/09/2026 – 30/09/2026'],
    ['2026-11...', 'from 11/2026'],
    ['...2026', 'until 2026'],
    ['2026-09..2026-11', 'after 09/2026, before 11/2026'],
    ['2026-09..', 'after 09/2026'],
  ])('describes %s as %s', (raw, words) => {
    expect(describeDateFilter(parseDateFilter(raw))).toBe(words)
  })

  test('a period spans its first to its last day', () => {
    const month = {precision: 'month', year: 2026, month: 2}
    expect(periodStart(month)).toEqual(new Date(2026, 1, 1))
    expect(periodEnd(month)).toEqual(new Date(2026, 1, 28))

    const year = {precision: 'year', year: 2026}
    expect(periodStart(year)).toEqual(new Date(2026, 0, 1))
    expect(periodEnd(year)).toEqual(new Date(2026, 11, 31))

    const day = {precision: 'day', year: 2026, month: 9, day: 15}
    expect(periodStart(day)).toEqual(periodEnd(day))
  })

  test('a date narrows to the period of the precision asked for', () => {
    const date = new Date(2026, 8, 15)
    expect(periodFromDate(date, 'day')).toEqual({precision: 'day', year: 2026, month: 9, day: 15})
    expect(periodFromDate(date, 'month')).toEqual({precision: 'month', year: 2026, month: 9})
    expect(periodFromDate(date, 'year')).toEqual({precision: 'year', year: 2026})
  })
})
