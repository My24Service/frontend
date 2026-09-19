import { describe, expect, test } from 'vitest'

import { statusColor, statuscodeFor } from '@/features/statuscode/status-color'

const CODES = [
  { id: 1, statuscode: 'new', color: '#00ff00' },
  { id: 2, statuscode: 'new-order', color: 'ff0000' },
  { id: 3, statuscode: 'done', color: '#0000ff' },
]

describe('statuscodeFor', () => {
  test('an exact match beats a code that is merely a substring of the status', () => {
    expect(statuscodeFor(CODES, 'new-order')?.statuscode).toBe('new-order')
    expect(statuscodeFor(CODES, 'new')?.statuscode).toBe('new')
  })

  test('falls back to the code the status contains, for appended user text', () => {
    expect(statuscodeFor(CODES, 'done left keys')?.statuscode).toBe('done')
  })

  test('matches the fallback case-insensitively', () => {
    expect(statuscodeFor(CODES, 'DONE left keys')?.statuscode).toBe('done')
  })

  test('no status, or no code it names, yields null', () => {
    expect(statuscodeFor(CODES, null)).toBeNull()
    expect(statuscodeFor(CODES, '')).toBeNull()
    expect(statuscodeFor(CODES, 'invoiced')).toBeNull()
  })
})

describe('statusColor', () => {
  test('returns the matched code colour, hash-prefixed', () => {
    expect(statusColor(CODES, 'new')).toBe('#00ff00')
    expect(statusColor(CODES, 'new-order')).toBe('#ff0000')
  })

  test('adds the hash when the stored colour lacks it', () => {
    expect(statusColor(CODES, 'new-order')).toBe('#ff0000')
  })

  test('falls back to grey when nothing matches or the code has no colour', () => {
    expect(statusColor(CODES, 'invoiced')).toBe('#ccc')
    expect(statusColor([{ id: 4, statuscode: 'draft' }], 'draft')).toBe('#ccc')
  })
})
