import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

// MaintenanceContractForm, rewritten into the feature folder. These specs
// began as the characterisation of the legacy screen and now hold the
// rewrite to the same requests, field for field — with the declared
// exceptions called out inline and collected in the Slice README.
import { MaintenanceContractForm } from '@/features/customer'
import {
  vCustomer,
  vPaginatedMaintenanceContractList,
  vPaginatedMaintenanceEquipmentList,
} from '@/api/valibot.gen'

import { goldenTest, goldensFor } from '../../helpers/golden.js'
import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { customerRoutes } from '../../support/customer-routes.js'

enableAutoUnmount(afterEach)

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * The maintenance-contract form, held to the characterisation.
 *
 * One component for create and edit. What it does:
 *
 *   - customers are picked through the customer autocomplete; equipment
 *     through the equipment autocomplete filtered to that customer — both
 *     debounced by half a second, as the legacy screen's were;
 *   - equipment rows are staged client-side (add/edit/delete) and replayed
 *     over the wire only on submit — after the contract itself, updates for
 *     the rows the backend has and creates for the staged ones in collection
 *     order, then the deletions, stopping at the first failure;
 *   - the request bodies are the parse output of the generated request
 *     schemas: exactly the fields the API declares. What the legacy wire
 *     carried and the rewrite does not — the `priceFields` junk, the dinero
 *     objects, the readonly response fields, the route's string pk as
 *     `contract`, the text input's digit string as `times_per_year` — is
 *     collected in the Slice README; DRF coerced all of it, so the typed
 *     bodies are the same requests, truthfully expressed;
 *   - the quick-create-equipment flow is repaired (declared): the legacy
 *     flow POSTed successfully and then threw — `this.maintenanceEquipment
 *     .equipment = response.id` named no property — so the created equipment
 *     never reached the form. It lands in the staged row now;
 *   - the contract-value input shows the running total again: the legacy
 *     bound `:value`, which bootstrap-vue-next's BFormInput no longer
 *     consumes, so the field rendered empty (declared repair).
 */

const api = installApiSeam()
const goldens = goldensFor('maintenance-contract-form')

const MAIN = { getMemberHasBranches: true, getDefaultCurrency: 'EUR', getCountries: [] }
const AUTH = { isPlanning: true, isAdmin: false }

const CONTRACT_ITEM = itemSchemaOf(vPaginatedMaintenanceContractList)
const EQUIPMENT_ITEM = itemSchemaOf(vPaginatedMaintenanceEquipmentList)

const CUSTOMER_VIEW = { id: 7, name: 'Acme BV', city: 'Gouda' }

function contractFixture(overrides = {}) {
  return fixtureFor(CONTRACT_ITEM, {
    id: 5,
    customer: 7,
    name: 'Gouda maintenance',
    customer_view: CUSTOMER_VIEW,
    sum_tariffs: '160.00',
    remarks: 'Yearly check',
    created_orders: 2,
    num_order_equipment: 3,
    num_equipment: 4,
    ...overrides,
  })
}

function equipmentRow(overrides = {}) {
  return fixtureFor(EQUIPMENT_ITEM, {
    id: 11,
    contract: 5,
    equipment: 21,
    equipment_name: 'Pump A',
    times_per_year: 4,
    remarks: '',
    tariff: '40.00',
    tariff_currency: 'EUR',
    num_order_equipment: 1,
    created_orders: 2,
    ...overrides,
  })
}

// The autocomplete response schemas are v.intersect compositions, which the
// fixture builder does not walk — these two are written out whole instead.
const AUTOCOMPLETE_CUSTOMER = {
  id: 7,
  name: 'Acme BV',
  address: 'Main 1',
  postal: '1234AB',
  city: 'Gouda',
  country_code: 'NL',
  contact: 'Jan de Vries',
  tel: '010 1234567',
  mobile: '06 12345678',
  email: 'info@acme.example',
  value: 'Acme BV',
  customer_id: '5013',
  remarks: null,
  products_without_tax: false,
  branch_id: null,
}

const AUTOCOMPLETE_EQUIPMENT = {
  id: 21,
  name: 'Pump A',
  value: 'Pump A',
  location: null,
  identifier: null,
  description: null,
}

/**
 * The form calls `this.$refs.multiselect_equipment.deactivate()` before the
 * quick-create POST, and the customer select focuses the name input through
 * the real BFormInput — a plain shallow stub has neither, so the stub needs
 * the contract the real vue-multiselect offers.
 */
