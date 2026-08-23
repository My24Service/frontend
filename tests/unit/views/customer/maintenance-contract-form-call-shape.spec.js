import { beforeEach, describe, expect, test, vi } from 'vitest'

import MaintenanceContractForm from '@/views/customer/MaintenanceContractForm.vue'

import { mountForm, resetFakeHttp, toastCreate } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Call-shape characterisation for the MaintenanceContractForm custom-endpoint
 * calls that moved from the hand-written Customer/Equipment services to the
 * generated SDK.
 *
 * Golden shapes, derived from 192a67d9 (pre-refactor):
 *
 * - getCustomers: old CustomerService.search(q) GETed
 *   `/customer/customer/autocomplete/?q=<q>`; new
 *   customerCustomerAutocompleteList GETs
 *   `/api/customer/customer/autocomplete/` with `query: { q }`. Identical.
 * - getEquipment: old EquipmentService.searchCustomer(q, customerPk) GETed
 *   `/equipment/equipment/autocomplete/?q=<q>&customer=<pk>`; new
 *   equipmentEquipmentAutocompleteList GETs
 *   `/api/equipment/equipment/autocomplete/` with `query: { q, customer }`.
 *   Identical.
 * - submitCreateEquipment: old EquipmentService.quickAddCustomerPlanning(name, pk)
 *   POSTed `/equipment/equipment/create_quick/` with `{ customer: pk, name }`
 *   (and quickAddCustomerNonPlanning posted `{ customer: 0, name }`); new
 *   equipmentEquipmentCreateQuickCreate POSTs `/api/equipment/equipment/create_quick/`
 *   with the identical body for both the planning/admin and the fallback branch.
 *
 * BaseModel CRUD (maintenanceContractService/equipmentService insert/update/
 * list/detail) is not part of the refactor and is not asserted here.
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

/**
 * The form calls `this.$refs.multiselect_equipment.deactivate()` before the
 * quick-create POST; a plain shallow stub has no methods, so it needs the
 * contract the real vue-multiselect offers.
 */
const multiselectStub = {
  props: ['options'],
  emits: ['select', 'search-change'],
  methods: { deactivate: vi.fn() },
  template: '<div />',
}

const MAIN = { getMemberHasBranches: true, getDefaultCurrency: 'EUR', getCountries: [] }

function mountCreate(auth = {}) {
  return mountForm(MaintenanceContractForm, {
    main: MAIN,
    auth: { isPlanning: true, isAdmin: false, ...auth },
    stubs: { VueMultiselect: multiselectStub },
  })
}

async function flushPromises() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

beforeEach(() => {
  resetFakeHttp(fakeHttp)
  toastCreate.mockClear()
})

describe('MaintenanceContractForm - call shapes', () => {
  test('searches customers by query', async () => {
    fakeHttp.get.mockResolvedValue({ data: [{ id: 1, name: 'ACME' }] })

    const wrapper = mountCreate()
    await flushPromises()
    fakeHttp.get.mockClear()

    await wrapper.vm.getCustomers('acme')

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/customer/customer/autocomplete/', query: { q: 'acme' }, body: undefined },
    ])
  })

  test('searches equipment for the selected customer', async () => {
    fakeHttp.get.mockResolvedValue({ data: [{ id: 7, name: 'Pump' }] })

    const wrapper = mountCreate()
    await flushPromises()
    fakeHttp.get.mockClear()
    wrapper.vm.customer.id = 5

    await wrapper.vm.getEquipment('wid')

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      {
        method: 'get',
        path: '/api/equipment/equipment/autocomplete/',
        query: { q: 'wid', customer: '5' },
        body: undefined,
      },
    ])
  })

  test('quick-creates equipment for the customer when planning or admin', async () => {
    fakeHttp.post.mockResolvedValue({ data: { id: 7, name: 'Pump' } })

    const wrapper = mountCreate()
    await flushPromises()
    fakeHttp.post.mockClear()
    wrapper.vm.customer = { id: 5, name: 'ACME' }
    wrapper.vm.newEquipmentName = 'Pump'
    // The equipment panel (and its multiselect) only renders once a customer
    // is selected; reassigning customer reactively triggers that render.
    await vi.waitFor(() => expect(wrapper.vm.$refs.multiselect_equipment).toBeTruthy())

    await wrapper.vm.submitCreateEquipment()

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([
      {
        method: 'post',
        path: '/api/equipment/equipment/create_quick/',
        query: {},
        body: { customer: 5, name: 'Pump' },
      },
    ])
  })

  test('quick-creates equipment without a customer otherwise', async () => {
    fakeHttp.post.mockResolvedValue({ data: { id: 8, name: 'Pump' } })

    const wrapper = mountCreate({ isPlanning: false, isAdmin: false })
    await flushPromises()
    fakeHttp.post.mockClear()
    // Even the customer:0 branch runs from the equipment panel, which only
    // renders with a selected customer - so set one (the assertion is the
    // POST body, which uses 0 for non-planning users).
    wrapper.vm.customer = { id: 5, name: 'ACME' }
    wrapper.vm.newEquipmentName = 'Pump'
    await vi.waitFor(() => expect(wrapper.vm.$refs.multiselect_equipment).toBeTruthy())

    await wrapper.vm.submitCreateEquipment()

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([
      {
        method: 'post',
        path: '/api/equipment/equipment/create_quick/',
        query: {},
        body: { customer: 0, name: 'Pump' },
      },
    ])
  })
})
