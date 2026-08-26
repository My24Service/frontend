import { beforeEach, describe, expect, test, vi } from 'vitest'

import EquipmentForm from '@/views/equipment/EquipmentForm.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Call-shape characterisation for EquipmentForm's loadData() "my" lookups.
 *
 * Old model shapes (baseURL `/api` stripped by the recorder):
 *   - getMyBranch:    GET /company/branch-my/
 *   - getMyCustomer:  GET /customer/customer-my/
 *   - listForSelectBranch()/listForSelectCustomer() with no arg send no query
 *
 * The autocomplete and list_for_select-with-id call sites were pinned too on
 * the horizontal branch; those specs asserted post-migration behaviour and were
 * dropped (#315).
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
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const ROUTES = {
  '/customer/customer/autocomplete/': [{ id: 1, name: 'Acme BV', city: 'Amsterdam' }],
  '/company/branch/autocomplete/': [{ id: 2, name: 'Branch Amsterdam', city: 'Amsterdam' }],
  '/company/branch-my/': { id: 3, name: 'My Branch', city: 'Rotterdam' },
  '/customer/customer-my/': { id: 4, name: 'My Customer', city: 'Utrecht' },
  '/equipment/location/list_for_select/': [{ id: 9, name: 'Basement' }],
}

/**
 * The form calls `this.$refs.name.focus()` after a selection. Under
 * shallowMount every child is stubbed, so the ref lands on the BFormInput stub
 * - give it the one method the form relies on.
 */
const focusableInput = { template: '<div />', methods: { focus() {} } }

/** Flush the microtask chains the async setup/created hooks leave behind. */
async function flush() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve()
  }
}

function mountEquipmentForm(props = {}, main = {}, auth = {}) {
  return mountForm(EquipmentForm, {
    props,
    // getDefaultCurrency is read during created() (newModel / loadData) and
    // would throw on a null memberInfo if left to its real implementation.
    main: { getMemberHasBranches: false, getDefaultCurrency: 'EUR', ...main },
    auth,
    stubs: { BFormInput: focusableInput },
  })
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, ROUTES)
})

describe('EquipmentForm - loadData "my" lookups', () => {
  test('a branch employee loads the own branch and all locations (no query)', async () => {
    const wrapper = mountEquipmentForm(
      {},
      { getMemberHasBranches: true },
      { userInfo: { submodel: 'employee_user', user: { employee_user: { branch: null } } } },
    )
    await flush()

    // Old: branchService.getMyBranch() -> GET /company/branch-my/
    //      locationService.listForSelectBranch() -> GET /equipment/location/list_for_select/
    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/company/branch-my/', query: {}, body: undefined },
      { method: 'get', path: '/api/equipment/location/list_for_select/', query: {}, body: undefined },
    ])
  })

  test('a customer loads the own customer and all locations (no query)', async () => {
    const wrapper = mountEquipmentForm(
      {},
      { getMemberHasBranches: false },
      { userInfo: { submodel: 'customer_user', user: { customer_user: { customer: 12 } } } },
    )
    await flush()

    // Old: customerService.getMyCustomer() -> GET /customer/customer-my/
    //      locationService.listForSelectCustomer() -> GET /equipment/location/list_for_select/
    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/customer/customer-my/', query: {}, body: undefined },
      { method: 'get', path: '/api/equipment/location/list_for_select/', query: {}, body: undefined },
    ])
  })
})
