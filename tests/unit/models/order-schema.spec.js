import { beforeEach, describe, expect, test, vi } from 'vitest'
import * as v from 'valibot'

import orderService, {
  OrderService,
  OrderModel,
  OrderFormSchema,
  nextWorkingDay,
} from '@/models/orders/Order'
import {
  OrderSchema,
  OrderDispatchSchema,
  OrderDetailSchema,
  OrderCustomerHistorySchema,
  OrderCreateSchema,
  OrderUpdateSchema,
  toApiDate,
} from '@/models/orders/order-schemas'

/**
 * These assert what the backend serializers actually say, not what the old
 * hand-written `fields` dict happened to contain - the two had already drifted,
 * so characterising the previous behaviour would have pinned the bugs in place.
 */

let service
let client

beforeEach(() => {
  client = { get: vi.fn(), post: vi.fn() }
  service = new OrderService()
  service.axios = client
})

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

  test('is evaluated per call, not once at import', () => {
    // The old module computed `tomorrow` at import time, so a session open past
    // midnight kept serving a stale date.
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

describe('toApiDate', () => {
  test('formats as YYYY-MM-DD with zero padding', () => {
    expect(toApiDate(new Date(2026, 2, 5))).toBe('2026-03-05')
  })

  test('uses local time, not UTC', () => {
    // toISOString() would roll this back to 2025-12-31 in any positive offset.
    const lateEvening = new Date(2026, 0, 1, 23, 30)
    expect(toApiDate(lateEvening)).toBe('2026-01-01')
  })
})

describe('form defaults', () => {
  test('order_email_extra defaults to an array, not a string', () => {
    // OrderViewMaintenance.vue calls .join(', ') on this; the old '' default
    // would have thrown had a form ever rendered before data arrived.
    const fields = service.getFields()
    expect(Array.isArray(fields.order_email_extra)).toBe(true)
    expect(fields.order_email_extra).toEqual([])
  })

  test('the dead `location` key is gone', () => {
    // It existed on neither the Order model nor any serializer.
    expect(service.getFields()).not.toHaveProperty('location')
  })

  test('includes the writable fields the old dict was missing', () => {
    const fields = service.getFields()
    expect(fields).toHaveProperty('customer_reference')
    expect(fields).toHaveProperty('description')
    expect(fields).toHaveProperty('external_identifier')
    expect(fields).toHaveProperty('quotation')
  })

  test('keeps the fields the backend discards, so the forms still bind', () => {
    // Documented as discarded rather than silently dropped - removing them
    // would break the existing v-model bindings.
    const fields = service.getFields()
    expect(fields).toHaveProperty('service_number')
    expect(fields).toHaveProperty('required_users')
  })

  test('start_date and end_date are Date objects re-stamped on each copy', () => {
    const first = service.getFields()
    expect(first.start_date).toBeInstanceOf(Date)
    expect(first.end_date).toBeInstanceOf(Date)
    expect(toApiDate(first.start_date)).toBe(toApiDate(nextWorkingDay()))
  })

  test('nested collections are not shared between copies', () => {
    const a = service.getFields()
    const b = service.getFields()
    a.orderlines.push({ id: 1 })
    expect(b.orderlines).toEqual([])
  })
})

describe('OrderModel', () => {
  test('applies the schema defaults', () => {
    const order = new OrderModel()
    expect(order.order_country_code).toBe('NL')
    expect(order.order_email_extra).toEqual([])
  })

  test('honours the data passed to the constructor', () => {
    // The previous OrderModel declared no constructor, so `new OrderModel({...})`
    // silently discarded everything it was given.
    const order = new OrderModel({ order_name: 'Acme', customer_id: '42' })
    expect(order.order_name).toBe('Acme')
    expect(order.customer_id).toBe('42')
    expect(order.order_country_code).toBe('NL')
  })

  test('matches the shape of getFields()', () => {
    expect(Object.keys(new OrderModel()).sort()).toEqual(Object.keys(service.getFields()).sort())
  })
})

describe('preInsert / preUpdate', () => {
  test('converts Date objects to YYYY-MM-DD', () => {
    const payload = service.preInsert({
      start_date: new Date(2026, 0, 8),
      end_date: new Date(2026, 0, 9),
    })
    expect(payload.start_date).toBe('2026-01-08')
    expect(payload.end_date).toBe('2026-01-09')
  })

  test('leaves string dates untouched', () => {
    const payload = service.preUpdate({ start_date: '2026-01-08', end_date: '2026-01-09' })
    expect(payload.start_date).toBe('2026-01-08')
    expect(payload.end_date).toBe('2026-01-09')
  })

  test('strips the read-only timestamps', () => {
    const payload = service.preInsert({
      start_date: '2026-01-08',
      created: '08-01-2026 10:00',
      modified: '08-01-2026 10:00',
    })
    expect(payload).not.toHaveProperty('created')
    expect(payload).not.toHaveProperty('modified')
  })
})

describe('getListUrl', () => {
  test.each([
    ['all', '/order/order/'],
    ['dispatch', '/order/order/dispatch_list_all/'],
    ['inprogress', '/order/order/dispatch_list_inprogress/'],
    ['finished', '/order/order/dispatch_list_finished/'],
    ['range', '/order/order/get_within_range/'],
    ['unaccepted', '/order/order/all_for_customer_not_accepted/'],
  ])('queryMode %s maps to %s', (queryMode, expected) => {
    service.queryMode = queryMode
    expect(service.getListUrl()).toBe(expected)
  })

  test('falls back to the plain list url for an unknown mode', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    service.queryMode = 'nonsense'
    expect(service.getListUrl()).toBe('/order/order/')
    log.mockRestore()
  })
})

describe('setAccepted / setRejected / getUnacceptedCount', () => {
  // These three used `new this.axios.post(...)`, which only worked by accident:
  // a constructor returning an object yields that object, so the promise
  // survived. TypeScript rejected it (TS7009).
  beforeEach(() => {
    client.get.mockResolvedValue({ data: { token: 'csrf' } })
    client.post.mockResolvedValue({ data: { ok: true } })
  })

  test('setAccepted posts to the accept action and unwraps data', async () => {
    const result = await service.setAccepted(7)
    expect(client.post).toHaveBeenCalledWith(
      '/order/order/7/set_order_accepted/',
      {},
      expect.anything(),
    )
    expect(result).toEqual({ ok: true })
  })

  test('setRejected posts to the reject action and unwraps data', async () => {
    const result = await service.setRejected(7)
    expect(client.post).toHaveBeenCalledWith(
      '/order/order/7/set_order_rejected/',
      {},
      expect.anything(),
    )
    expect(result).toEqual({ ok: true })
  })

  test('getUnacceptedCount unwraps data', async () => {
    client.get.mockResolvedValue({ data: { count: 3 } })
    await expect(service.getUnacceptedCount()).resolves.toEqual({ count: 3 })
  })
})

describe('stats endpoints', () => {
  test('customer variant omits the filter when given no pk', async () => {
    client.get.mockResolvedValue({ data: { order_types_stats: { a: 1 } } })
    await service.getOrderTypesStatsCustomer(null)
    expect(client.get).toHaveBeenCalledWith('/order/order/order_types_stats/')
  })

  test('customer variant appends the filter when given a pk', async () => {
    client.get.mockResolvedValue({ data: { order_types_stats: { a: 1 } } })
    const result = await service.getOrderTypesStatsCustomer(5)
    expect(client.get).toHaveBeenCalledWith('/order/order/order_types_stats/?customer=5')
    expect(result).toEqual({ a: 1 })
  })

  test('location variant always appends the filter', async () => {
    client.get.mockResolvedValue({ data: { order_counts_stats: {} } })
    await service.getMonthsStatsLocation(9)
    expect(client.get).toHaveBeenCalledWith('/order/order/order_counts_stats/?location=9')
  })
})

describe('read schemas parse realistic payloads', () => {
  const listRow = {
    id: 1,
    uuid: 'b4b0c2f0-0000-4000-8000-000000000000',
    customer_id: '42',
    order_id: 'ORD-1',
    order_name: 'Acme',
    start_date: '2026-01-08',
    end_date: '2026-01-09',
    order_email_extra: ['a@example.com'],
    statuses: [
      {
        id: 3,
        order: 1,
        status: 'created',
        modified: '08-01-2026 10:00',
        created: '08-01-2026 10:00',
      },
    ],
    required_assigned: '1/2 (50.00%)',
    customer_rate_avg: '-',
    total_price_selling: '120.00',
  }

  test('OrderSchema accepts a list row', () => {
    const parsed = v.parse(OrderSchema, listRow)
    expect(parsed.order_id).toBe('ORD-1')
    expect(parsed.statuses[0].status).toBe('created')
    // `customer_order_accepted` is not in this payload and stays absent. It
    // used to come back `true` because the form default lived in the schema -
    // a read schema asserting the customer had accepted an order the API said
    // nothing about. The blank-form value is pinned in the fields specs.
    expect(parsed.customer_order_accepted).toBeUndefined()
  })

  test('required_assigned and customer_rate_avg tolerate the "-" empty case', () => {
    const parsed = v.parse(OrderSchema, { ...listRow, required_assigned: '-', customer_rate_avg: 4.5 })
    expect(parsed.required_assigned).toBe('-')
    expect(parsed.customer_rate_avg).toBe(4.5)
  })

  test('OrderDispatchSchema carries the availability flag', () => {
    const parsed = v.parse(OrderDispatchSchema, { ...listRow, user_order_is_available: false })
    expect(parsed.user_order_is_available).toBe(false)
  })

  test('OrderDetailSchema adds the org-order extras', () => {
    const parsed = v.parse(OrderDetailSchema, {
      ...listRow,
      invoices: [{ id: 2, invoice_id: 'INV-2', uuid: 'b4b0c2f0-0000-4000-8000-000000000000', preliminary: true }],
    })
    expect(parsed.invoices[0].invoice_id).toBe('INV-2')
    // Absent from the payload, so absent from the parse - no invented [].
    expect(parsed.workorder_documents_partners).toBeUndefined()
  })

  test('OrderCustomerHistorySchema is the narrow projection', () => {
    const parsed = v.parse(OrderCustomerHistorySchema, { id: 1, order_id: 'ORD-1' })
    expect(parsed.order_id).toBe('ORD-1')
    expect(parsed).not.toHaveProperty('order_name')
  })

  test('nullable CharFields survive nulls from the API', () => {
    const parsed = v.parse(OrderSchema, { ...listRow, order_address: null, order_city: null })
    expect(parsed.order_address).toBeNull()
  })
})

describe('write schemas', () => {
  test('exclude the read-only fields', () => {
    const keys = Object.keys(OrderCreateSchema.entries)
    expect(keys).not.toContain('id')
    expect(keys).not.toContain('order_id')
    expect(keys).not.toContain('order_date')
    expect(keys).not.toContain('uuid')
  })

  test('OrderCreateSchema has branch and quotation, OrderUpdateSchema does not', () => {
    expect(Object.keys(OrderCreateSchema.entries)).toContain('quotation')
    expect(Object.keys(OrderUpdateSchema.entries)).not.toContain('quotation')
  })

  test('exclude the fields the backend discards', () => {
    const keys = Object.keys(OrderCreateSchema.entries)
    expect(keys).not.toContain('service_number')
    expect(keys).not.toContain('required_users')
    expect(keys).not.toContain('orderlines')
  })

  test('a Date start_date is transformed to a string on parse', () => {
    // The one place InferInput and InferOutput genuinely differ.
    // The write schema keeps OrderCreateSerializer's `required` intact, so a
    // submission has to carry all five required fields. They used to be widened
    // (order_type to null) so that a blank form would parse - which is what
    // made the write schema unusable for validating an actual submission.
    const parsed = v.parse(OrderCreateSchema, {
      start_date: new Date(2026, 0, 8),
      end_date: '2026-01-09',
      order_name: 'Acme',
      order_type: 'maintenance',
      customer_relation: 7,
      branch: 3,
    })
    expect(parsed.start_date).toBe('2026-01-08')
    expect(parsed.end_date).toBe('2026-01-09')
  })
})

describe('the exported singleton', () => {
  test('is an OrderService pointing at the order endpoint', () => {
    expect(orderService).toBeInstanceOf(OrderService)
    expect(orderService.url).toBe('/order/order/')
    expect(orderService.queryMode).toBe('all')
  })

  test('its model generates orders from the form schema', () => {
    expect(Object.keys(new orderService.model()).sort()).toEqual(
      Object.keys(v.getDefaults(OrderFormSchema)).sort(),
    )
  })
})
