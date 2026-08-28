import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

// MaintenanceContractView, rewritten into the feature folder. These specs
// began as the characterisation of the legacy screen and now hold the
// rewrite to the same requests — with the declared exceptions called out
// inline and collected in the Slice README.
import { MaintenanceContractView } from '@/features/customer'
import {
  vCustomer,
  vPaginatedMaintenanceContractList,
  vPaginatedMaintenanceEquipmentList,
} from '@/api/valibot.gen'

import { HttpResponse } from 'msw'

import { goldenTest, goldensFor } from '../../helpers/golden.js'
import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { createTestQueryClient, mountForm, toasts } from '../../support/form-harness.js'
import { customerRoutes } from '../../support/customer-routes.js'

enableAutoUnmount(afterEach)

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * The maintenance-contract detail view, characterised on the legacy component.
 *
 * What the screen does today:
 *
 *   - it loads the contract, its equipment rows and the contract's orders
 *     (the `maintenance_orders` action) — sequentially, equipment filtered
 *     by `contract`, orders carrying `contract` and `page` on the wire;
 *   - the OpenAPI schema declares no query parameters and — wrongly — a
 *     single Order as the response of `maintenance_orders`, while the
 *     backend returns the standard paginated envelope: it reads `contract`
 *     (source/apps/order/views/order.py:651-659) and answers
 *     `qs_to_response` (source/apps/core/rest.py:479-491). Both gaps are
 *     declared; the drained violations below are that endpoint's;
 *   - "Select equipment" stages order lines locally; "Add equipment" hands
 *     them to the main store and routes to the maintenance order form — no
 *     request of its own;
 *   - the equipment table's `tariff_total` slot references a field nothing
 *     produces, but the column itself is not in `equipmentFields`, so the
 *     slot never renders — dead template, kept as seen;
 *   - a failed load never reached the user: the legacy catch called
 *     `errorToast`, which that component never imported, so the handler
 *     itself threw a ReferenceError and the screen stayed dark. The rewrite
 *     imports it — the declared repair the error test below pins.
 */

const api = installApiSeam()
const goldens = goldensFor('maintenance-contract-view')

const CONTRACT_ITEM = itemSchemaOf(vPaginatedMaintenanceContractList)
const EQUIPMENT_ITEM = itemSchemaOf(vPaginatedMaintenanceEquipmentList)

const MAIN = {
  getMemberHasBranches: true,
  getMemberType: 'maintenance',
  getStatuscodes: [],
  getOrderListMustIncludeReference: false,
  getDefaultCurrency: 'EUR',
}

