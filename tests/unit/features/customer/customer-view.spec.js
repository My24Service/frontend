import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

// CustomerView, rewritten into the feature folder. These specs began as the
// characterisation of the legacy screen and now hold the rewrite to the same
// requests — with the declared exceptions called out inline and collected in
// the Slice README.
import { CustomerView } from '@/features/customer'
import {
  vBranch,
  vCountsYearOrderTypeStatsResponse,
  vCustomer,
  vOrderCountsStatsResponse,
  vOrderTypesMonthStatsResponse,
  vOrderTypesStatsResponse,
  vPaginatedCustomerDocumentList,
  vPaginatedEquipmentList,
  vPaginatedLocationList,
  vPaginatedMaintenanceContractList,
  vPaginatedOrderList,
} from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { createTestQueryClient, mountForm } from '../../support/form-harness.js'
import { customerRoutes } from '../../support/customer-routes.js'

enableAutoUnmount(afterEach)

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * The customer detail view, characterised on the legacy component.
 *
 * One component serves two very different users:
 *
 *   - staff at `/customers/customers/:pk` — the record's orders (via the
 *     `all_for_customer_web` action), maintenance contracts, the record
 *     itself, its locations and its equipment, in that order; plus four
 *     statistics endpoints on the Insights tab;
 *   - a customer-type user at `/customers/dashboard` — their own data: the
 *     orders action without a real id (the URL literally carries
 *     `customer_id=null`, which the backend falls back from), locations and
 *     equipment unfiltered, and no record fetch at all.
 *
 * The search modal has no opener in the template — `showSearchModal` is dead
 * wiring here — and every page change refetches all five reads, since
 * `loadData()` has no notion of tabs.
 */

const api = installApiSeam()

const ORDER_ITEM = itemSchemaOf(vPaginatedOrderList)
const CONTRACT_ITEM = itemSchemaOf(vPaginatedMaintenanceContractList)
const LOCATION_ITEM = itemSchemaOf(vPaginatedLocationList)
const EQUIPMENT_ITEM = itemSchemaOf(vPaginatedEquipmentList)
const DOCUMENT_ITEM = itemSchemaOf(vPaginatedCustomerDocumentList)

const DETAIL = () =>
  fixtureFor(vCustomer, {
    id: 5,
    name: 'Acme BV',
    address: 'Main 1',
    postal: '1234AB',
    city: 'Amsterdam',
    num_orders: 3,
  })

/** A whole branch, so the `Customer | Branch` union view validates. */
const BRANCH_VIEW = () =>
  fixtureFor(vBranch, {
    id: 60,
    name: 'Acme BV',
    city: 'Amsterdam',
    address: 'Main 1',
    postal: '1234AB',
    country_code: 'NL',
  })

const ORDERS = () =>
  paginated(
    [
      fixtureFor(ORDER_ITEM, { id: 101, order_id: '2024-001' }),
      fixtureFor(ORDER_ITEM, { id: 102, order_id: '2024-002' }),
    ],
    { count: 45 },
  )

const CONTRACTS = () =>
  paginated([
    fixtureFor(CONTRACT_ITEM, {
      id: 21,
      name: 'Gouda',
      contract_value: '1500.00',
      created_orders: 4,
      num_order_equipment: 2,
    }),
  ])

const LOCATIONS = () =>
  paginated([
    fixtureFor(LOCATION_ITEM, {
      id: 31,
      name: 'Warehouse',
      customer_branch_view: BRANCH_VIEW(),
    }),
  ])

const EQUIPMENT = () =>
  paginated([
    fixtureFor(EQUIPMENT_ITEM, {
      id: 41,
      name: 'Forklift',
      brand: 'Hyster',
      customer_branch_view: BRANCH_VIEW(),
    }),
  ])

const DOCUMENTS = () =>
  paginated([fixtureFor(DOCUMENT_ITEM, { id: 9, customer: 5, name: 'Manual.pdf' })])

/** The five reads a staff visit fires, in order. */
const DETAIL_LOAD = [
  {
    method: 'get',
    path: '/api/order/order/all_for_customer_web/',
    query: { customer_id: '5', page: '1' },
  },
  { method: 'get', path: '/api/customer/maintenance-contract/', query: { customer: '5', page: '1' } },
  { method: 'get', path: '/api/customer/customer/5/', query: {} },
  { method: 'get', path: '/api/equipment/location/', query: { customer: '5', page: '1' } },
  { method: 'get', path: '/api/equipment/equipment/', query: { customer: '5', page: '1' } },
]

/** Parallel queries make the wire order a scheduling fact, not a contract. */
function sortRequests(requests) {
  return [...requests].sort((a, b) => (a.path + JSON.stringify(a.query)).localeCompare(b.path + JSON.stringify(b.query)))
}

