import { beforeEach, describe, expect, test, vi } from 'vitest'

import UserCustomerForm from '@/views/company/UserCustomerForm.vue'

import { mountForm, resetFakeHttp, toastCreate } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Call-shape characterisation for UserCustomerForm's migrated autocomplete
 * call site.
 *
 * Pre-refactor (192a67d9) getCustomers(query) went through customerModel.search()
 * (src/models/customer/Customer.js), which did
 * `axios.get('/customer/customer/autocomplete/?q=' + query)`. The refactor
 * replaced it with the generated customerCustomerAutocompleteList op
 * (GET /api/customer/customer/autocomplete/ with query { q }). Path, query
 * value and method are unchanged; only the response unwrapping differs
 * (`response.data` in both, since the old search() already unwrapped the
 * axios payload and the view read the op's `.data` the same way).
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

/** Drain microtasks so the op's promise chain settles. */
async function flush() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

beforeEach(() => {
  resetFakeHttp(fakeHttp)
  toastCreate.mockClear()
})

describe('UserCustomerForm - getCustomers', () => {
  test('hits the customer autocomplete with the typed query', async () => {
    const wrapper = mountForm(UserCustomerForm, { props: { pk: null } })

    wrapper.vm.getCustomers('acme')
    await flush()

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/customer/customer/autocomplete/', query: { q: 'acme' }, body: undefined },
    ])
  })

  test('sends the query as given, whatever the caller typed', async () => {
    const wrapper = mountForm(UserCustomerForm, { props: { pk: null } })

    wrapper.vm.getCustomers('Van Dael')
    await flush()

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/customer/customer/autocomplete/', query: { q: 'Van Dael' }, body: undefined },
    ])
  })
})
