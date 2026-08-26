import { beforeEach, describe, expect, test, vi } from 'vitest'

import materialModel from '@/models/inventory/Material.js'

import StatsTable from '@/views/inventory/StatsTable.vue'

import { requestShapes } from '../../support/request-recorder.js'
import { mountForm, resetFakeHttp } from '../../support/form-harness.js'

// CALL-SHAPE SPEC.
//
// loadData() used to go through materialService.getStatsTable(year), the
// hand-written model method that GET /inventory/material/stats_table/?year=<y>
// and appended &q=<search> whenever the model's searchQuery was truthy. The
// refactor replaced it with the generated inventoryMaterialStatsTableRetrieve
// op. These tests pin that the request shape is unchanged: same path, same
// year, and q only when a search term is actually set.

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

const ROUTES = {
  '/inventory/material/stats_table/': { results: [], inventory_keys: {} },
}

const YEAR = new Date().getFullYear()

beforeEach(() => {
  resetFakeHttp(fakeHttp, ROUTES)
  // The view reads the search query off the shared MaterialService singleton;
  // leave it clean for each test.
  materialModel.searchQuery = null
})

/** Let every pending promise in the load path resolve. */
async function flush() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve()
  }
}

describe('StatsTable - stats table call shape', () => {
  test('mount loads the stats table for the current year', async () => {
    mountForm(StatsTable)
    await flush()

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/inventory/material/stats_table/', query: { year: String(YEAR) }, body: undefined },
    ])
  })

  test('sends the search query as q', async () => {
    const wrapper = mountForm(StatsTable)
    await flush()
    fakeHttp.get.mockClear()

    wrapper.vm.model.setSearchQuery('acme')
    await wrapper.vm.loadData()

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/inventory/material/stats_table/', query: { year: String(YEAR), q: 'acme' }, body: undefined },
    ])
  })

  test('nextYear reloads with the incremented year', async () => {
    const wrapper = mountForm(StatsTable)
    await flush()
    fakeHttp.get.mockClear()

    wrapper.vm.nextYear()
    await flush()

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/inventory/material/stats_table/', query: { year: String(YEAR + 1) }, body: undefined },
    ])
  })

  // A cleared search box drops the parameter rather than sending `q=`, which
  // is what getQueryArgs always did - it only appended q when searchQuery was
  // truthy. For a while after the refactor it sent `q=` instead, because the
  // component read model.searchQuery straight into the generated client and
  // that filter only ran on the way to a hand-built URL. setSearchQuery
  // normalises now, so the two paths agree again.
  test('a cleared search drops the q parameter', async () => {
    const wrapper = mountForm(StatsTable)
    await flush()
    fakeHttp.get.mockClear()

    wrapper.vm.model.setSearchQuery('')
    await wrapper.vm.loadData()

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/inventory/material/stats_table/', query: { year: String(YEAR) }, body: undefined },
    ])
  })

  // The bug that prompted the change: searchQuery started life as `null`, the
  // schema for `q` is `string | undefined`, and the component handed one to
  // the other. Nothing had ever sent that null before, because getQueryArgs
  // dropped it.
  test('an untouched search box does not send q at all', async () => {
    const wrapper = mountForm(StatsTable)
    await flush()
    fakeHttp.get.mockClear()

    await wrapper.vm.loadData()

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/inventory/material/stats_table/', query: { year: String(YEAR) }, body: undefined },
    ])
  })
})