const multiselectStub = {
  props: ['options'],
  emits: ['select', 'search-change'],
  methods: { deactivate: vi.fn() },
  template: '<div><input ref="search" value="" /></div>',
}

const MAIN_GETTERS = MAIN

async function mountContractForm(props = {}) {
  const wrapper = mountForm(MaintenanceContractForm, {
    deep: true,
    routes: customerRoutes,
    main: MAIN_GETTERS,
    auth: AUTH,
    props,
    stubs: { VueMultiselect: multiselectStub },
  })
  await settle()
  return wrapper
}

/** The two multiselect stubs, in template order: customer first, equipment second. */
function multiselects(wrapper) {
  return wrapper.findAllComponents(multiselectStub)
}

async function selectCustomer(wrapper) {
  await multiselects(wrapper)[0].vm.$emit('select', {
    id: 7,
    name: 'Acme BV',
    address: 'Main 1',
    city: 'Gouda',
    country_code: 'NL',
    tel: '010 1234567',
  })
  await settle()
}

async function selectEquipment(wrapper, option = { id: 21, name: 'Pump A' }) {
  await multiselects(wrapper)[1].vm.$emit('select', option)
  await settle()
}

async function addStagedRow(wrapper) {
  await wrapper.get('#maintenance_contract_name').setValue('Gouda')
  await selectCustomer(wrapper)
  await selectEquipment(wrapper)
  await wrapper.get('#maintenance-contract-equipment-times_per_year').setValue('4')
  await clickButton(wrapper, 'Add equipment')
  await settle()
}

async function clickButton(wrapper, text) {
  const button = wrapper.findAll('button').find((b) => b.text() === text)
  if (!button) throw new Error(`no button labelled "${text}"`)
  await button.trigger('click')
}

beforeEach(() => {
  api.get('/api/customer/customer/autocomplete/', [AUTOCOMPLETE_CUSTOMER])
  api.get('/api/equipment/equipment/autocomplete/', [AUTOCOMPLETE_EQUIPMENT])
  api.post('/api/equipment/equipment/create_quick/', { id: 21, name: 'Pump B' })
  api.post('/api/customer/maintenance-contract/', contractFixture())
  api.post('/api/customer/maintenance-equipment/', equipmentRow())
  api.get('/api/customer/maintenance-contract/{id}/', contractFixture())
  api.get('/api/customer/customer/{id}/', fixtureFor(vCustomer, {
    id: 7,
    name: 'Acme BV',
    address: 'Main 1',
    postal: '1234AB',
    city: 'Gouda',
    country_code: 'NL',
    tel: '010 1234567',
  }))
  api.get('/api/customer/maintenance-equipment/', paginated([equipmentRow()]))
  api.patch('/api/customer/maintenance-contract/{id}/', contractFixture())
  api.patch('/api/customer/maintenance-equipment/{id}/', equipmentRow())
  api.delete('/api/customer/maintenance-equipment/{id}/', noContent)
})

