import { beforeEach, describe, expect, test, vi } from 'vitest'

import OrderTypesPie from '@/components/OrderTypesPie.vue'

import { mountForm, resetFakeHttp } from '../support/form-harness.js'
import { requestShapes } from '../support/request-recorder.js'

// Call-shape characterisation for the migrated stats call in OrderTypesPie.
//
// fillPieData() used to branch on the props and call
// OrderService.getOrderTypesStatsEquipment(pk) (GET
// `/order/order/order_types_stats/?equipment=${pk}`), getOrderTypesStatsLocation
// (pk) (same action, `?location=${pk}`) or getOrderTypesStatsBranch() (same
// action, no query). It now calls the @/models/orders/order-stats wrapper
// getOrderTypesStats({ equipment: Number(pk) }) / ({ location: Number(pk) }) /
// () - the generated endpoint is `/api/order/order/order_types_stats/` and the
// generated client serializes the filter object to the same query string.
// Number() normalizes a numeric or string pk; the wire query is a string
// either way. Body: none.

const fakeHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/services/api', () => ({ default: fakeHttp, normalClient: fakeHttp }))

vi.mock('@/api/client.gen', async () => {
  const { apiClientMock } = await import('../support/api-client-mock.js')
  return apiClientMock(fakeHttp)
})

beforeEach(() => {
  resetFakeHttp(fakeHttp, {
    '/order/order/order_types_stats/': { order_types_stats: { order_types: {} } },
  })
})

describe('OrderTypesPie', () => {
  test('loads unfiltered order-type stats when given no pk', async () => {
    mountForm(OrderTypesPie)
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalledTimes(1))

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      {
        method: 'get',
        path: '/api/order/order/order_types_stats/',
        query: {},
        body: undefined,
      },
    ])
  })

  test('filters by equipment when given equipmentPk', async () => {
    mountForm(OrderTypesPie, { props: { equipmentPk: 5 } })
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalledTimes(1))

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      {
        method: 'get',
        path: '/api/order/order/order_types_stats/',
        query: { equipment: '5' },
        body: undefined,
      },
    ])
  })

  test('filters by location when given a string locationPk, Number()-ed on the way in', async () => {
    mountForm(OrderTypesPie, { props: { locationPk: '7' } })
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalledTimes(1))

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      {
        method: 'get',
        path: '/api/order/order/order_types_stats/',
        query: { location: '7' },
        body: undefined,
      },
    ])
  })
})
