import { describe, expect, test } from 'vitest'

import { orderViews } from '@/features/order/order/use-order-views'

/**
 * The order list's view control, as pure logic (src/features/order/order/
 * use-order-views.ts). Mounting is not needed to answer the only question that
 * matters here: which ONE view is active, and what the control offers.
 */

const FILTERS = [{id: 7, name: 'Mine'}, {id: 9, name: 'Urgent'}]

describe('orderViews', () => {
  test('offers All, Not accepted and every saved filter', () => {
    const {views} = orderViews({mode: 'all', mobile: false, filters: FILTERS, activeFilterId: null})

    expect(views.map((view) => view.label)).toEqual(['All', 'Not accepted', 'Mine', 'Urgent'])
  })

  test('the mobile lists offer no Not accepted view', () => {
    const {views} = orderViews({mode: 'all', mobile: true, filters: FILTERS, activeFilterId: null})

    expect(views.map((view) => view.label)).toEqual(['All', 'Mine', 'Urgent'])
  })

  test('exactly one view is active on the plain list', () => {
    expect(orderViews({mode: 'all', mobile: false, filters: FILTERS, activeFilterId: null}).active.id).toBe('all')
    expect(orderViews({mode: 'all', mobile: false, filters: FILTERS, activeFilterId: 7}).active.id).toBe('filter:7')
    expect(orderViews({mode: 'all', mobile: false, filters: FILTERS, activeFilterId: 7}).active.label).toBe('Mine')
  })

  test('the mode outranks the saved filter, which outranks the plain view', () => {
    // This ordering is what the pills could not express: the router marked All
    // active purely on a route-name match, whatever the filter said.
    expect(orderViews({mode: 'unaccepted', mobile: false, filters: FILTERS, activeFilterId: null}).active.id)
      .toBe('unaccepted')
    expect(orderViews({mode: 'unaccepted', mobile: false, filters: FILTERS, activeFilterId: 9}).active.id)
      .toBe('unaccepted')
    expect(orderViews({mode: 'all', mobile: false, filters: FILTERS, activeFilterId: 9}).active.id).toBe('filter:9')
  })

  test('a saved filter whose rows have not arrived yet falls back to the plain view', () => {
    expect(orderViews({mode: 'all', mobile: false, filters: [], activeFilterId: 7}).active.id).toBe('all')
  })

  test('a mode the control does not offer reads as the plain view, and stays a single active entry', () => {
    // The mobile dispatch lists reach their modes through the router.
    const {views, active} = orderViews({mode: 'dispatch', mobile: true, filters: FILTERS, activeFilterId: null})

    expect(active.id).toBe('all')
    expect(views.filter((view) => view.id === active.id)).toHaveLength(1)
  })
})
