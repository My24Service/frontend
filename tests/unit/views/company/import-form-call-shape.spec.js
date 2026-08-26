import { beforeEach, describe, expect, test, vi } from 'vitest'

import ImportForm from '@/views/company/ImportForm.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

// Call-shape characterisation for the migrated SDK call in ImportForm.vue.
//
// Pre-refactor (192a67d9) the form did `this.service.fetchAllowedExtensions()`,
// which was `this.axios.get('/company/import/get_allowed_extensions/')` on the
// ImportService (src/models/company/Import.js). The refactor replaced it with
// `companyImportGetAllowedExtensionsRetrieve({ throwOnError: true })` from
// @/api/sdk.gen, whose url is '/api/company/import/get_allowed_extensions/'.
// Same path (modulo the /api prefix), no query, no body - behavior preserved.
//
// The rest of the form's traffic is BaseModel CRUD (service.detail/insert/
// update), which the refactor did not touch and this spec does not pin.

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

beforeEach(() => {
  // No route fixtures needed: the migrated op's GET is unlisted (resolves to
  // [] like any other route) and the edit-mode detail() CRUD call uses the
  // legacy unprefixed URL, which is unlisted too.
  resetFakeHttp(fakeHttp)
})

function mount(props = {}) {
  return mountForm(ImportForm, {
    props: { route_prefix: 'import', ...props },
  })
}

async function ready(props = {}) {
  const wrapper = mount(props)
  await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())
  return wrapper
}

describe('ImportForm - allowed extensions (call shape)', () => {
  test('create mode fetches GET /api/company/import/get_allowed_extensions/ with no query or body', async () => {
    await ready()

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      {
        method: 'get',
        path: '/api/company/import/get_allowed_extensions/',
        query: {},
        body: undefined,
      },
    ])
  })

  test('edit mode still fetches the allowed extensions before the detail CRUD', async () => {
    const wrapper = await ready({ pk: 7 })
    // created() awaits the allowed-extensions op before the detail CRUD, so
    // wait for both GETs before asserting their order.
    await vi.waitFor(() => expect(fakeHttp.get.mock.calls.length).toBe(2))

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      {
        method: 'get',
        path: '/api/company/import/get_allowed_extensions/',
        query: {},
        body: undefined,
      },
      // Unmigrated BaseModel detail() CRUD, listed only to show ordering.
      { method: 'get', path: '/api/company/import/7/', query: {}, body: undefined },
    ])
  })
})
