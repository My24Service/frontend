import { beforeEach, describe, expect, test, vi } from 'vitest'

import MaterialMoveForm from '@/views/inventory/MaterialMoveForm.vue'

import { requestShapes } from '../../support/request-recorder.js'
import { mountForm, resetFakeHttp, toastCreate } from '../../support/form-harness.js'
import { useFakeHttp } from '../../support/fake-http.js'

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

// Still on the client fake, not the network seam: the materials search sends
// `q` to GET /api/inventory/inventory-materials/, which openapi/schema.yaml
// declares no query parameters for, and the seam would reject every test here.
// Move it once the schema declares `q` (see docs/test-suite-performance.md).
const fakeHttp = useFakeHttp()

beforeEach(() => {
  resetFakeHttp(fakeHttp, {})
  toastCreate.mockClear()
})

/** Let every pending promise in the submit path resolve. */
async function flush() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve()
  }
}

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
    fakeHttp.get.mockClear()

    await wrapper.vm.getMaterials('bout & moer #5+')
    await flush()

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
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

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([
      {
        method: 'post',
        path: '/api/inventory/material/5/move/',
        query: {},
        body: { from_location_id: 2, to_location_id: 3, amount: '10' },
      },
    ])
  })

})
