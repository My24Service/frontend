import { describe, expect, test, vi } from 'vitest'

import { displayDurationFromSeconds, translateHoursField } from '@/features/field-service'
import { useUserHoursPivot } from '@/features/field-service'

/**
 * The day-field pivot, without a screen or a wire.
 *
 * `useUserHoursPivot` takes the duration formatter as a parameter, which is
 * what makes this suite possible: the contract it fixes is small and the two
 * Timesheet screens both sit on it. The formatter itself and the day-field
 * label map live in `hours-fields.ts` and are pinned here too.
 */

/** A formatter that records how it was called, so the calls are assertable. */
function spyFormatter() {
  const calls = []
  const formatter = vi.fn((seconds, excludeSeconds) => {
    calls.push([seconds, excludeSeconds])
    return `d(${seconds})`
  })
  return { calls, formatter }
}

describe('useUserHoursPivot.formatValue', () => {
  test('a duration cell renders through the caller\'s formatter, without seconds', () => {
    const { formatter } = spyFormatter()
    const { formatValue } = useUserHoursPivot(formatter)

    expect(formatValue(3600, 0, ['duration'])).toBe('d(3600)')
    expect(formatter).toHaveBeenCalledWith(3600, true)
  })

  test('the type is read at the cell\'s own index', () => {
    const { formatValue } = useUserHoursPivot((seconds) => `d(${seconds})`)

    expect(formatValue(3600, 1, ['number', 'duration'])).toBe('d(3600)')
    expect(formatValue('12.50', 0, ['number', 'duration'])).toBe('12.50')
  })

  test('every other type renders raw', () => {
    const { formatValue } = useUserHoursPivot(() => 'formatted')

    expect(formatValue('12.50', 0, ['number'])).toBe('12.50')
    expect(formatValue(7, 0, ['number'])).toBe(7)
  })

  test('a cell past the end of the type list renders raw rather than throwing', () => {
    const { formatValue } = useUserHoursPivot(() => 'formatted')

    expect(formatValue(7, 4, ['duration'])).toBe(7)
  })
})

describe('useUserHoursPivot.formatDays', () => {
  test('joins the days that carry a value, in day order', () => {
    const { formatDays } = useUserHoursPivot((seconds) => `d(${seconds})`)

    expect(formatDays([3600, 1800], ['duration', 'duration'])).toBe('d(3600) / d(1800)')
  })

  test('skips a zero or null day, and keeps the rest in place', () => {
    const { formatDays } = useUserHoursPivot((seconds) => `d(${seconds})`)

    expect(formatDays([0, 1800, null, 60], ['duration', 'duration', 'duration', 'duration']))
      .toBe('d(1800) / d(60)')
  })

  test('hands the formatter the cell\'s own index, not its position in the output', () => {
    const { calls, formatter } = spyFormatter()
    const { formatDays } = useUserHoursPivot(formatter)

    // The day that is skipped comes first, so a formatter handed the *output*
    // position would read the wrong type and render the duration as a raw 60.
    expect(formatDays([0, 999, 60], ['number', 'number', 'duration'])).toBe('999 / d(60)')
    expect(calls).toEqual([[60, true]])
  })

  test('a row with nothing in it renders as an empty string', () => {
    const { formatDays } = useUserHoursPivot(() => 'formatted')

    expect(formatDays([0, null], ['duration', 'duration'])).toBe('')
    expect(formatDays([], [])).toBe('')
  })

  test('a mixed row joins every kind of value through one separator', () => {
    const { formatDays } = useUserHoursPivot((seconds) => `d(${seconds})`)

    expect(formatDays([3600, '12.50', 0], ['duration', 'number', 'duration']))
      .toBe('d(3600) / 12.50')
  })

  test("composed with the shared formatter, it renders the grid's cells", () => {
    // The two screens never pass anything else: this is the pair every day
    // column is rendered through.
    const { formatDays, formatValue } = useUserHoursPivot(displayDurationFromSeconds)

    expect(formatDays([3600, 5400], ['duration', 'duration'])).toBe('1:00 / 1:30')
    expect(formatValue(5400, 0, ['duration'])).toBe('1:30')
    expect(formatValue('12.50', 0, ['number'])).toBe('12.50')
  })
})

describe('translateHoursField', () => {
  test('names every day field the endpoint sends', () => {
    expect(translateHoursField('work_total')).toBe('Work total')
    expect(translateHoursField('break_total')).toBe('Breaks total')
    expect(translateHoursField('travel_total')).toBe('Travel total')
    expect(translateHoursField('distance_total')).toBe('Distance total')
    expect(translateHoursField('extra_work')).toBe('Total extra work')
    expect(translateHoursField('actual_work')).toBe('Total actual work')
    expect(translateHoursField('unforeseen_work')).toBe('Total unforeseen work')
    expect(translateHoursField('distance_fixed_rate_amount')).toBe('Total trips')
  })

  test('a field it does not know falls back to the field name', () => {
    expect(translateHoursField('invented_later')).toBe('invented_later')
    expect(translateHoursField('')).toBe('')
  })
})

describe('displayDurationFromSeconds', () => {
  test('whole hours and the minutes of the same instant, seconds dropped', () => {
    expect(displayDurationFromSeconds(0, true)).toBe('0:00')
    expect(displayDurationFromSeconds(45, true)).toBe('0:00')
    expect(displayDurationFromSeconds(60, true)).toBe('0:01')
    expect(displayDurationFromSeconds(3600, true)).toBe('1:00')
    expect(displayDurationFromSeconds(3661, true)).toBe('1:01')
    expect(displayDurationFromSeconds(90000, true)).toBe('25:00')
  })

  test('seconds too, when the caller asks for them', () => {
    expect(displayDurationFromSeconds(45, false)).toBe('0:00:45')
    expect(displayDurationFromSeconds(3661, false)).toBe('1:01:01')
  })
})
