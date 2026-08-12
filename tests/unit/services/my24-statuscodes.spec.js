import { describe, expect, test } from 'vitest'

import my24 from '@/services/my24'

const DEFAULT_COLOR = '#ccc'
const DEFAULT_TEXT_COLOR = '#000'

const statuscodes = [
  { statuscode: 'new', color: 'ff0000', text_color: '000000' },
  { statuscode: 'in progress', color: '#00ff00', text_color: '#ffffff' },
  { statuscode: 'done', color: null, text_color: null },
]

describe('my24.status2color', () => {
  test('returns the default colour when there is no status', () => {
    expect(my24.status2color(statuscodes, null)).toBe(DEFAULT_COLOR)
    expect(my24.status2color(statuscodes, '')).toBe(DEFAULT_COLOR)
  })

  test('returns the default text colour when there is no status', () => {
    expect(my24.status2color(statuscodes, null, true)).toBe(DEFAULT_TEXT_COLOR)
  })

  test('prefixes a colour that is missing its #', () => {
    expect(my24.status2color(statuscodes, 'new')).toBe('#ff0000')
  })

  test('leaves an already-prefixed colour alone', () => {
    expect(my24.status2color(statuscodes, 'in progress')).toBe('#00ff00')
  })

  test('returns the text colour when asked', () => {
    expect(my24.status2color(statuscodes, 'new', true)).toBe('#000000')
    expect(my24.status2color(statuscodes, 'in progress', true)).toBe('#ffffff')
  })

  test('matches case-insensitively', () => {
    expect(my24.status2color(statuscodes, 'NEW')).toBe('#ff0000')
  })

  test('matches on a substring, because the statuscode is used as a regex', () => {
    // The lookup builds `new RegExp(statuscode.statuscode, 'i')` and tests the
    // status against it, so any status containing 'new' matches.
    expect(my24.status2color(statuscodes, 'brand new order')).toBe('#ff0000')
  })

  test('falls back to the default when a matched statuscode has no colour', () => {
    expect(my24.status2color(statuscodes, 'done')).toBe(DEFAULT_COLOR)
    expect(my24.status2color(statuscodes, 'done', true)).toBe(DEFAULT_TEXT_COLOR)
  })

  test('returns the default for an unknown status', () => {
    expect(my24.status2color(statuscodes, 'cancelled')).toBe(DEFAULT_COLOR)
  })

  test('returns the default for an empty statuscode list', () => {
    expect(my24.status2color([], 'new')).toBe(DEFAULT_COLOR)
  })
})

describe('my24.getStatuscode', () => {
  test('returns the matching statuscode object', () => {
    expect(my24.getStatuscode(statuscodes, 'new')).toBe(statuscodes[0])
  })

  test('returns null without a status', () => {
    expect(my24.getStatuscode(statuscodes, null)).toBeNull()
  })

  test('returns null without statuscodes', () => {
    expect(my24.getStatuscode(null, 'new')).toBeNull()
    expect(my24.getStatuscode(undefined, 'new')).toBeNull()
  })

  test('returns null for an unknown status', () => {
    expect(my24.getStatuscode(statuscodes, 'cancelled')).toBeNull()
  })
})

describe('my24.getStatuscodeColor', () => {
  test('prefixes a bare colour', () => {
    expect(my24.getStatuscodeColor({ color: 'abcdef' })).toBe('#abcdef')
  })

  test('returns defaults for a missing statuscode', () => {
    expect(my24.getStatuscodeColor(null)).toBe(DEFAULT_COLOR)
    expect(my24.getStatuscodeColor(null, true)).toBe(DEFAULT_TEXT_COLOR)
  })

  test('returns defaults when the colour is absent', () => {
    expect(my24.getStatuscodeColor({ color: null })).toBe(DEFAULT_COLOR)
    expect(my24.getStatuscodeColor({ text_color: null }, true)).toBe(DEFAULT_TEXT_COLOR)
  })
})

describe('my24.getStatuscodeForOrder', () => {
  test('prefers order_status', () => {
    const order = { order_status: 'new', last_status: 'done', assignedorder_status: 'done' }
    expect(my24.getStatuscodeForOrder(statuscodes, order)).toBe(statuscodes[0])
  })

  test('falls back to last_status', () => {
    const order = { order_status: null, last_status: 'in progress', assignedorder_status: null }
    expect(my24.getStatuscodeForOrder(statuscodes, order)).toBe(statuscodes[1])
  })

  test('falls back to assignedorder_status', () => {
    const order = { order_status: null, last_status: null, assignedorder_status: 'done' }
    expect(my24.getStatuscodeForOrder(statuscodes, order)).toBe(statuscodes[2])
  })

  test('returns null when nothing matches', () => {
    const order = { order_status: null, last_status: null, assignedorder_status: null }
    expect(my24.getStatuscodeForOrder(statuscodes, order)).toBeNull()
  })

  // DEAD BRANCH, pinned deliberately. src/services/my24.js has:
  //
  //   if (statuscode && statuscode.color_for_assignedorders || order.assignedorder_status === null) {
  //     return statuscode
  //   }
  //
  // At that point `statuscode` is provably null (both earlier lookups returned
  // null, or we would have returned already), so the first operand is always
  // false and the whole branch reduces to `if (order.assignedorder_status === null)
  // return null`, which is what the final lookup would return anyway. The
  // `color_for_assignedorders` flag therefore has no effect at all. These tests
  // record the current behaviour so the branch can be removed or repaired
  // deliberately rather than by accident.
  test('color_for_assignedorders has no effect on the outcome', () => {
    const flagged = [{ statuscode: 'done', color: '#111', color_for_assignedorders: true }]
    const order = { order_status: null, last_status: null, assignedorder_status: 'done' }

    // Same result with and without the flag.
    expect(my24.getStatuscodeForOrder(flagged, order)).toBe(flagged[0])
    expect(my24.getStatuscodeForOrder([{ statuscode: 'done', color: '#111' }], order).statuscode)
      .toBe('done')
  })
})
