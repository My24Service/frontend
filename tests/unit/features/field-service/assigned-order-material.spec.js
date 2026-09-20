import { beforeEach, describe, expect, test, vi } from 'vitest'

import AssignedOrderMaterial from '@/views/mobile/AssignedOrderMaterial.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Characterisation of the assigned-order material screen, written against the
 * LEGACY screen before it moves into
 * `src/features/field-service/dispatch/`.
 *
 * **This file does not use the strict API seam, and cannot.** Three of the five
 * reads send query parameters openapi/schema.yaml does not declare, though the
 * backend reads them: `/api/inventory/inventory-locations/` is asked with
 * `q`, and `/api/inventory/inventory-materials-for-location/` with
 * `location` and `q` (both viewsets read `request.GET` directly, which is
 * why drf-spectacular cannot see them). The seam correctly refuses an
 * undeclared parameter, so it would fail every test here for a reason that is
 * not the screen's. It uses the older client-shape harness instead, which is
 * what `support/api-client-mock.js` and `request-recorder.js` still exist
 * for. The fix is the backend's: declare the parameters and regenerate.
 *
 * The screen is also worth flagging: `src/router/mobile.js` imports it and
 * mounts it at no route, so nothing reaches it in the application today.
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

function mount() {
  return mountForm(AssignedOrderMaterial, {
    deep: true,
    main: {getCurrentLanguage: 'nl'},
    stubs: {
      VueMultiselect: {template: '<div />'},
    },
  })
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, {
    '/api/inventory/inventory-locations/': [
      {location_id: 4, location_name: 'Magazijn', total_amount: 12},
    ],
    '/api/inventory/inventory-materials-for-location/': [
      {material_id: 9, material_name: 'Cable', material_identifier: 'CBL-1', total_amount: 3},
    ],
    '/api/mobile/assignedorder/': {count: 0, results: []},
    '/api/mobile/assignedordermaterial/': {count: 0, results: []},
  })
})

describe('AssignedOrderMaterial - what it reads on open', () => {
  test('asks for the stock locations once, with the empty search term it always sent', async () => {
    const wrapper = mount()
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())

    expect(requestShapes(fakeHttp, {method: 'get'}).some(
      (shape) => shape.path === '/api/inventory/inventory-locations/' && shape.query.q === '',
    )).toBe(true)

    wrapper.unmount()
  })

  test('opens the assigned-order picker on the assigned-order list', async () => {
    const wrapper = mount()
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())

    expect(requestShapes(fakeHttp, {method: 'get'}).some(
      (shape) => shape.path === '/api/mobile/assignedorder/',
    )).toBe(true)

    wrapper.unmount()
  })

  test('reading the materials of one location asks for that location', async () => {
    const wrapper = mount()
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())

    await wrapper.vm.selectLocation({location_id: 4, location_name: 'Magazijn', total_amount: 12})

    expect(requestShapes(fakeHttp, {method: 'get'}).at(-1)).toEqual({
      method: 'get',
      path: '/api/inventory/inventory-materials-for-location/',
      query: {location: '4', q: ''},
      body: undefined,
    })

    wrapper.unmount()
  })

  test('picking an assigned order lists that order\'s materials', async () => {
    const wrapper = mount()
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())

    wrapper.vm.selectAssignedOrder({id: 501, order_date: '14-09-2026', user_full_name: 'Jan', order_name: 'Acme', order_city: 'Utrecht'})
    await vi.waitFor(() => expect(requestShapes(fakeHttp, {method: 'get'}).some(
      (shape) => shape.path === '/api/mobile/assignedordermaterial/',
    )).toBe(true))

    expect(requestShapes(fakeHttp, {method: 'get'}).at(-1)).toEqual({
      method: 'get',
      path: '/api/mobile/assignedordermaterial/',
      query: {page: '1', assigned_order: '501'},
      body: undefined,
    })

    wrapper.unmount()
  })
})

describe('AssignedOrderMaterial - what it writes', () => {
  test('an amount of zero is refused before anything is sent', async () => {
    const wrapper = mount()
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())

    wrapper.vm.selectedAssignedOrderPk = 501
    wrapper.vm.selectedLocationPk = 4
    wrapper.vm.selectedMaterialPk = 9
    wrapper.vm.amount = 0
    await wrapper.vm.submitForm()

    expect(fakeHttp.post).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  test('a valid registration posts the picked ids and the amount', async () => {
    const wrapper = mount()
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())

    wrapper.vm.selectedAssignedOrderPk = 501
    wrapper.vm.selectedLocationPk = 4
    wrapper.vm.selectedMaterialPk = 9
    wrapper.vm.selectedMaterialName = 'Cable'
    wrapper.vm.amount = 3
    await wrapper.vm.submitForm()

    expect(fakeHttp.post).toHaveBeenCalled()
    const [url, body] = fakeHttp.post.mock.calls[0]
    expect(url).toBe('/mobile/assignedordermaterial/')
    expect(body).toMatchObject({assigned_order: 501, material: 9, location: 4, amount: 3})

    wrapper.unmount()
  })
})
