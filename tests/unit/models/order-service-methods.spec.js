import { beforeEach, describe, expect, test, vi } from 'vitest'

import { OrderService } from '@/models/orders/Order'

/**
 * Coverage for the OrderService methods that build their own URLs.
 *
 * Mutation testing showed these were reached by no test at all, so a typo in
 * any of these endpoints - or a dropped query parameter - would have gone
 * unnoticed. Each test pins the exact URL and what the method unwraps from the
 * response.
 */

let service
let client

beforeEach(() => {
  client = { get: vi.fn(), post: vi.fn() }
  service = new OrderService()
  service.axios = client
})

describe('single-request helpers', () => {
  test('recreateWorkorderPdfGotenberg posts to the gotenberg action', async () => {
    client.post.mockResolvedValue({ data: {} })
    await service.recreateWorkorderPdfGotenberg(12)

    expect(client.post).toHaveBeenCalledWith('/order/order/12/recreate_pdf/?gotenberg=1')
  })

  test('search hits the autocomplete endpoint and unwraps data', async () => {
    client.get.mockResolvedValue({ data: [{ id: 1 }] })

    await expect(service.search('acme')).resolves.toEqual([{ id: 1 }])
    expect(client.get).toHaveBeenCalledWith('/order/order/autocomplete/?q=acme')
  })

  test('getWorkorderData uses the standalone workorder-data url', async () => {
    client.get.mockResolvedValue({ data: { order_id: 'ORD-1' } })

    await expect(service.getWorkorderData('abc-123')).resolves.toEqual({ order_id: 'ORD-1' })
    // Deliberately not under this.url - it is a top-level order route.
    expect(client.get).toHaveBeenCalledWith('/order/workorder-data/abc-123/')
  })

  test('getTopXCustomers unwraps the named key', async () => {
    client.get.mockResolvedValue({ data: { get_top_x_customers: [{ name: 'Acme' }] } })

    await expect(service.getTopXCustomers()).resolves.toEqual([{ name: 'Acme' }])
    expect(client.get).toHaveBeenCalledWith('/order/order/get_top_x_customers/')
  })

  test('detailUuid hits the uuid detail route', async () => {
    client.get.mockResolvedValue({ data: { id: 4 } })

    await expect(service.detailUuid('abc-123')).resolves.toEqual({ id: 4 })
    expect(client.get).toHaveBeenCalledWith('/order/order/detail/abc-123/')
  })

  test('getUnacceptedCount hits the count action', async () => {
    client.get.mockResolvedValue({ data: { count: 2 } })

    await expect(service.getUnacceptedCount()).resolves.toEqual({ count: 2 })
    expect(client.get).toHaveBeenCalledWith('/order/order/all_for_customer_not_accepted_count/')
  })
})

describe('paginated list helpers', () => {
  test('getAllForCustomer builds the url and records the pagination counters', async () => {
    client.get.mockResolvedValue({ data: { count: 42, num_pages: 3, results: [] } })

    const data = await service.getAllForCustomer(5)

    expect(client.get).toHaveBeenCalledWith('/order/order/all_for_customer_web/?customer_id=5&page=1')
    expect(service.count).toBe(42)
    expect(service.numPages).toBe(3)
    expect(data.results).toEqual([])
  })

  test('getAllForEquipmentLocation filters by equipment when given one', async () => {
    client.get.mockResolvedValue({ data: { results: [] } })
    await service.getAllForEquipmentLocation(3, null)

    expect(client.get).toHaveBeenCalledWith('/order/order/all_for_equipment_location/?equipment=3&page=1')
  })

  test('getAllForEquipmentLocation falls back to location when equipment is absent', async () => {
    client.get.mockResolvedValue({ data: { results: [] } })
    await service.getAllForEquipmentLocation(null, 7)

    expect(client.get).toHaveBeenCalledWith('/order/order/all_for_equipment_location/?location=7&page=1')
  })

  // With a single list arg the '&' separator is unobservable, so these use two
  // to pin that the args are actually joined with '&' rather than concatenated.
  test('getAllForCustomer joins multiple list args with &', async () => {
    client.get.mockResolvedValue({ data: { results: [] } })
    service.setSort('order_id')
    service.addListArg('branch=2')

    await service.getAllForCustomer(5)

    expect(client.get).toHaveBeenCalledWith(
      '/order/order/all_for_customer_web/?customer_id=5&page=1&order_by=order_id&branch=2',
    )
  })

  test('getAllForEquipmentLocation joins multiple list args with &', async () => {
    client.get.mockResolvedValue({ data: { results: [] } })
    service.setSort('order_id')
    service.addListArg('branch=2')

    await service.getAllForEquipmentLocation(3, null)

    expect(client.get).toHaveBeenCalledWith(
      '/order/order/all_for_equipment_location/?equipment=3&page=1&order_by=order_id&branch=2',
    )
  })

  test('the pagination counters are left alone when the response omits them', async () => {
    service.count = 99
    service.numPages = 9
    client.get.mockResolvedValue({ data: { results: [] } })

    await service.getAllForCustomer(5)

    expect(service.count).toBe(99)
    expect(service.numPages).toBe(9)
  })
})

describe('getListArgs', () => {
  test('always includes the current page', () => {
    service.currentPage = 4
    expect(service.getListArgs()).toEqual(['page=4'])
  })

  test('includes the search query when set', () => {
    service.setSearchQuery('acme', false)
    expect(service.getListArgs()).toContain('q=acme')
  })

  test('includes the sort when set', () => {
    service.setSort('order_id')
    expect(service.getListArgs()).toContain('order_by=order_id')
  })

  test('includes the since date when set', () => {
    service.setSinceDate('2026-01-01')
    expect(service.getListArgs()).toContain('since=2026-01-01')
  })

  test('appends any extra list args', () => {
    service.addListArg('branch=2')
    expect(service.getListArgs()).toEqual(['page=1', 'branch=2'])
  })

  test('omits the optional args when they are unset', () => {
    expect(service.getListArgs()).toEqual(['page=1'])
  })

  test('combines all of them in order', () => {
    service.currentPage = 2
    service.setSearchQuery('acme', false)
    service.setSort('order_id')
    service.setSinceDate('2026-01-01')
    service.addListArg('branch=2')

    expect(service.getListArgs()).toEqual([
      'page=2',
      'q=acme',
      'order_by=order_id',
      'since=2026-01-01',
      'branch=2',
    ])
  })
})

describe('getListUrl logging', () => {
  test('does not log for a known queryMode', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    service.queryMode = 'all'
    service.getListUrl()

    expect(log).not.toHaveBeenCalled()
    log.mockRestore()
  })

  test('logs the offending value for an unknown queryMode', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    service.queryMode = 'nonsense'
    service.getListUrl()

    expect(log).toHaveBeenCalledWith('unknown queryMode: nonsense')
    log.mockRestore()
  })
})
