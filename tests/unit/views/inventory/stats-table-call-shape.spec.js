import { beforeEach, describe, expect, test } from 'vitest'

import materialModel from '@/models/inventory/Material.js'

import StatsTable from '@/views/inventory/StatsTable.vue'
import { vInventoryMaterialStatsTableRetrieveResponse } from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'
import { captureDownloads, xlsxResponse } from '../../support/downloads.js'

// CALL-SHAPE SPEC.
//
// loadData() used to go through materialService.getStatsTable(year), the
// hand-written model method that GET /inventory/material/stats_table/?year=<y>
// and appended &q=<search> whenever the model's searchQuery was truthy. The
// refactor replaced it with the generated inventoryMaterialStatsTableRetrieve
// op. These tests pin that the request shape is unchanged: same path, same
// year, and q only when a search term is actually set.

const api = installApiSeam()

const YEAR = new Date().getFullYear()

beforeEach(() => {
  api.get('/api/inventory/material/stats_table/', fixtureFor(vInventoryMaterialStatsTableRetrieveResponse))
  // The view reads the search query off the shared MaterialService singleton;
  // leave it clean for each test.
  materialModel.searchQuery = null
})

/** Let every request in the load path land. */
const flush = settle

/** The GETs made from `start` on. */
const getsFrom = (start = 0) => api.requests().slice(start).filter((request) => request.method === 'get')

describe('StatsTable - stats table call shape', () => {
  test('mount loads the stats table for the current year', async () => {
    mountForm(StatsTable)
    await flush()

    expect(getsFrom()).toEqual([
      { method: 'get', path: '/api/inventory/material/stats_table/', query: { year: String(YEAR) }, body: undefined },
    ])
  })

  test('sends the search query as q', async () => {
    const wrapper = mountForm(StatsTable)
    await flush()
    const start = api.requests().length

    wrapper.vm.model.setSearchQuery('acme')
    await wrapper.vm.loadData()
    await flush()

    expect(getsFrom(start)).toEqual([
      { method: 'get', path: '/api/inventory/material/stats_table/', query: { year: String(YEAR), q: 'acme' }, body: undefined },
    ])
  })

  test('nextYear reloads with the incremented year', async () => {
    const wrapper = mountForm(StatsTable)
    await flush()
    const start = api.requests().length

    wrapper.vm.nextYear()
    await flush()

    expect(getsFrom(start)).toEqual([
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
    const start = api.requests().length

    wrapper.vm.model.setSearchQuery('')
    await wrapper.vm.loadData()
    await flush()

    expect(getsFrom(start)).toEqual([
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
    const start = api.requests().length

    await wrapper.vm.loadData()
    await flush()

    expect(getsFrom(start)).toEqual([
      { method: 'get', path: '/api/inventory/material/stats_table/', query: { year: String(YEAR) }, body: undefined },
    ])
  })
})

describe('StatsTable - export', () => {
  // REGRESSION. The export fetched `/inventory/stats_table_export/`, outside
  // `/api/`, with the search term pasted into the query unencoded.
  test('exports the year and search term through the export endpoint', async () => {
    const saved = captureDownloads()
    api.get('/api/inventory/stats_table_export/', xlsxResponse)
    const wrapper = mountForm(StatsTable)
    await flush()
    const start = api.requests().length

    wrapper.vm.model.setSearchQuery('bout & moer')
    await wrapper.vm.downloadList()
    await flush()

    expect(getsFrom(start)).toEqual([
      {
        method: 'get', path: '/api/inventory/stats_table_export/',
        query: { year: String(YEAR), q: 'bout & moer' }, body: undefined,
      },
    ])
    expect(saved).toEqual(['stats_table.xlsx'])
  })
})
