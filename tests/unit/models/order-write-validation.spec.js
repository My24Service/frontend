import { beforeEach, describe, expect, test, vi } from 'vitest'

import { OrderService, orderFormDefaults } from '@/models/orders/Order'

// What the generated write schemas accept and what they hand back as the
// payload. These are the checks the forms now rely on instead of their own
// hand-maintained vuelidate rules, so the interesting assertions are about
// *transformation* (Date -> YYYY-MM-DD, HH:mm -> HH:mm:ss, form-only keys
// dropped) as much as about pass/fail.

/** Who the write is by: the backend picks its serializer from this, not from the payload. */
const PLANNING_WITH_BRANCHES = { role: 'planning', hasBranches: true }

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

})

