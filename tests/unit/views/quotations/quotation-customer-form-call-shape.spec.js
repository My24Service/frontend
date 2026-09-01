import { beforeEach, describe, expect, test, vi } from 'vitest'

import CustomerForm from '@/views/quotations/quotation_form/CustomerForm.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

// Call-shape characterisation for the migrated search call in CustomerForm.
//
// getCustomers(query) used to call CustomerService.search(query)
// (src/models/customer/Customer.js), which GETed
// `/customer/customer/autocomplete/?q=${query}` (baseURL '/api'). It now calls
// the generated customerCustomerAutocompleteList with `query: { q }`; the
// generated client serializes it to the identical
// `/api/customer/customer/autocomplete/?q=...`. Body: none, both ways. The
// empty-query guard (`if (query === '') return`) predates the refactor and is
// pinned too.

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

const MAIN = {
  getCountries: [{ code: 'NL', name: 'Netherlands' }],
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, {
    '/customer/customer/autocomplete/': [{ id: 1, name: 'ACME', address: 'Main 1', city: 'Amsterdam' }],
  })
})

describe('CustomerForm.getCustomers', () => {
  test('searches customers via the autocomplete action with q=<query>', async () => {
    const wrapper = mountForm(CustomerForm, { main: MAIN })

    await wrapper.vm.getCustomers('acme')

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      {
        method: 'get',
        path: '/api/customer/customer/autocomplete/',
        query: { q: 'acme' },
        body: undefined,
      },
    ])
  })

  test('does not search when the query is empty', async () => {
    const wrapper = mountForm(CustomerForm, { main: MAIN })

    await wrapper.vm.getCustomers('')

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([])
  })
})
