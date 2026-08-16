import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  OrderService,
  orderFormDefaults,
  validateOrderCreate,
  validateOrderUpdate,
} from '@/models/orders/Order'
import { SchemaValidationError } from '@/models/schema'

// What the generated write schemas accept and what they hand back as the
// payload. These are the checks the forms now rely on instead of their own
// hand-maintained vuelidate rules, so the interesting assertions are about
// *transformation* (Date -> YYYY-MM-DD, HH:mm -> HH:mm:ss, form-only keys
// dropped) as much as about pass/fail.

/** Who the write is by: the backend picks its serializer from this, not from the payload. */
const PLANNING_WITH_BRANCHES = { role: 'planning', hasBranches: true }
const PLANNING_NO_BRANCHES = { role: 'planning', hasBranches: false }

/** A form state that satisfies OrderCreateSerializer, branch variant. */
function validOrder(extra = {}) {
  return {
    ...orderFormDefaults(),
    order_type: 'maintenance',
    order_name: 'Branch Amsterdam',
    start_date: new Date(2026, 7, 20),
    end_date: new Date(2026, 7, 21),
    branch: 7,
    ...extra,
  }
}

describe('validateOrderCreate', () => {
  test('accepts a filled-in order form', () => {
    const result = validateOrderCreate(validOrder(), PLANNING_WITH_BRANCHES)

    expect(result.success).toBe(true)
    expect(result.errors).toEqual({})
  })

  test('renders the datepicker Dates as API dates, in local time', () => {
    // Local midnight, i.e. the previous day in UTC - toISOString() would report
    // the 19th here.
    const result = validateOrderCreate(validOrder(), PLANNING_WITH_BRANCHES)

    expect(result.output.start_date).toBe('2026-08-20')
    expect(result.output.end_date).toBe('2026-08-21')
  })

  test('pads the HH:mm time inputs to the HH:mm:ss the schema types', () => {
    const result = validateOrderCreate(validOrder({ start_time: '08:30', end_time: '17:00:00' }), PLANNING_WITH_BRANCHES)

    expect(result.success).toBe(true)
    expect(result.output.start_time).toBe('08:30:00')
    expect(result.output.end_time).toBe('17:00:00')
  })

  test('treats a cleared time input as no time', () => {
    const result = validateOrderCreate(validOrder({ start_time: '' }), PLANNING_WITH_BRANCHES)

    expect(result.success).toBe(true)
    expect(result.output.start_time).toBeNull()
  })

  test('rejects a time that is not a time', () => {
    const result = validateOrderCreate(validOrder({ start_time: 'half past eight' }), PLANNING_WITH_BRANCHES)

    expect(result.success).toBe(false)
    expect(result.errors).toHaveProperty('start_time')
  })

  test('rejects an order with no order type', () => {
    // The blank-form default: OrderCreateSerializer requires order_type and a
    // new form has not picked one.
    const result = validateOrderCreate(validOrder({ order_type: null }), PLANNING_WITH_BRANCHES)

    expect(result.success).toBe(false)
    expect(Object.keys(result.errors)).toEqual(['order_type'])
  })

  test('requires branch for a tenant with branches', () => {
    const result = validateOrderCreate(validOrder({ branch: null }), PLANNING_WITH_BRANCHES)

    expect(result.success).toBe(false)
    expect(result.errors).toHaveProperty('branch')
  })

  test('requires customer_relation for a tenant without branches', () => {
    const result = validateOrderCreate(validOrder(), PLANNING_NO_BRANCHES)

    expect(result.success).toBe(false)
    expect(result.errors).toHaveProperty('customer_relation')

    const withRelation = validateOrderCreate(validOrder({ customer_relation: 12 }), PLANNING_NO_BRANCHES)
    expect(withRelation.success).toBe(true)
  })

  test('reports one message per field, keyed by field name', () => {
    const result = validateOrderCreate(validOrder({ order_type: null, order_name: 42 }), PLANNING_WITH_BRANCHES)

    expect(Object.keys(result.errors).sort()).toEqual(['order_name', 'order_type'])
    expect(typeof result.errors.order_type).toBe('string')
  })

  test('drops the form-only keys the serializer does not accept', () => {
    const result = validateOrderCreate(
      validOrder({
        orderlines: [{ product: 'Widget' }],
        infolines: [],
        statuses: [],
        service_number: 'S-1',
        required_users: 2,
      }),
      PLANNING_WITH_BRANCHES,
    )

    expect(result.success).toBe(true)
    for (const key of ['orderlines', 'infolines', 'statuses', 'service_number', 'required_users']) {
      expect(result.output).not.toHaveProperty(key)
    }
  })
})

describe('OrderService.insert - validation cannot be skipped', () => {
  let service
  let http

  beforeEach(() => {
    service = new OrderService()
    http = {
      get: vi.fn(() => Promise.resolve({ data: { token: 'csrf-token' } })),
      post: vi.fn(() => Promise.resolve({ data: { id: 100 } })),
      patch: vi.fn(() => Promise.resolve({ data: {} })),
    }
    service.axios = http
  })

  test('posts a valid order', async () => {
    await service.insert(validOrder(), PLANNING_WITH_BRANCHES)

    expect(http.post).toHaveBeenCalled()
    const [url, payload] = http.post.mock.calls[0]
    expect(url).toBe('/order/order/')
    expect(payload).toMatchObject({ order_type: 'maintenance', start_date: '2026-08-20' })
  })

  test('refuses to send an order that fails the tenant variant', async () => {
    // No customer_relation, and this tenant has no branches.
    await expect(service.insert(validOrder(), PLANNING_NO_BRANCHES)).rejects.toThrow(SchemaValidationError)

    expect(http.post).not.toHaveBeenCalled()
  })

  test('the rejection carries the field errors a form renders', async () => {
    await expect(service.insert(validOrder({ order_type: null }), PLANNING_WITH_BRANCHES))
      .rejects.toMatchObject({ errors: { order_type: expect.any(String) } })
  })

  test('still validates the base contract when the tenant flag is omitted', async () => {
    // The owner field cannot be checked without the flag, but nothing else is
    // waved through: this is the backstop for call sites that forget.
    await expect(service.insert(validOrder({ order_type: null }))).rejects.toThrow(SchemaValidationError)

    await service.insert(validOrder())
    expect(http.post).toHaveBeenCalled()
  })

  test('update refuses a malformed payload before issuing the request', async () => {
    await expect(service.update(42, validOrder({ start_time: 'half past eight' })))
      .rejects.toThrow(SchemaValidationError)

    expect(http.patch).not.toHaveBeenCalled()
  })
})

describe('validateOrderUpdate', () => {
  test('accepts an order loaded from the API and re-submitted', () => {
    const result = validateOrderUpdate(validOrder())

    expect(result.success).toBe(true)
  })

  test('does not send branch - OrderUpdateSerializer has no such field', () => {
    const result = validateOrderUpdate(validOrder({ branch: 7 }))

    expect(result.output).not.toHaveProperty('branch')
  })

  test('accepts a missing order type, unlike create', () => {
    // order_type is optional on OrderUpdateSerializer: a PATCH that does not
    // mention it leaves it alone.
    const { order_type, ...withoutType } = validOrder()

    expect(validateOrderUpdate(withoutType).success).toBe(true)
  })
})
