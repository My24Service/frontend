import { beforeEach, describe, expect, test } from 'vitest'

import BaseModel from '@/models/base'

let model

beforeEach(() => {
  model = new BaseModel()
  // listArgs is a class field, but it is mutated in place by addListArg, so make
  // sure each test starts from its own array.
  model.resetListArgs()
})

describe('BaseModel.getQueryArgs', () => {
  test('always includes the current page', () => {
    expect(model.getQueryArgs()).toEqual({ page: 1 })
  })

  test('reflects the current page', () => {
    model.currentPage = 3
    expect(model.getQueryArgs()).toEqual({ page: 3 })
  })

  test('includes the search query as q', () => {
    model.setSearchQuery('hello')
    expect(model.getQueryArgs()).toEqual({ page: 1, q: 'hello' })
  })

  test('setSearchQuery resets the page by default', () => {
    model.currentPage = 5
    model.setSearchQuery('hello')
    expect(model.getQueryArgs().page).toBe(1)
  })

  test('setSearchQuery keeps the page when reset is false', () => {
    model.currentPage = 5
    model.setSearchQuery('hello', false)
    expect(model.getQueryArgs().page).toBe(5)
  })

  test('includes user filter, sort and since', () => {
    model.setUserFilter(7)
    model.setSort('name')
    model.setSinceDate('2026-01-01')
    expect(model.getQueryArgs()).toEqual({
      page: 1,
      user_filter: 7,
      order_by: 'name',
      since: '2026-01-01',
    })
  })

  test('includes sort field and direction', () => {
    model.setSorting('created', 'desc')
    expect(model.getQueryArgs()).toEqual({
      page: 1,
      sort_field: 'created',
      sort_dir: 'desc',
    })
  })

  test('setSorting resets the page by default, and keeps it when told not to', () => {
    model.currentPage = 4
    model.setSorting('created', 'desc')
    expect(model.getQueryArgs().page).toBe(1)

    model.currentPage = 4
    model.setSorting('created', 'asc', false)
    expect(model.getQueryArgs().page).toBe(4)
  })

  test('merges a simple list arg', () => {
    model.addListArg('customer=12')
    expect(model.getQueryArgs()).toEqual({ page: 1, customer: '12' })
  })

  test('splits a list arg containing multiple assignments', () => {
    model.addListArg('customer=12&branch=3')
    expect(model.getQueryArgs()).toEqual({ page: 1, customer: '12', branch: '3' })
  })

  test('handles a mix of combined and single list args', () => {
    model.addListArg('customer=12&branch=3')
    model.addListArg('status=new')
    expect(model.getQueryArgs()).toEqual({
      page: 1,
      customer: '12',
      branch: '3',
      status: 'new',
    })
  })

  test('gives a valueless list arg an empty value', () => {
    model.addListArg('archived')
    expect(model.getQueryArgs()).toEqual({ page: 1, archived: '' })
  })

  test('keeps only the last value when a list arg is repeated', () => {
    // This is the accumulation bug the sanitisation exists to prevent:
    // without it the url grew a `page=1&page=1&page=1` tail.
    model.addListArg('page=1')
    model.addListArg('page=1')
    model.addListArg('customer=12')
    model.addListArg('customer=99')

    const args = model.getQueryArgs()
    expect(args).toEqual({ page: 1, customer: '99' })
  })

  test('query args win over a conflicting list arg', () => {
    model.currentPage = 2
    model.addListArg('page=99')
    expect(model.getQueryArgs().page).toBe(2)
  })

  // KNOWN LIMITATION, pinned deliberately: the split uses String.split('=', 2),
  // whose limit argument truncates rather than keeping the remainder, so a value
  // containing '=' loses everything from the second '=' onwards. Harmless for the
  // current callers (ids, dates, enum values); would bite a base64 or filter
  // value. Change this expectation if the splitting is ever fixed.
  test('a value containing "=" is truncated at the second "="', () => {
    model.addListArg('q=a=b')
    expect(model.getQueryArgs()).toEqual({ page: 1, q: 'a' })
  })

  test('is stable across repeated calls', () => {
    model.addListArg('customer=12')
    const first = model.getQueryArgs()
    const second = model.getQueryArgs()
    expect(second).toEqual(first)
  })

  test('removeListArg drops an arg', () => {
    model.addListArg('customer=12')
    model.addListArg('branch=3')
    model.removeListArg('customer=12')
    expect(model.getQueryArgs()).toEqual({ page: 1, branch: '3' })
  })

  test('setListArgs replaces all args', () => {
    model.addListArg('customer=12')
    model.setListArgs('branch=3')
    expect(model.getQueryArgs()).toEqual({ page: 1, branch: '3' })
  })
})
