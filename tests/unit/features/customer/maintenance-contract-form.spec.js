import { beforeEach, describe, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'

import { MaintenanceContractForm } from '@/features/customer'
import {
  vCustomer,
  vMaintenanceContractWithEquipmentResponse,
  vPaginatedMaintenanceContractList,
  vPaginatedMaintenanceEquipmentList,
} from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { customerRoutes } from '../../support/customer-routes.js'

// THE SAVE IS ONE REQUEST.
//
// The form used to POST the contract and then write its equipment rows one
// request at a time through `staging.replay`, which threw on the first failure:
// a mid-loop failure left a partial set, `sum_tariffs` is derived from those
// rows so it stayed wrong until someone fixed the set, and the retry re-created
// every earlier row and re-DELETEd the ids it had already deleted (404).
// `POST /api/customer/maintenance-contract[/{id}]/with-equipment/` takes the
// contract and the whole `equipment` list in one transaction and answers with
// the stored rows, so this spec pins the traffic a given form state produces -
// which endpoint, with which body - plus the two guarantees that come with it:
// a failed save leaves nothing behind, and a later save addresses the rows the
// first one stored instead of writing them again.
//
// The requests are read off the wire (tests/unit/support/api-seam), and the
// seam validates each body against the operation's generated request schema.
// The per-row endpoints the loop used are stubbed but never expected to be
// called: if the loop comes back, the assertions below name the leaked requests
// instead of failing with "no response registered".

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const MAIN = { getMemberHasBranches: true, getDefaultCurrency: 'EUR', getCountries: [] }
const AUTH = { isPlanning: true, isAdmin: false }

const CONTRACT_ITEM = itemSchemaOf(vPaginatedMaintenanceContractList)
const EQUIPMENT_ITEM = itemSchemaOf(vPaginatedMaintenanceEquipmentList)

const CUSTOMER_VIEW = { id: 7, name: 'Acme BV', city: 'Gouda' }

/** The contract's own fields, as the two contract fixtures below carry them. */
const CONTRACT_FIELDS = {
  id: 5,
  customer: 7,
  name: 'Gouda maintenance',
  customer_view: CUSTOMER_VIEW,
  sum_tariffs: '160.00',
  remarks: 'Yearly check',
  created_orders: 2,
  num_order_equipment: 3,
  num_equipment: 4,
}

function contractFixture(overrides = {}) {
  return fixtureFor(CONTRACT_ITEM, {
    ...CONTRACT_FIELDS,
    ...overrides,
  })
}

/**
 * What the with-equipment pair answers with: the contract detail plus the
 * stored equipment rows, ids and all. That response is the only place a staged
 * row's id can come from, so it is what the adoption is read off.
 */
function contractWithEquipmentFixture(overrides = {}) {
  return fixtureFor(vMaintenanceContractWithEquipmentResponse, {
    ...CONTRACT_FIELDS,
    equipment: [equipmentRow()],
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

const AUTOCOMPLETE_CUSTOMER = {
  id: 7,
  name: 'Acme BV',
  address: 'Main 1',
  postal: '1234AB',
  city: 'Gouda',
  country_code: 'NL',
  contact: 'Jan de Vries',
  tel: '+31101234567',
  mobile: '+31612345678',
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

const multiselectStub = {
  props: ['options'],
  emits: ['select', 'search-change'],
  methods: { deactivate: vi.fn() },
  template: '<div><input ref="search" value="" /></div>',
}

// The quick-create b-modal teleports to document.body and needs the library's
// modal manager, neither of which exists in this harness (the mount warns
// about the missing modalManager injection and an OK click sends nothing).
// This shell renders the modal content inline so the spec drives the real
// input and the component's real `@ok` binding through the DOM.
const modalShellStub = {
  emits: ['ok', 'cancel'],
  methods: { show() {}, hide() {} },
  template: '<div><slot /><button type="button" class="quick-create-ok" @click="$emit(\'ok\')">OK</button></div>',
}

const MAIN_GETTERS = MAIN

async function mountContractForm(props = {}, main = MAIN_GETTERS) {
  const wrapper = mountForm(MaintenanceContractForm, {
    deep: true,
    routes: customerRoutes,
    main,
    auth: AUTH,
    props,
    stubs: { VueMultiselect: multiselectStub, 'b-modal': modalShellStub },
  })
  await settle()
  return wrapper
}

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
    tel: '+31101234567',
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
  const buttons = wrapper.findAll('button').filter((b) => b.text() === text)
  const button = buttons.find((b) => b.isVisible()) ?? buttons[0]
  if (!button) throw new Error(`no button labelled "${text}"`)
  await button.trigger('click')
}

beforeEach(() => {
  api.get('/api/customer/customer/autocomplete/', [AUTOCOMPLETE_CUSTOMER])
  api.get('/api/equipment/equipment/autocomplete/', [AUTOCOMPLETE_EQUIPMENT])
  api.post('/api/equipment/equipment/create_quick/', { id: 21, name: 'Pump B' })
  api.post('/api/customer/maintenance-contract/with-equipment/', contractWithEquipmentFixture())
  api.post('/api/customer/maintenance-contract/{id}/with-equipment/', contractWithEquipmentFixture())
  api.get('/api/customer/maintenance-contract/{id}/', contractFixture())
  api.get('/api/customer/customer/{id}/', fixtureFor(vCustomer, {
    id: 7,
    name: 'Acme BV',
    address: 'Main 1',
    postal: '1234AB',
    city: 'Gouda',
    country_code: 'NL',
    tel: '+31101234567',
  }))
  api.get('/api/customer/maintenance-equipment/', paginated([equipmentRow()]))
  // The writes the single request replaces. Stubbed so a leaked one shows up as
  // a named request in the assertions below rather than as a violation.
  api.post('/api/customer/maintenance-contract/', contractFixture())
  api.patch('/api/customer/maintenance-contract/{id}/', contractFixture())
  api.post('/api/customer/maintenance-equipment/', equipmentRow())
  api.patch('/api/customer/maintenance-equipment/{id}/', equipmentRow())
  api.delete('/api/customer/maintenance-equipment/{id}/', noContent)
})

describe('MaintenanceContractForm, create', () => {
  test('mounts without a request', async () => {
    await mountContractForm()

    expect(api.requests()).toEqual([])
  })

  test('searches customers by query, debounced half a second', async () => {
    const wrapper = await mountContractForm()

    await multiselects(wrapper)[0].vm.$emit('search-change', 'acme')
    await settle()
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

  test('saves the contract and its whole equipment set in one request', async () => {
    const wrapper = await mountContractForm()
    await addStagedRow(wrapper)

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(api.requests()).toEqual([
      {
        method: 'post',
        path: '/api/customer/maintenance-contract/with-equipment/',
        query: {},
        body: {
          customer: 7,
          name: 'Gouda',
          equipment: [
            // The tariff travels with the currency it is in: a bare amount lets
            // the server fall back to the column's default and relabel a USD or
            // GBP tenant's tariffs as EUR.
            {equipment: 21, equipment_name: 'Pump A', times_per_year: 4, tariff: '0.00',
              tariff_currency: 'EUR'},
          ],
        },
      },
    ])
    expect(toasts().map((toast) => toast.title)).toContain('Created')
    expect(routerGo()).toHaveBeenCalled()
  })

  test('a failed save creates nothing, and the retry is the same single request', async () => {
    // The contract and its equipment are one atomic request, so there is no
    // half-saved set for a retry to build on: the second attempt is the first
    // attempt again, not a second contract carrying the rows the first one
    // managed to write.
    let attempts = 0
    api.post('/api/customer/maintenance-contract/with-equipment/', () => {
      attempts += 1
      return attempts === 1
        ? HttpResponse.json({ detail: 'boom' }, { status: 500 })
        : contractWithEquipmentFixture()
    })

    const wrapper = await mountContractForm()
    await addStagedRow(wrapper)

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Error creating maintenance contract')
    expect(routerGo()).not.toHaveBeenCalled()
    expect(api.requests().map((request) => request.path)).toEqual([
      '/api/customer/maintenance-contract/with-equipment/',
    ])

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(api.requests().map((request) => request.path)).toEqual([
      '/api/customer/maintenance-contract/with-equipment/',
      '/api/customer/maintenance-contract/with-equipment/',
    ])
    expect(api.requests()[1].body).toEqual(api.requests()[0].body)
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('adopts the ids the save stored, so a later save updates them instead of re-creating', async () => {
    // A create has no rows on the server yet, so the create form's equipment
    // read is off and never refetches: id 31 can only have come from the save's
    // own response. Without it the second save stages the row as a new one
    // again and the endpoint writes a second row beside the first - the shape
    // of the bug the old per-row replay had on every retry.
    api.post('/api/customer/maintenance-contract/with-equipment/', contractWithEquipmentFixture({
      // The stored row as the server would return it for what was just sent.
      equipment: [equipmentRow({ id: 31, tariff: '0.00' })],
    }))

    const wrapper = await mountContractForm()
    await addStagedRow(wrapper)

    await clickButton(wrapper, 'Submit')
    await settle()
    await clickButton(wrapper, 'Submit')
    await settle()

    // The second save is the update half of the pair: the receipt of the first
    // one named the contract, so the form no longer treats it as a create.
    expect(api.requests().map((request) => [request.method, request.path])).toEqual([
      ['post', '/api/customer/maintenance-contract/with-equipment/'],
      ['post', '/api/customer/maintenance-contract/5/with-equipment/'],
    ])
    expect(api.requests()[1].body.equipment).toEqual([
      {id: 31, equipment: 21, equipment_name: 'Pump A', times_per_year: 4, tariff: '0.00',
        tariff_currency: 'EUR'},
    ])
  })

  test('shows the running contract value while staging', async () => {
    const wrapper = await mountContractForm()
    await addStagedRow(wrapper)

    expect(wrapper.get('#maintenance_contract_contract_value').element.value).toBe('€0.00')
    expect(wrapper.text()).toContain('Acme BV')
  })

  test('quick-created equipment reaches the staged row (declared repair)', async () => {
    const wrapper = await mountContractForm()
    await selectCustomer(wrapper)
    await settle()

    await wrapper.get('#maintenance_equipment_new_equipment').setValue('Pump B')
    await wrapper.get('.quick-create-ok').trigger('click')
    await settle()

    expect(api.requests()).toEqual([
      { method: 'post', path: '/api/equipment/equipment/create_quick/', query: {}, body: { customer: 7, name: 'Pump B' } },
    ])
    expect(toasts().map((toast) => toast.body)).not.toContain('Error adding equipment')
    await wrapper.get('#maintenance_contract_name').setValue('Gouda')
    await wrapper.get('#maintenance-contract-equipment-times_per_year').setValue('4')
    await clickButton(wrapper, 'Add equipment')
    await settle()
    await clickButton(wrapper, 'Submit')
    await settle()
    const save = api.requests().find(
      (request) => request.path === '/api/customer/maintenance-contract/with-equipment/',
    )
    expect(save.body.equipment).toEqual([
      {equipment: 21, equipment_name: 'Pump B', times_per_year: 4, tariff: '0.00',
        tariff_currency: 'EUR'},
    ])
  })

  test('refuses to quick-create equipment without a branch-capable tenant', async () => {
    const wrapper = await mountContractForm({}, { ...MAIN_GETTERS, getMemberHasBranches: false })
    await selectCustomer(wrapper)
    await settle()

    await wrapper.get('#maintenance_equipment_new_equipment').setValue('Pump B')
    await wrapper.get('.quick-create-ok').trigger('click')
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Not creating equipment from branch environment')
    expect(api.requests()).toEqual([])
  })
})

describe('MaintenanceContractForm, staged-row edit-then-cancel', () => {
  async function startRowEdit(wrapper) {
    const row = wrapper.get('.maintenance-contract-equipment tbody tr')
    await row.findAll('a')[0].trigger('click')
    await settle()
  }

  function equipmentFooterButton(wrapper, text) {
    const footer = wrapper.get('.maintenance-contract-equipment footer')
    const button = footer.findAll('button').find((b) => b.text() === text)
    if (!button) throw new Error(`no equipment footer button labelled "${text}"`)
    return button
  }

  test('cancel discards the staged edit instead of mutating the row', async () => {
    const wrapper = await mountContractForm({ pk: '5' })
    await startRowEdit(wrapper)
    expect(wrapper.get('#maintenance-contract-equipment-times_per_year').element.value).toBe('4')

    await wrapper.get('#maintenance-contract-equipment-times_per_year').setValue('9')
    await equipmentFooterButton(wrapper, 'Cancel').trigger('click')
    await settle()

    const rowText = wrapper.get('.maintenance-contract-equipment tbody tr').text()
    expect(rowText).not.toContain('9')
    expect(equipmentFooterButton(wrapper, 'Add equipment')).toBeDefined()

    await clickButton(wrapper, 'Submit')
    await settle()
    const save = api.requests().find(
      (request) => request.path === '/api/customer/maintenance-contract/5/with-equipment/',
    )
    expect(save.body.equipment).toEqual([
      {id: 11, equipment: 21, equipment_name: 'Pump A', times_per_year: 4, tariff: '40.00',
        tariff_currency: 'EUR'},
    ])
  })

  test('commit writes the staged edit into the row', async () => {
    const wrapper = await mountContractForm({ pk: '5' })
    await startRowEdit(wrapper)

    await wrapper.get('#maintenance-contract-equipment-times_per_year').setValue('9')
    await equipmentFooterButton(wrapper, 'Edit equipment').trigger('click')
    await settle()

    expect(wrapper.get('.maintenance-contract-equipment tbody tr').text()).toContain('9')
  })
})

describe('MaintenanceContractForm, staged-row validation', () => {
  test('a non-numeric times_per_year blocks submit with no request and a row error', async () => {
    const wrapper = await mountContractForm()
    await wrapper.get('#maintenance_contract_name').setValue('Gouda')
    await selectCustomer(wrapper)
    await selectEquipment(wrapper)
    await wrapper.get('#maintenance-contract-equipment-times_per_year').setValue('abc')

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(api.requests()).toEqual([])
    expect(wrapper.text()).toContain('Please enter a number')
  })

  test('a committed row with a bad times_per_year blocks submit and shows the equipment failure', async () => {
    const wrapper = await mountContractForm()
    await wrapper.get('#maintenance_contract_name').setValue('Gouda')
    await selectCustomer(wrapper)
    await selectEquipment(wrapper)
    await wrapper.get('#maintenance-contract-equipment-times_per_year').setValue('abc')
    await clickButton(wrapper, 'Add equipment')
    await settle()
    expect(wrapper.findAll('.maintenance-contract-equipment tbody tr')).toHaveLength(1)

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(api.requests()).toEqual([])
    const feedback = wrapper.get('.maintenance-contract-equipment .invalid-feedback')
    expect(feedback.text()).toContain('Please fix the equipment rows before saving')
  })
})

describe('MaintenanceContractForm, editingIndex on delete', () => {
  test('deleting a row above the edited one keeps the edit on the right row', async () => {
    const wrapper = await mountContractForm({ pk: '5' })
    await selectEquipment(wrapper, { id: 22, name: 'Pump B' })
    await wrapper.get('#maintenance-contract-equipment-times_per_year').setValue('2')
    await clickButton(wrapper, 'Add equipment')
    await settle()
    expect(wrapper.findAll('.maintenance-contract-equipment tbody tr')).toHaveLength(2)

    const rows = () => wrapper.findAll('.maintenance-contract-equipment tbody tr')
    await rows()[1].findAll('a')[0].trigger('click')
    await settle()
    await wrapper.get('#maintenance-contract-equipment-times_per_year').setValue('9')

    await rows()[0].findAll('a')[1].trigger('click')
    await settle()

    const footer = wrapper.get('.maintenance-contract-equipment footer')
    await footer.findAll('button').find((b) => b.text() === 'Edit equipment').trigger('click')
    await settle()

    const remaining = wrapper.findAll('.maintenance-contract-equipment tbody tr')
    expect(remaining).toHaveLength(1)
    expect(remaining[0].text()).toContain('Pump B')
    expect(remaining[0].text()).toContain('9')
  })
})

describe('MaintenanceContractForm, edit', () => {
  // A save sends the staged set as the contract's whole equipment set, so the
  // read must carry every row of the contract: `page_size` 1000, the API's
  // paginator ceiling (my24service `apps/core/rest.py`
  // My24Pagination.max_page_size), which clamps a larger value rather than
  // rejecting it. A page-1 read would hide every row past 20 from the editor -
  // and, now that the set is a replace-set, send a save that deletes them.
  test('loads the contract, the customer and the whole equipment set', async () => {
    await mountContractForm({ pk: '5' })

    expect(api.requests()).toHaveLength(3)
    expect(api.requests().slice().sort((a, b) => a.path.localeCompare(b.path))).toEqual([
      { method: 'get', path: '/api/customer/customer/7/', query: {}, body: undefined },
      { method: 'get', path: '/api/customer/maintenance-contract/5/', query: {}, body: undefined },
      {
        method: 'get',
        path: '/api/customer/maintenance-equipment/',
        query: { contract: '5', page: '1', page_size: '1000' },
        body: undefined,
      },
    ])
  })

  test('renders the loaded contract, customer and equipment', async () => {
    const wrapper = await mountContractForm({ pk: '5' })

    expect(wrapper.get('#maintenance_contract_name').element.value).toBe('Gouda maintenance')
    expect(wrapper.text()).toContain('Acme BV')
    expect(wrapper.text()).toContain('Pump A')
    expect(wrapper.get('#maintenance_contract_contract_value').element.value).toBe('€40.00')
  })

  test('saving carries the contract and every equipment row, changed or not', async () => {
    const wrapper = await mountContractForm({ pk: '5' })

    await clickButton(wrapper, 'Submit')
    await settle()

    // Then the equipment list refetches, because the save made it stale.
    expect(api.requests().slice(3)).toEqual([
      {
        method: 'post',
        path: '/api/customer/maintenance-contract/5/with-equipment/',
        query: {},
        body: {
          customer: 7,
          name: 'Gouda maintenance',
          remarks: 'Yearly check',
          equipment: [
            {id: 11, equipment: 21, equipment_name: 'Pump A', times_per_year: 4, tariff: '40.00',
              tariff_currency: 'EUR'},
          ],
        },
      },
      {
        method: 'get',
        path: '/api/customer/maintenance-equipment/',
        query: { contract: '5', page: '1', page_size: '1000' },
        body: undefined,
      },
    ])
    expect(toasts().map((toast) => toast.title)).toContain('Updated')
    expect(routerGo()).toHaveBeenCalled()
  })

  test('a deleted row is deleted by its absence from the set', async () => {
    const wrapper = await mountContractForm({ pk: '5' })
    // What the server answers once the row is gone, so the reload below is the
    // read of a contract that no longer has it.
    api.get('/api/customer/maintenance-equipment/', paginated([]))

    const row = wrapper.get('.maintenance-contract-equipment tbody tr')
    await row.findAll('a')[1].trigger('click')
    await settle()
    expect(wrapper.findAll('.maintenance-contract-equipment tbody tr')).toHaveLength(0)

    await clickButton(wrapper, 'Submit')
    await settle()

    // No DELETE request: the stored row the list leaves out is what the
    // endpoint removes, in the same transaction as the rest of the set.
    expect(api.requests().slice(3)).toEqual([
      {
        method: 'post',
        path: '/api/customer/maintenance-contract/5/with-equipment/',
        query: {},
        body: expect.objectContaining({ equipment: [] }),
      },
      {
        method: 'get',
        path: '/api/customer/maintenance-equipment/',
        query: { contract: '5', page: '1', page_size: '1000' },
        body: undefined,
      },
    ])
    expect(toasts().map((toast) => toast.title)).toContain('Updated')
  })

  test('a row added on edit joins the same request as the stored ones', async () => {
    const wrapper = await mountContractForm({ pk: '5' })
    await selectEquipment(wrapper, { id: 22, name: 'Pump B' })
    await clickButton(wrapper, 'Add equipment')
    await settle()

    await clickButton(wrapper, 'Submit')
    await settle()

    // The stored row keeps its id and so updates; the row without one is
    // created. One request carries both.
    expect(api.requests().slice(3)).toEqual([
      {
        method: 'post',
        path: '/api/customer/maintenance-contract/5/with-equipment/',
        query: {},
        body: expect.objectContaining({
          equipment: [
            {id: 11, equipment: 21, equipment_name: 'Pump A', times_per_year: 4, tariff: '40.00',
              tariff_currency: 'EUR'},
            {equipment: 22, equipment_name: 'Pump B', tariff: '0.00', tariff_currency: 'EUR'},
          ],
        }),
      },
      {
        method: 'get',
        path: '/api/customer/maintenance-equipment/',
        query: { contract: '5', page: '1', page_size: '1000' },
        body: undefined,
      },
    ])
  })
})
