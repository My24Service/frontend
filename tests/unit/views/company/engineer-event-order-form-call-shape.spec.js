import { beforeEach, describe, expect, test, vi } from 'vitest'

import EngineerEventOrderForm from '@/views/company/EngineerEventOrderForm.vue'
import orderModel from '@/models/orders/Order'

import { mountForm, resetFakeHttp, toastCreate } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Call-shape characterisation for EngineerEventOrderForm's two migrated call
 * sites.
 *
 * 1. submitForm() used to call engineerEventModel.sendUpdate(event_id,
 *    assigned_order_id) (src/models/company/EngineerEvent.js), which did
 *    `axios.patch('/company/engineerevent-update/${event_id}/',
 *    { assigned_order })`. The refactor replaced it with the generated
 *    companyEngineereventUpdatePartialUpdate op
 *    (PATCH /api/company/engineerevent-update/{id}/); the view now stringifies
 *    the event id before interpolating it. Path, method and body are unchanged.
 * 2. getCustomers() used to call customerModel.search(query)
 *    (src/models/customer/Customer.js), i.e.
 *    `axios.get('/customer/customer/autocomplete/?q=' + query)`. The refactor
 *    replaced it with the generated customerCustomerAutocompleteList op
 *    (GET /api/customer/customer/autocomplete/ with query { q }). Unchanged.
 *
 * The rest of submitForm() (orderModel.insert + Assign.assignToUser) is
 * untouched BaseModel/mobile-model CRUD; Assign is mocked so the shape
 * assertions see only the migrated op.
 */

const { assignToUser } = vi.hoisted(() => ({ assignToUser: vi.fn() }))

vi.mock('@/models/mobile/Assign', () => ({
  default: { assignToUser },
  AssignService: class AssignService {},
}))

const fakeHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/services/api', () => ({ default: fakeHttp, normalClient: fakeHttp }))

vi.mock('@/api/client.gen', async () => {
  const { apiClientMock } = await import('../../support/api-client-mock.js')
  return apiClientMock(fakeHttp)
})

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

/** Drain microtasks so the op promises settle. */
async function flush() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

beforeEach(() => {
  resetFakeHttp(fakeHttp)
  fakeHttp.post.mockResolvedValue({ data: { id: 100, order_id: 100 } })
  fakeHttp.patch.mockResolvedValue({ data: {} })
  assignToUser.mockReset()
  assignToUser.mockResolvedValue({ assigned_data: { 100: 77 } })
  toastCreate.mockClear()
})

describe('EngineerEventOrderForm - getCustomers', () => {
  test('hits the customer autocomplete with the typed query', async () => {
    const wrapper = mountForm(EngineerEventOrderForm)

    wrapper.vm.getCustomers('acme')
    await flush()

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/customer/customer/autocomplete/', query: { q: 'acme' }, body: undefined },
    ])
  })
})

describe('EngineerEventOrderForm - submitForm', () => {
  test('patches the engineerevent-update with the newly assigned order', async () => {
    // The view calls orderModel.insert(this.order) without the write context
    // OrderService.insert() now demands (pre-existing at baseline 192a67d9
    // too - not a refactor change). Stub the out-of-scope CRUD insert so the
    // migrated PATCH op is actually reached; its payload shape is what this
    // spec is about.
    orderModel.insert = vi.fn().mockResolvedValue({ id: 100, order_id: 100 })

    const wrapper = mountForm(EngineerEventOrderForm, {
      stubs: {
        'b-modal': { template: '<div />', methods: { show() {}, hide() {} } },
      },
    })
    wrapper.vm.engineer = { id: 5 }
    wrapper.vm.event_id = 42
    wrapper.vm.order = { order_name: 'Test order' }

    await wrapper.vm.submitForm()
    await flush()

    expect(requestShapes(fakeHttp, { method: 'patch' })).toEqual([
      {
        method: 'patch',
        path: '/api/company/engineerevent-update/42/',
        query: {},
        body: { assigned_order: 77 },
      },
    ])
    expect(assignToUser).toHaveBeenCalledWith(5, [100], true)
  })
})