describe('MaintenanceContractForm, create', () => {
  goldenTest(goldens, 'create load and submit', 'maintenance-contract-form', async () => {
    const wrapper = await mountContractForm()
    await addStagedRow(wrapper)
    await clickButton(wrapper, 'Submit')
    await settle()
    return api.requests()
  })

  test('mounts without a request', async () => {
    await mountContractForm()

    expect(api.requests()).toEqual([])
  })

  test('searches customers by query, debounced half a second', async () => {
    const wrapper = await mountContractForm()

    await multiselects(wrapper)[0].vm.$emit('search-change', 'acme')
    await settle()
    // The half-second debounce the legacy AwesomeDebouncePromise had: no
    // request for the keystroke itself.
    expect(api.requests()).toEqual([])

    await new Promise((resolve) => setTimeout(resolve, 600))
    await settle()

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/customer/customer/autocomplete/', query: { q: 'acme' }, body: undefined },
    ])
  })

  test('searches equipment for the selected customer, debounced half a second', async () => {
    const wrapper = await mountContractForm()
    await selectCustomer(wrapper)

    await multiselects(wrapper)[1].vm.$emit('search-change', 'pump')
    await settle()
    await new Promise((resolve) => setTimeout(resolve, 600))
    await settle()

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/equipment/equipment/autocomplete/', query: { q: 'pump', customer: '7' }, body: undefined },
    ])
  })

  test('validation blocks an empty submit with no request', async () => {
    const wrapper = await mountContractForm()

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(api.requests()).toEqual([])
    expect(wrapper.text()).toContain('Please enter a contract name')
    expect(wrapper.text()).toContain('Please select a customer')
  })

  test('posts the contract, then the staged equipment rows', async () => {
    const wrapper = await mountContractForm()
    await addStagedRow(wrapper)

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(api.requests()).toEqual([
      {
        method: 'post',
        path: '/api/customer/maintenance-contract/',
        query: {},
        // The parse output. The legacy body also carried `equipment: []`
        // (the writable has no such field; the backend ignores it) and the
        // model's `priceFields` junk (README, "create body drops legacy
        // priceFields junk").
        body: { customer: 7, name: 'Gouda' },
      },
      {
        method: 'post',
        path: '/api/customer/maintenance-equipment/',
        query: {},
        // The typed row body: `times_per_year` is now the number the schema
        // declares (the legacy wire carried the text input's digit string),
        // and the dinero/currency/priceFields junk the legacy model
        // round-tripped is gone.
        body: { contract: 5, equipment: 21, equipment_name: 'Pump A', times_per_year: 4, tariff: '0.00' },
      },
    ])
    expect(toasts().map((toast) => toast.title)).toContain('Created')
    expect(routerGo()).toHaveBeenCalled()
  })

  test('shows the running contract value while staging', async () => {
    const wrapper = await mountContractForm()
    await addStagedRow(wrapper)

    // Declared repair (see the Slice README): the legacy bound `:value`,
    // which bootstrap-vue-next's BFormInput no longer consumes, so the total
    // never showed. The default tariff is 0.00 until a price is typed.
    expect(wrapper.get('#maintenance_contract_contract_value').element.value).toBe('€0.00')
    expect(wrapper.text()).toContain('Acme BV')
  })

  test('quick-created equipment reaches the staged row (declared repair)', async () => {
    const wrapper = await mountContractForm()
    await selectCustomer(wrapper)
    await settle()
    wrapper.vm.newEquipmentName = 'Pump B'

    await wrapper.vm.submitCreateEquipment()
    await settle()

    expect(api.requests()).toEqual([
      { method: 'post', path: '/api/equipment/equipment/create_quick/', query: {}, body: { customer: 7, name: 'Pump B' } },
    ])
    // The legacy flow POSTed and then threw — the result never reached the
    // form (README, declared repair). The staged row carries it now.
    expect(toasts().map((toast) => toast.body)).not.toContain('Error adding equipment')
    expect(wrapper.vm.rowEdit.equipment).toBe(21)
    expect(wrapper.vm.rowEdit.equipment_name).toBe('Pump B')
  })

  test('refuses to quick-create equipment without a branch-capable tenant', async () => {
    const wrapper = mountForm(MaintenanceContractForm, {
      deep: true,
      routes: customerRoutes,
      main: { ...MAIN_GETTERS, getMemberHasBranches: false },
      auth: AUTH,
      props: {},
      stubs: { VueMultiselect: multiselectStub },
    })
    await settle()
    wrapper.vm.newEquipmentName = 'Pump B'

    await wrapper.vm.submitCreateEquipment()
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Not creating equipment from branch environment')
    expect(api.requests()).toEqual([])
  })
})

