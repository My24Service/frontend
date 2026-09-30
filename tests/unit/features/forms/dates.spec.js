import { describe, expect, test, vi } from 'vitest'

import { nextWorkingDay, toApiDate } from '@/features/forms'

describe('nextWorkingDay', () => {
  test('returns the next day on a weekday', () => {
    // Wednesday 2026-01-07 -> Thursday the 8th
    expect(toApiDate(nextWorkingDay(new Date(2026, 0, 7)))).toBe('2026-01-08')
  })

  test('skips Saturday to Monday', () => {
    // Friday 2026-01-09 -> tomorrow is Saturday -> Monday the 12th
    expect(toApiDate(nextWorkingDay(new Date(2026, 0, 9)))).toBe('2026-01-12')
  })

  test('skips Sunday to Monday', () => {
    // Saturday 2026-01-10 -> tomorrow is Sunday -> Monday the 12th
    expect(toApiDate(nextWorkingDay(new Date(2026, 0, 10)))).toBe('2026-01-12')
  })

  test('does not move the date it is given', () => {
    const from = new Date(2026, 0, 9)

    nextWorkingDay(from)

    expect(toApiDate(from)).toBe('2026-01-09')
  })

  test('is evaluated per call, not once at import', () => {
    // Computed at import time, a session open past midnight would keep
    // serving a stale date.
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date(2026, 0, 7, 23, 59))
      const before = toApiDate(nextWorkingDay())

      vi.setSystemTime(new Date(2026, 0, 8, 0, 1))
      const after = toApiDate(nextWorkingDay())

      expect(before).toBe('2026-01-08')
      expect(after).toBe('2026-01-09')
    } finally {
      vi.useRealTimers()
    }
  })
})