function contractFixture(overrides = {}) {
  return fixtureFor(CONTRACT_ITEM, {
    id: 5,
    customer: 7,
    name: 'Gouda maintenance',
    customer_view: fixtureFor(vCustomer, {
      id: 7,
      name: 'Acme BV',
      address: 'Main 1',
      postal: '1234AB',
      city: 'Gouda',
      country_code: 'NL',
      tel: '010 1234567',
    }),
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

async function clickButton(wrapper, text) {
  const button = wrapper.findAll('button').find((b) => b.text() === text)
  if (!button) throw new Error(`no button labelled "${text}"`)
  await button.trigger('click')
}

/**
 * Mount and settle, returning the seam violations the load produced —
 * every mount carries the two `maintenance_orders` query violations and the
 * response-shape one (declared gaps), which each test either asserts or
 * knowingly drops.
 */
async function mountContractView(props = { pk: '5' }) {
  const wrapper = mountForm(MaintenanceContractView, {
    deep: true,
    routes: customerRoutes,
    main: MAIN,
    props,
    queryClient: createTestQueryClient(),
  })
  await settle()
  return { wrapper, violations: api.takeViolations() }
}

beforeEach(() => {
  api.get('/api/customer/maintenance-contract/{id}/', contractFixture())
  api.get('/api/customer/maintenance-equipment/', paginated([equipmentRow()]))
  api.get('/api/order/order/maintenance_orders/', { count: 0, results: [] })
})

describe('MaintenanceContractView, loading', () => {
  // Recording hook: a scenario the directory has no HAR for skips, naming
  // itself (see tests/unit/golden/README.md).
  goldenTest(goldens, 'initial load', 'maintenance-contract-view', async () => {
    await mountContractView()
    return api.requests()
  })

  test('loads the contract, its equipment and its orders', async () => {
    await mountContractView()

    // Three independent reads, in parallel now (the legacy `loadData` ran
    // them in sequence — a declared change, collected in the README), so
    // the spec compares sorted.
    expect(api.requests()).toHaveLength(3)
    expect(api.requests().slice().sort((a, b) => a.path.localeCompare(b.path))).toEqual([
      { method: 'get', path: '/api/customer/maintenance-contract/5/', query: {}, body: undefined },
      { method: 'get', path: '/api/customer/maintenance-equipment/', query: { contract: '5', page: '1' }, body: undefined },
      { method: 'get', path: '/api/order/order/maintenance_orders/', query: { contract: '5', page: '1' }, body: undefined },
    ])
  })

  test('the orders fetch violates the schema in three declared ways', async () => {
    const { violations } = await mountContractView()

    // Declared exceptions (see the Slice README): the schema declares no
    // query parameters for `maintenance_orders` and a single Order as its
    // response, while the backend reads `contract` and answers with the
    // paginated envelope (citations in the file header).
    expect(violations).toHaveLength(3)
    expect(violations.join(' ')).toContain("'contract'")
    expect(violations.join(' ')).toContain("'page'")
    expect(violations.join(' ')).toContain('is stubbed with a response its own schema rejects')
  })

  test('renders the contract, its customer and its equipment', async () => {
    const { wrapper } = await mountContractView()

    expect(wrapper.text()).toContain('Gouda maintenance')
    expect(wrapper.text()).toContain('Acme BV')
    expect(wrapper.text()).toContain('Pump A')
    // Legacy: '$0.00' formats as the currency symbol for the fixture's EUR.
    expect(wrapper.text()).toContain('€160.00')
    expect(wrapper.text()).toContain('€40.00')
  })

  test('shows the orders tab empty with its own empty text', async () => {
    const { wrapper } = await mountContractView()

    expect(wrapper.text()).toContain('No orders for contract.')
  })

  test('tells the user when the contract cannot be loaded (declared repair)', async () => {
    // An msw HttpResponse takes control of the answer; a plain Response
    // would be treated as a payload claim and answered as a 200.
    api.get('/api/customer/maintenance-contract/{id}/', () => new HttpResponse(
      JSON.stringify({ detail: 'boom' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    ))

    await mountContractView()

    // The legacy catch called an unimported `errorToast` and died before
    // telling anyone; the toast works now (README, declared repair). The
    // status text after the code is whatever the failure answered with.
    expect(toasts()).toHaveLength(1)
    expect(toasts()[0].body).toContain('Error loading maintenance contract')
    expect(toasts()[0].body).toContain('500')
  })
})

describe('MaintenanceContractView, creating a maintenance order', () => {
  test('select equipment stages the rows locally', async () => {
    const { wrapper } = await mountContractView()
    const pumpRows = () => wrapper.findAll('tbody tr').filter((row) => row.text().includes('Pump A'))
    expect(pumpRows()).toHaveLength(1)

    await clickButton(wrapper, 'Select equipment')
    await settle()

    // The staging table appears above the equipment list: a staged row for
    // the same equipment joins the list.
    expect(pumpRows()).toHaveLength(2)
    expect(wrapper.text()).toContain('× yearly')
  })

  test('Add equipment hands the checked lines to the store and routes on, without a request', async () => {
    const { wrapper } = await mountContractView()
    await clickButton(wrapper, 'Select equipment')
    await settle()

    // The Add equipment button is disabled until a line is checked; the
    // store write (a testing-pinia spy) must not have been called.
    const setMaintenanceEquipment = wrapper.vm.mainStore.setMaintenanceEquipment
    await clickButton(wrapper, 'Add equipment')
    await settle()
    expect(setMaintenanceEquipment).not.toHaveBeenCalled()

    // BFormCheckbox: reflect onto the element, then let the change event
    // carry it into the row's `useAsOrderLine`.
    const checkbox = wrapper.get('tbody input[type="checkbox"]')
    checkbox.element.checked = true
    await checkbox.trigger('change')
    await settle()

    await clickButton(wrapper, 'Add equipment')
    await settle()

    expect(setMaintenanceEquipment).toHaveBeenCalledTimes(1)
    expect(setMaintenanceEquipment).toHaveBeenCalledWith({
      customer_pk: 7,
      contract_pk: '5',
      maintenanceEquipment: [
        expect.objectContaining({
          contract_pk: '5',
          customer_pk: 7,
          equipment_pk: 21,
          name: 'Pump A',
          times_per_year: 4,
          amount: 1,
          useAsOrderLine: true,
        }),
      ],
    })
    expect(wrapper.vm.$route.name).toBe('order-add-maintenance')
    expect(api.requests()).toHaveLength(3)
  })
})
