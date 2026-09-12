import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import { MaintenanceContractView } from '@/features/customer'
import {
  vCustomer,
  vPaginatedMaintenanceContractList,
  vPaginatedMaintenanceEquipmentList,
} from '@/api/valibot.gen'

import { HttpResponse } from 'msw'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { createTestQueryClient, mountForm, toasts } from '../../support/form-harness.js'
import { useMainStore } from '@/stores/main'
import { customerRoutes } from '../../support/customer-routes.js'

enableAutoUnmount(afterEach)

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

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
      tel: '+31101234567',
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

async function mountContractView(props = { pk: '5' }) {
  const wrapper = mountForm(MaintenanceContractView, {
    deep: true,
    routes: customerRoutes,
    main: MAIN,
    props,
    queryClient: createTestQueryClient(),
  })
  const push = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue(undefined)
  await settle()
  return { wrapper, violations: api.takeViolations(), push }
}

beforeEach(() => {
  api.get('/api/customer/maintenance-contract/{id}/', contractFixture())
  api.get('/api/customer/maintenance-equipment/', paginated([equipmentRow()]))
  api.get('/api/order/order/maintenance_orders/', { count: 0, results: [] })
})

describe('MaintenanceContractView, loading', () => {
  // The equipment tab has no page control, so it asks for the contract's whole
  // equipment set in one read: `page_size` 1000, the API's paginator ceiling
  // (my24service `apps/core/rest.py` My24Pagination.max_page_size), which clamps
  // a larger value rather than rejecting it. The orders tab does paginate.
  test('loads the contract, its whole equipment set and its orders', async () => {
    await mountContractView()

    expect(api.requests()).toHaveLength(3)
    expect(api.requests().slice().sort((a, b) => a.path.localeCompare(b.path))).toEqual([
      { method: 'get', path: '/api/customer/maintenance-contract/5/', query: {} },
      {
        method: 'get',
        path: '/api/customer/maintenance-equipment/',
        query: { contract: '5', page: '1', page_size: '1000' },
      },
      { method: 'get', path: '/api/order/order/maintenance_orders/', query: { contract: '5', page: '1', page_size: '20' } },
    ])
  })

  test('the orders fetch rides the generated op with no violations', async () => {
    const { violations } = await mountContractView()

    expect(violations).toHaveLength(0)
  })

  test('renders the contract, its customer and its equipment', async () => {
    const { wrapper } = await mountContractView()

    expect(wrapper.text()).toContain('Gouda maintenance')
    expect(wrapper.text()).toContain('Acme BV')
    expect(wrapper.text()).toContain('Pump A')
    expect(wrapper.text()).toContain('€160.00')
    expect(wrapper.text()).toContain('€40.00')
  })

  test('shows the orders tab empty with its own empty text', async () => {
    const { wrapper } = await mountContractView()

    expect(wrapper.text()).toContain('No orders for contract.')
  })

  test('tells the user when the contract cannot be loaded (declared repair)', async () => {
    api.get('/api/customer/maintenance-contract/{id}/', () => new HttpResponse(
      JSON.stringify({ detail: 'boom' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    ))

    await mountContractView()

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

    expect(pumpRows()).toHaveLength(2)
    expect(wrapper.text()).toContain('× yearly')
  })

  test('Add equipment hands the checked lines to the store and routes on, without a request', async () => {
    const { wrapper, push } = await mountContractView()
    await clickButton(wrapper, 'Select equipment')
    await settle()

    const setMaintenanceEquipment = useMainStore().setMaintenanceEquipment
    await clickButton(wrapper, 'Add equipment')
    await settle()
    expect(setMaintenanceEquipment).not.toHaveBeenCalled()

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
    expect(push).toHaveBeenCalledWith({ name: 'order-add-maintenance' })
    expect(api.requests()).toHaveLength(3)
  })
})
