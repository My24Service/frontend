import { beforeEach, describe, expect, test, vi } from 'vitest'

import MaterialsCreate from '@/views/quotations/quotation_form/MaterialsCreate.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

// Call-shape characterisation for the migrated search call in MaterialsCreate.
//
// getMaterials(query) used to call MaterialService.searchNoSupplier(query)
// (src/models/inventory/Material.js), which GETed
// `/inventory/material/autocomplete/?q=${query}` (baseURL '/api'). It now calls
// the generated inventoryMaterialAutocompleteList with `query: { q }`; the
// generated client serializes it to the identical
// `/api/inventory/material/autocomplete/?q=...`. Body: none, both ways.
//
// The component is mounted without a chapter so its created() hook skips the
// (unchanged) cost-collection CRUD and the search method is exercised directly.

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
  getDefaultCurrency: 'EUR',
  getQuotationDefaultVat: 21,
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, {
    '/inventory/material/autocomplete/': [{ id: 1, name: 'Bolt' }],
  })
})

describe('MaterialsCreate.getMaterials', () => {
  test('searches materials via the autocomplete action with q=<query>', async () => {
    const wrapper = mountForm(MaterialsCreate, { props: { chapter: {} }, main: MAIN })

    await wrapper.vm.getMaterials('bolt')

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      {
        method: 'get',
        path: '/api/inventory/material/autocomplete/',
        query: { q: 'bolt' },
        body: undefined,
      },
    ])
  })
})