describe('MaintenanceContractForm, edit', () => {
  goldenTest(goldens, 'edit load and save', 'maintenance-contract-form', async () => {
    const wrapper = await mountContractForm({ pk: '5' })
    await clickButton(wrapper, 'Submit')
    await settle()
    return api.requests()
  })

  test('loads the contract, the customer and the equipment', async () => {
    await mountContractForm({ pk: '5' })

    // Three independent reads, in parallel now (the legacy `loadData` ran
    // them in sequence — a declared change, collected in the README). The
    // customer detail cannot start before the contract names the customer,
    // but the equipment read races them both, so the spec compares sorted.
    expect(api.requests()).toHaveLength(3)
    expect(api.requests().slice().sort((a, b) => a.path.localeCompare(b.path))).toEqual([
      { method: 'get', path: '/api/customer/customer/7/', query: {}, body: undefined },
      { method: 'get', path: '/api/customer/maintenance-contract/5/', query: {}, body: undefined },
      { method: 'get', path: '/api/customer/maintenance-equipment/', query: { contract: '5', page: '1' }, body: undefined },
    ])
  })

  test('renders the loaded contract, customer and equipment', async () => {
    const wrapper = await mountContractForm({ pk: '5' })

    expect(wrapper.get('#maintenance_contract_name').element.value).toBe('Gouda maintenance')
    expect(wrapper.text()).toContain('Acme BV')
    expect(wrapper.text()).toContain('Pump A')
    // Declared repair, as in create: the total shows again.
    expect(wrapper.get('#maintenance_contract_contract_value').element.value).toBe('€40.00')
  })

  test('saving PATCHes the contract and every equipment row, changed or not', async () => {
    const wrapper = await mountContractForm({ pk: '5' })

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(api.requests().slice(3)).toEqual([
      {
        method: 'patch',
        path: '/api/customer/maintenance-contract/5/',
        query: {},
        // The parse output. The legacy PATCH carried the whole model — the
        // readonly response fields (`id`, `customer_view`, the counts, the
        // dinero objects) minus `created`/`modified` — and the rewrite keeps
        // only what the schema declares (README).
        body: { customer: 7, name: 'Gouda maintenance', remarks: 'Yearly check' },
      },
      {
        method: 'patch',
        path: '/api/customer/maintenance-equipment/11/',
        query: {},
        // The typed row body: the route's string pk as `contract` became the
        // number the schema declares (DRF coerced both).
        body: { contract: 5, equipment: 21, equipment_name: 'Pump A', times_per_year: 4, tariff: '40.00' },
      },
      // The save invalidates the equipment list (so the contract view and
      // list show the saved rows), and this form's own mounted equipment
      // query refetches as a result.
      { method: 'get', path: '/api/customer/maintenance-equipment/', query: { contract: '5', page: '1' }, body: undefined },
    ])
    // Every loaded row is PATCHed, changed or not — the legacy
    // `updateCollection` had no change guard, and the replay keeps that.
    expect(toasts().map((toast) => toast.title)).toContain('Updated')
    expect(routerGo()).toHaveBeenCalled()
  })

  test('a deleted row is removed last, after the updates', async () => {
    const wrapper = await mountContractForm({ pk: '5' })

    // The row's bin icon: the second link in the equipment row.
    const row = wrapper.get('.maintenance-contract-equipment tbody tr')
    await row.findAll('a')[1].trigger('click')
    await settle()
    expect(wrapper.findAll('.maintenance-contract-equipment tbody tr')).toHaveLength(0)

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(api.requests().slice(3)).toEqual([
      { method: 'patch', path: '/api/customer/maintenance-contract/5/', query: {}, body: expect.anything() },
      { method: 'delete', path: '/api/customer/maintenance-equipment/11/', query: {} },
      // The save invalidates the equipment list (so the contract view and
      // list show the saved rows), and this form's own mounted equipment
      // query refetches as a result.
      { method: 'get', path: '/api/customer/maintenance-equipment/', query: { contract: '5', page: '1' }, body: undefined },
    ])
    expect(toasts().map((toast) => toast.title)).toContain('Updated')
  })

  test('a row added on edit is created with the contract id', async () => {
    const wrapper = await mountContractForm({ pk: '5' })
    await selectEquipment(wrapper, { id: 22, name: 'Pump B' })
    await clickButton(wrapper, 'Add equipment')
    await settle()

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(api.requests().slice(3)).toEqual([
      { method: 'patch', path: '/api/customer/maintenance-contract/5/', query: {}, body: expect.anything() },
      // updateCollection walks the collection in order: the loaded row (it
      // has an id) is PATCHed before the staged row is created.
      { method: 'patch', path: '/api/customer/maintenance-equipment/11/', query: {}, body: expect.anything() },
      {
        method: 'post',
        path: '/api/customer/maintenance-equipment/',
        query: {},
        body: expect.objectContaining({ contract: 5, equipment: 22, equipment_name: 'Pump B', tariff: '0.00' }),
      },
      // The save invalidates the equipment list (so the contract view and
      // list show the saved rows), and this form's own mounted equipment
      // query refetches as a result.
      { method: 'get', path: '/api/customer/maintenance-equipment/', query: { contract: '5', page: '1' }, body: undefined },
    ])
  })
})
