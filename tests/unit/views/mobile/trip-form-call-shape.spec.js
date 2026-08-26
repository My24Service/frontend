import { beforeEach, describe, expect, test, vi } from 'vitest'

import TripForm from '@/views/mobile/TripForm.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Call-shape characterisation for TripForm's one migrated call site:
 * `getOrders` used to go through `OrderService.search(query)` (GET
 * `/order/order/autocomplete/?q=...`); it now calls the generated
 * `orderOrderAutocompleteList({ query: { q } })` (GET
 * `/api/order/order/autocomplete/?q=...`). Same path, same query, and an
 * empty query is still refused before any request (the debounced search and
 * the `created()` load both rely on that guard).
 *
 * The Trip model's insert/update/detail are unchanged BaseModel CRUD and are
 * not pinned here.
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

function mount(props = {}) {
  return mountForm(TripForm, {
    props,
    main: { getCountries: [] },
    stubs: {
      VueMultiselect: { template: '<div />' },
      VueDatePicker: { template: '<div />' },
    },
  })
}

beforeEach(() => {
  resetFakeHttp(fakeHttp)
})

describe('TripForm - call shapes', () => {
  test('getOrders calls the order autocomplete with the query', async () => {
    const wrapper = mount({ pk: null })

    await wrapper.vm.getOrders('acme')

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/order/order/autocomplete/', query: { q: 'acme' }, body: undefined },
    ])
  })

  test('an empty query makes no request at all', async () => {
    const wrapper = mount({ pk: null })

    await wrapper.vm.getOrders('')

    expect(fakeHttp.get).not.toHaveBeenCalled()
  })
})
