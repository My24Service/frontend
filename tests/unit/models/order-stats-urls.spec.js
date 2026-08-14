import { beforeEach, describe, expect, test, vi } from 'vitest'

import { OrderService } from '@/models/orders/Order'

/**
 * Characterisation of every stats endpoint's URL.
 *
 * These twenty methods were near-identical, and the obvious way to collapse
 * them erases a real asymmetry: the customer and branch variants fall back to
 * an unfiltered URL when given no pk, while the location, equipment and
 * building variants always append their filter. This suite pins the exact URL
 * and the exact unwrapped response key for each, so the DRY-ing is provably
 * behaviour-preserving.
 */

const ACTIONS = [
  ['order_types_stats', 'getOrderTypesStats'],
  ['order_types_month_stats', 'getOrderTypesMonthsStats'],
  ['order_counts_stats', 'getMonthsStats'],
  ['counts_year_order_type_stats', 'getCountsYearOrdertypeStats'],
]

/** Suffix -> query parameter name. */
const OPTIONAL_FILTERS = [
  ['Customer', 'customer'],
  ['Branch', 'branch'],
]

const REQUIRED_FILTERS = [
  ['Location', 'location'],
  ['Equipment', 'equipment'],
  ['Building', 'building'],
]

let service
let client

beforeEach(() => {
  client = { get: vi.fn() }
  service = new OrderService()
  service.axios = client
})

describe.each(ACTIONS)('%s', (action, prefix) => {
  describe.each(OPTIONAL_FILTERS)('%s variant', (suffix, param) => {
    const method = `${prefix}${suffix}`

    test(`${method} appends the filter when given a pk`, async () => {
      client.get.mockResolvedValue({ data: { [action]: { a: 1 } } })
      const result = await service[method](7)

      expect(client.get).toHaveBeenCalledWith(`/order/order/${action}/?${param}=7`)
      expect(result).toEqual({ a: 1 })
    })

    test(`${method} omits the filter when given no pk`, async () => {
      client.get.mockResolvedValue({ data: { [action]: {} } })
      await service[method](null)

      expect(client.get).toHaveBeenCalledWith(`/order/order/${action}/`)
    })

    test(`${method} omits the filter when called with no argument`, async () => {
      client.get.mockResolvedValue({ data: { [action]: {} } })
      await service[method]()

      expect(client.get).toHaveBeenCalledWith(`/order/order/${action}/`)
    })
  })

  describe.each(REQUIRED_FILTERS)('%s variant', (suffix, param) => {
    const method = `${prefix}${suffix}`

    test(`${method} always appends the filter`, async () => {
      client.get.mockResolvedValue({ data: { [action]: { b: 2 } } })
      const result = await service[method](9)

      expect(client.get).toHaveBeenCalledWith(`/order/order/${action}/?${param}=9`)
      expect(result).toEqual({ b: 2 })
    })
  })

  test(`${prefix}Customer returns {} when the response carries no data`, async () => {
    client.get.mockResolvedValue({})
    await expect(service[`${prefix}Customer`](1)).resolves.toEqual({})
  })
})
