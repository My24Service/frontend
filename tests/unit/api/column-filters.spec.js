import { describe, expect, test } from 'vitest'

import { columnFilters } from '@/api/resource-runtime.gen'

/**
 * `columnFilters` sends each filter as the wire type the generator read off
 * its OpenAPI parameter (`filterTypes`), and drops a value that type cannot
 * hold. A filter it is not told the type of goes as a string.
 */
const one = (value, type) => columnFilters({ page: 1, page_size: 20, f: value }, ['f'], type ? { f: type } : {}).f

describe('columnFilters', () => {
  test.each([
    ['7', 7], [7, 7], ['-3', -3], [' 7 ', 7],
    ['7.5', undefined], [7.5, undefined], [' ', undefined], ['abc', undefined],
    ['1e3', undefined], ['0x1F', undefined], [Number.NaN, undefined], [true, undefined],
  ])('integer %j -> %j', (value, wire) => {
    expect(one(value, 'integer')).toBe(wire)
  })

  test.each([
    ['7.5', 7.5], [7.5, 7.5], ['-.5', -0.5], ['7', 7],
    [' ', undefined], ['1e3', undefined], ['0x1F', undefined], [Number.POSITIVE_INFINITY, undefined],
  ])('number %j -> %j', (value, wire) => {
    expect(one(value, 'number')).toBe(wire)
  })

  test.each([
    [true, true], [false, false], ['true', true], ['false', false],
    ['True', true], ['FALSE', false], ['1', true], ['0', false],
    ['yes', undefined], [' ', undefined], [1, undefined],
  ])('boolean %j -> %j', (value, wire) => {
    expect(one(value, 'boolean')).toBe(wire)
  })

  test.each([
    ['7', '7'], [7, '7'], [true, 'true'], [' x ', ' x '],
  ])('untyped %j -> %j', (value, wire) => {
    expect(one(value)).toBe(wire)
  })

  test('drops an empty, object or array value whatever the type', () => {
    for (const type of [undefined, 'integer', 'boolean']) {
      for (const value of ['', {}, [], null, undefined]) expect(one(value, type)).toBeUndefined()
    }
  })

  test('sends only the named filters', () => {
    expect(columnFilters({ page: 1, page_size: 20, a: '1', b: '2' }, ['a'], { a: 'integer' })).toEqual({ a: 1 })
  })
})
