import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import ImportList from '@/views/company/ImportList.vue'

import { mountForm, mountListView, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

// Call-shape characterisation for the migrated SDK call in ImportList.vue.
//
// Pre-refactor (192a67d9) revertImport(id) called `this.service.revertImport(id)`,
// which was `this.axios.post('/company/import/${id}/revert/')` on the
// ImportService (src/models/company/Import.js). The refactor replaced it with
// `companyImportRevertCreate({ path: { id: Number(id) }, throwOnError: true })`
// from @/api/sdk.gen, whose url is '/api/company/import/{id}/revert/'. Same
// path (modulo the /api prefix), no query, no body - behavior preserved. The
// view explicitly coerces the id with Number(), which this spec pins.
//
// The list fetch and the delete were BaseModel CRUD until the view moved onto
// `useListQuery`; the second describe below pins them, because "the requests
// did not change" is the whole claim of that conversion.

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
  return mountForm(ImportList, {
    props: { route_prefix: 'import', ...props },
  })
}

/** Mount, wait for the created() list() CRUD to land. */
async function ready(props = {}, query = {}) {
  // mountListView, not mount: the view reads its page and search term out of
  // $route during setup, and a memory router is not ready that early.
  const wrapper = await mountListView(ImportList, {
    props: { route_prefix: 'import', ...props },
    query,
  })
  await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())
  return wrapper
}

beforeEach(() => {
  resetFakeHttp(fakeHttp)
  vi.stubGlobal('confirm', () => true)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ImportList - revert import (call shape)', () => {
  test('revertImport posts POST /api/company/import/{id}/revert/ with the numeric id', async () => {
    const wrapper = await ready()

    await wrapper.vm.revertImport(5)

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([
      { method: 'post', path: '/api/company/import/5/revert/', query: {}, body: undefined },
    ])
  })

  test('coerces a string id with Number() before interpolating it', async () => {
    const wrapper = await ready()

    await wrapper.vm.revertImport('7')

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([
      { method: 'post', path: '/api/company/import/7/revert/', query: {}, body: undefined },
    ])
  })

  test('does not call the revert op when the confirm dialog is declined', async () => {
    vi.stubGlobal('confirm', () => false)
    const wrapper = await ready()

    await wrapper.vm.revertImport(5)

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([])
  })
})

describe('ImportList - list fetch and delete', () => {
  test('the list fetch goes to /api/company/import/ on page 1', async () => {
    await ready()

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/company/import/', query: { page: '1' }, body: undefined },
    ])
  })

  // The page comes out of the route because that is the only place it lives:
  // Pagination.vue pushes it and <router-view :key="$route.fullPath"> rebuilds
  // the view, so there is no in-memory page counter to carry it.
  test('a page in the url is read back as a number', async () => {
    await ready({}, { page: '3' })

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/company/import/', query: { page: '3' }, body: undefined },
    ])
  })

  // The bug this conversion fixes. Pagination.vue spreads getQueryArgs() into
  // the pushed query, so `q` was already going into the url - but created()
  // only ever read `page` back, so page two of a search showed unfiltered
  // results.

})
