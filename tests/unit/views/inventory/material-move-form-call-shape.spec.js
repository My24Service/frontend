import { beforeEach, describe, expect, test, vi } from 'vitest'

import MaterialMoveForm from '@/views/inventory/MaterialMoveForm.vue'
import { vInventoryMaterialMoveCreateResponse, vStockLocation } from '@/api/valibot.gen'

import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toastCreate } from '../../support/form-harness.js'

// CALL-SHAPE SPEC.
//
// _submitForm() used to go through materialService.move(pk, fromPk, toPk,
// amount), the hand-written model method that POSTed
// /inventory/material/<pk>/move/ with {from_location_id, to_location_id,
// amount}. The refactor replaced it with the generated
// inventoryMaterialMoveCreate op. These tests pin that the request shape is
// unchanged - including the view's Number() on the pk and String() on the
// amount, which is exactly what the old URL interpolation and body put on the
// wire.

const api = installApiSeam()

beforeEach(() => {
  // What the pickers read on mount.
  api.get('/api/inventory/inventory-materials/', [])
  api.get('/api/inventory/stock-location/', paginated([fixtureFor(vStockLocation, { id: 2 })]))
  api.post('/api/inventory/material/{id}/move/', fixtureFor(vInventoryMaterialMoveCreateResponse))
  toastCreate.mockClear()
})

/** Let every request in flight land. */
const flush = settle

const requestsOf = (method, start = 0) => api.requests().slice(start).filter((request) => request.method === method)

async function mountMoveForm() {
  const wrapper = mountForm(MaterialMoveForm)
  await flush()
  // The success path pushes to a route the harness router does not know; keep
  // the push from rejecting as an unhandled promise.
  vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue()
  return wrapper
}

describe('MaterialMoveForm - material search', () => {
  test('a search term reaches the backend whole, however it is spelled', async () => {
    const wrapper = await mountMoveForm()
    const start = api.requests().length

    await wrapper.vm.getMaterials('bout & moer #5+')
    await flush()

    expect(requestsOf('get', start)).toEqual([
      { method: 'get', path: '/api/inventory/inventory-materials/', query: { q: 'bout & moer #5+' }, body: undefined },
    ])
  })
})

describe('MaterialMoveForm - material move call shape', () => {
  test('posts the move to /api/inventory/material/{id}/move/ with the location ids and amount', async () => {
    const wrapper = await mountMoveForm()

    wrapper.vm.selectedMaterialPk = 5
    wrapper.vm.selectedFromLocationPk = 2
    wrapper.vm.selectedToLocationPk = 3
    wrapper.vm.amount = '10'

    await wrapper.vm.submitForm()
    await flush()

    expect(requestsOf('post')).toEqual([
      {
        method: 'post',
        path: '/api/inventory/material/5/move/',
        query: {},
        body: { from_location_id: 2, to_location_id: 3, amount: '10' },
      },
    ])
  })
})
