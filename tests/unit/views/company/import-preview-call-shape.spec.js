import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import ImportPreview from '@/views/company/ImportPreview.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

// Call-shape characterisation for the migrated SDK calls in ImportPreview.vue.
//
// Pre-refactor (192a67d9) the view used three ImportService methods
// (src/models/company/Import.js), all replaced by @/api/sdk.gen ops:
//   fetchLookupFields()  -> GET  /company/import/get_lookup_fields/
//   previewImport(pk)    -> GET  /company/import/{pk}/preview/
//   doImport(pk)         -> POST /company/import/{pk}/do/
// The refactored ops are companyImportGetLookupFieldsRetrieve,
// companyImportPreviewRetrieve({ path: { id: Number(this.pk) } }) and
// companyImportDoCreate({ path: { id: Number(this.pk) } }) with the same
// paths (modulo the /api prefix), no query, no body. The view coerces the pk
// prop with Number() before interpolating, which this spec pins.
//
// route_prefix is only used to build navigation names; the harness router only
// knows `order-list`, so it is passed 'order' to keep importAll's final
// navigation on the happy path.

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
  '/company/import/get_lookup_fields/': {
    customers: ['name', 'address'],
    branches: ['name'],
  },
  '/company/import/7/preview/': {
    customers: { import: [{ name: 'Acme', mode: 'insert' }] },
    branches: { import: [{ name: 'Branch A', mode: 'update' }] },
  },
}

function mount(props = {}) {
  return mountForm(ImportPreview, {
    props: { route_prefix: 'order', ...props },
  })
}

/** Mount and wait for created()'s two SDK GETs to land. */
async function ready(props = {}) {
  const wrapper = mount(props)
  await vi.waitFor(() => expect(fakeHttp.get.mock.calls.length).toBeGreaterThanOrEqual(2))
  return wrapper
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, ROUTES)
  vi.stubGlobal('confirm', () => true)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ImportPreview - lookup fields (call shape)', () => {
  test('created() fetches GET /api/company/import/get_lookup_fields/ with no query or body', async () => {
    await ready()

    expect(requestShapes(fakeHttp, { method: 'get' })).toContainEqual({
      method: 'get',
      path: '/api/company/import/get_lookup_fields/',
      query: {},
      body: undefined,
    })
  })
})

describe('ImportPreview - preview (call shape)', () => {
  test('created() fetches GET /api/company/import/{id}/preview/ with the pk coerced to a number', async () => {
    await ready({ pk: '7' })

    expect(requestShapes(fakeHttp, { method: 'get' })).toContainEqual({
      method: 'get',
      path: '/api/company/import/7/preview/',
      query: {},
      body: undefined,
    })
  })

  test('fetches the preview and the lookup fields in that order', async () => {
    await ready({ pk: 7 })

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      {
        method: 'get',
        path: '/api/company/import/get_lookup_fields/',
        query: {},
        body: undefined,
      },
      {
        method: 'get',
        path: '/api/company/import/7/preview/',
        query: {},
        body: undefined,
      },
    ])
  })
})

describe('ImportPreview - import all (call shape)', () => {
  test('importAll posts POST /api/company/import/{id}/do/ with the numeric pk and no body', async () => {
    const wrapper = await ready({ pk: 7 })

    await wrapper.vm.importAll()

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([
      { method: 'post', path: '/api/company/import/7/do/', query: {}, body: undefined },
    ])
  })

  test('does not call the do-import op when the confirm dialog is declined', async () => {
    vi.stubGlobal('confirm', () => false)
    const wrapper = await ready({ pk: 7 })

    await wrapper.vm.importAll()

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([])
  })
})
