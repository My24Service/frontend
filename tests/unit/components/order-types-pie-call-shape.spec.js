import { beforeEach, describe, expect, test } from 'vitest'

import OrderTypesPie from '@/components/OrderTypesPie.vue'

import { vOrderOrderOrderTypesStatsRetrieveResponse } from '@/api/valibot.gen'

import { fixtureFor } from '../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountForm } from '../support/form-harness.js'

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

const api = installApiSeam()

beforeEach(() => {
  api.get('/api/order/order/order_types_stats/', fixtureFor(vOrderOrderOrderTypesStatsRetrieveResponse))
})

const gets = () => api.requests().filter((request) => request.method === 'get')

describe('OrderTypesPie', () => {
  test('loads unfiltered order-type stats when given no pk', async () => {
    mountForm(OrderTypesPie)
    await settle()

    expect(gets()).toEqual([
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
    await settle()

    expect(gets()).toEqual([
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
    await settle()

    expect(gets()).toEqual([
      {
        method: 'get',
        path: '/api/order/order/order_types_stats/',
        query: { location: '7' },
        body: undefined,
      },
    ])
  })
})
