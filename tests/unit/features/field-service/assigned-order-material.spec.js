import { beforeEach, describe, expect, test, vi } from 'vitest'

import AssignedOrderMaterial from '@/features/field-service/dispatch/AssignedOrderMaterial.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * The assigned-order material screen, characterised against the LEGACY screen
 * before it moved into `src/features/field-service/dispatch/`.
 *
 * **This file does not use the strict API seam, and cannot.** Three of the five
 * reads send query parameters openapi/schema.yaml does not declare, though the
 * backend reads them: `/api/inventory/inventory-locations/` is asked with
 * `q`, and `/api/inventory/inventory-materials-for-location/` with
 * `location` and `q` (both viewsets read `request.GET` directly, which is
 * why drf-spectacular cannot see them). The seam correctly refuses an
 * undeclared parameter, so it would fail every test here for a reason that is
 * not the screen's. It uses the older client-shape harness instead. The fix is
 * the backend's: declare the parameters and regenerate.
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
  const mock = apiClientMock(fakeHttp)
  // The generated `<operation>Options` wrapper asks the client for its baseURL
  // when it builds the query key; the client fake has no config of its own.
  mock.client.getConfig = () => ({baseURL: ''})
  return mock
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

const location = {location_id: 4, location_name: 'Magazijn', total_amount: 12}
const material = {material_id: 9, material_name: 'Cable', material_identifier: 'CBL-1', total_amount: 3}
const assignedOrder = {id: 501, order_date: '14-09-2026', user_full_name: 'Jan', order_name: 'Acme', order_city: 'Utrecht'}

beforeEach(() => {
  resetFakeHttp(fakeHttp, {
    '/api/inventory/inventory-locations/': [location],
    '/api/inventory/inventory-materials-for-location/': [material],
    '/api/mobile/assignedorder/': {count: 0, results: []},
    '/api/mobile/assignedordermaterial/': {count: 0, results: []},
  })
})

describe('AssignedOrderMaterial - what it reads on open', () => {
  test('asks for the stock locations once', async () => {
    const wrapper = mount()
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())

    expect(requestShapes(fakeHttp, {method: 'get'}).some(
      (shape) => shape.path === '/api/inventory/inventory-locations/',
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

    wrapper.vm.selectLocation(location)
    await vi.waitFor(() => expect(requestShapes(fakeHttp, {method: 'get'}).some(
      (shape) => shape.path === '/api/inventory/inventory-materials-for-location/',
    )).toBe(true))

    expect(requestShapes(fakeHttp, {method: 'get'}).filter(
      (shape) => shape.path === '/api/inventory/inventory-materials-for-location/',
    ).at(-1)).toEqual({
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

    wrapper.vm.selectAssignedOrder(assignedOrder)
    await vi.waitFor(() => expect(requestShapes(fakeHttp, {method: 'get'}).some(
      (shape) => shape.path === '/api/mobile/assignedordermaterial/',
    )).toBe(true))

    expect(requestShapes(fakeHttp, {method: 'get'}).filter(
      (shape) => shape.path === '/api/mobile/assignedordermaterial/',
    ).at(-1)).toEqual({
      method: 'get',
      path: '/api/mobile/assignedordermaterial/',
      query: {page: '1', assigned_order: '501'},
      body: undefined,
    })

    wrapper.unmount()
  })
})

describe('AssignedOrderMaterial - what it writes', () => {
  /** The three picks and the amount, as the form's own values. */
  async function fill(wrapper, {amount = 3} = {}) {
    wrapper.vm.values.assigned_order = 501
    wrapper.vm.values.location = 4
    wrapper.vm.values.material = 9
    wrapper.vm.values.amount = amount
    await wrapper.vm.$nextTick()
  }

  test('an incomplete form is refused, field by field, before anything is sent', async () => {
    const wrapper = mount()
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())

    await wrapper.vm.submitForm()

    expect(fakeHttp.post).not.toHaveBeenCalled()
    expect(wrapper.vm.errors.assigned_order).toBe('Please select an order')
    expect(wrapper.vm.errors.location).toBe('Please select a location')
    expect(wrapper.vm.errors.material).toBe('Please select a material')
    expect(wrapper.vm.errors.amount).toBe('Please enter an amount')

    wrapper.unmount()
  })

  test('an amount of zero is refused rather than registered', async () => {
    const wrapper = mount()
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())

    await fill(wrapper, {amount: 0})
    await wrapper.vm.submitForm()

    expect(fakeHttp.post).not.toHaveBeenCalled()
    expect(wrapper.vm.errors.amount).toBe('Please enter an amount')

    wrapper.unmount()
  })

  test('a valid registration posts the picked ids and the amount the schema declares', async () => {
    const wrapper = mount()
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())

    await fill(wrapper)
    wrapper.vm.selectLocation(location)
    wrapper.vm.selectMaterial(material)
    await wrapper.vm.submitForm()

    expect(fakeHttp.post).toHaveBeenCalled()
    const [url, body] = fakeHttp.post.mock.calls.at(-1)
    expect(url).toBe('/api/mobile/assignedordermaterial/')
    // `amount` is a decimal *string* in the request schema, so the number the
    // input holds is sent as one.
    expect(body).toMatchObject({assigned_order: 501, material: 9, location: 4, amount: '3'})

    wrapper.unmount()
  })
})