beforeEach(() => {
  api.get('/api/order/order/all_for_customer_web/', ORDERS())
  api.get('/api/customer/maintenance-contract/', CONTRACTS())
  api.get('/api/customer/customer/', DETAIL())
  api.get('/api/customer/customer/{id}/', DETAIL())
  api.get('/api/equipment/location/', LOCATIONS())
  api.get('/api/equipment/equipment/', EQUIPMENT())
  api.get('/api/customer/document/', DOCUMENTS())
})

async function mountView({ pk = '5', auth = {}, queryClient = null } = {}) {
  const wrapper = mountForm(CustomerView, {
    deep: true,
    routes: customerRoutes,
    props: pk ? { pk } : {},
    auth,
    main: {
      getMemberHasBranches: false,
      getMemberType: 'maintenance',
      getStatuscodes: [],
      getOrderListMustIncludeReference: false,
    },
    queryClient,
    stubs: { OrderStats: true },
  })
  await settle()
  return wrapper
}

describe('CustomerView, staff detail', () => {
  test('fires the five reads: orders, contracts, record, locations, equipment', async () => {
    // Declared exception (README): the legacy screen fetched these one after
    // another through a shared loadData; the converted view fires them as
    // parallel queries, so only the set is guaranteed, not the order.
    await mountView()

    expect(sortRequests(api.requests())).toEqual(sortRequests(DETAIL_LOAD))
  })

  test('shows the record in the title, with an edit link', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Customers')
    expect(wrapper.text()).toContain('Acme BV')
    const editLink = wrapper.findAll('a').find((a) => a.text().includes('Edit customer'))
    expect(editLink.attributes('href')).toBe('/customers/customers/form/5')
  })

  test('lists the orders, contracts, equipment and locations of the record', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('2024-001')
    expect(wrapper.text()).toContain('Gouda')
    expect(wrapper.text()).toContain('EUR 1500.00')
    expect(wrapper.text()).toContain('Forklift')
    expect(wrapper.text()).toContain('Warehouse')
  })

  test('the Insights tab asks for the four statistics', async () => {
    api.get('/api/order/order/order_types_stats/', fixtureFor(vOrderTypesStatsResponse))
    api.get('/api/order/order/order_counts_stats/', fixtureFor(vOrderCountsStatsResponse))
    api.get('/api/order/order/order_types_month_stats/', fixtureFor(vOrderTypesMonthStatsResponse))
    api.get('/api/order/order/counts_year_order_type_stats/', fixtureFor(vCountsYearOrderTypeStatsResponse))

    const wrapper = await mountView()
    await wrapper.findAll('.nav-link').find((tab) => tab.text() === 'Insights').trigger('click')
    await settle()

    // Parallel queries now, so the set is the contract (see the README).
    expect(sortRequests(api.requests().slice(5))).toEqual(sortRequests([
      { method: 'get', path: '/api/order/order/order_types_stats/', query: { customer: '5' } },
      { method: 'get', path: '/api/order/order/order_counts_stats/', query: { customer: '5' } },
      { method: 'get', path: '/api/order/order/order_types_month_stats/', query: { customer: '5' } },
      { method: 'get', path: '/api/order/order/counts_year_order_type_stats/', query: { customer: '5' } },
    ]))
  })

  test('a page change refetches the orders, and only the orders', async () => {
    // Declared exception (README): the legacy loadData reloaded all five
    // reads on any page change because it had no notion of tabs; each read
    // owns its query now, and the page belongs to the orders alone.
    const wrapper = await mountView()
    api.get('/api/order/order/all_for_customer_web/', ({ query }) =>
      query.page === '2'
        ? paginated([fixtureFor(ORDER_ITEM, { id: 201, order_id: '2024-021' })], { count: 45 })
        : ORDERS(),
    )

    await wrapper.get('button[aria-label="Go to page 2"]').trigger('click')
    await settle()

    expect(api.requests().slice(5)).toEqual([
      { method: 'get', path: '/api/order/order/all_for_customer_web/', query: { customer_id: '5', page: '2' } },
    ])
    expect(wrapper.text()).toContain('2024-021')
  })
})

describe('CustomerView, the customer dashboard', () => {
  test('asks for orders without an id, and never fetches a record or contracts', async () => {
    await mountView({ pk: null, auth: { isCustomer: true } })

    expect(sortRequests(api.requests())).toEqual(sortRequests([
      // Declared exception (README): the legacy request carried the string
      // "null" (the `${null}` of a null prop); the generated client omits the
      // parameter instead. The backend scopes a customer user's orders to
      // their own record without it
      // (source/apps/order/views/mixins/queryset.py:28-35).
      { method: 'get', path: '/api/order/order/all_for_customer_web/', query: { page: '1' } },
      { method: 'get', path: '/api/equipment/location/', query: { page: '1' } },
      { method: 'get', path: '/api/equipment/equipment/', query: { page: '1' } },
    ]))
  })
})
