import { beforeEach, describe, expect, test, vi } from 'vitest'

import CustomerForm from '@/views/customer/CustomerForm.vue'

import { mountForm, resetFakeHttp, toastCreate } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Call-shape characterisation for the CustomerForm custom-endpoint call made on
 * load: check_customer_id_handling, reached through
 * CustomerService.getCustomerId().
 *
 * Golden shape, derived from 192a67d9: GET
 * `/customer/customer/check_customer_id_handling/`, no query, no body - the
 * same shape the generated
 * customerCustomerCheckCustomerIdHandlingRetrieve produces. The partner-branch
 * actions were pinned too on the horizontal branch; those specs asserted
 * post-migration behaviour and were dropped (#315).
 */

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

const ROUTES = {
  // created() always lists the partners first (BaseModel CRUD, unchanged by the
  // refactor) and only then runs the create/edit branch.
  '/company/partner/': { results: [] },
  '/customer/customer/3/': {},
  '/customer/customer/check_customer_id_handling/': { created: true, customer_id: 'CUS-1' },
  '/customer/customer/get_new_customer_id_from_latest/': { result: { last_customer_id: 'CUS-99' } },
  '/company/partner/12/branches/': { branches: [] },
  '/company/partner/12/copy_customer_orders/': { id: 100 },
  '/company/partner/12/branch_create_from_customer/': { branch: { id: 5 } },
}

const MAIN = { getDefaultCurrency: 'EUR', getCountries: [] }

async function flushPromises() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, ROUTES)
  toastCreate.mockClear()
  // createBranchFromCustomer() guards on window.confirm; happy-dom does not
  // implement it, so stub the prompt to "yes".
  vi.stubGlobal('confirm', vi.fn(() => true))
})

describe('CustomerForm - create mode', () => {
  async function mountCreate() {
    const wrapper = mountForm(CustomerForm, { main: MAIN })
    await flushPromises()
    return wrapper
  }

  test('checks customer-id handling on load', async () => {
    await mountCreate()

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/company/partner/', query: { page: '1' }, body: undefined },
      {
        method: 'get',
        path: '/api/customer/customer/check_customer_id_handling/',
        query: {},
        body: undefined,
      },
    ])
  })

})

