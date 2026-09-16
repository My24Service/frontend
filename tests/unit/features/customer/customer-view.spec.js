import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import { CustomerView } from '@/features/customer'
import {
  vBranch,
  vCustomer,
  vCustomerDashboardResponse,
  vPaginatedCustomerDocumentList,
  vPaginatedEquipmentList,
  vPaginatedLocationList,
  vPaginatedMaintenanceContractList,
  vPaginatedOrderList,
} from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { createTestQueryClient, mountForm, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { customerRoutes } from '../../support/customer-routes.js'

enableAutoUnmount(afterEach)

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

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
      sum_tariffs: '1500.00',
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

// One read for the customer head, its orders page and the four stats
// blocks; the contracts, locations and equipment tabs keep their own
// whole-collection reads (page_size 1000, the API's paginator ceiling),
// so the initial load is four reads, not eight.
const DASHBOARD = () =>
  fixtureFor(vCustomerDashboardResponse, {
    customer: DETAIL(),
    orders: ORDERS(),
    order_types_stats: { total: 2, order_types: {} },
    order_counts_stats: { total: 2, order_counts: {} },
    order_types_month_stats: { total: 2, order_counts: {}, order_types: [] },
    counts_year_order_type_stats: { total: 2, order_counts: {}, order_types: [] },
  })

const DETAIL_LOAD = [
  {
    method: 'get',
    path: '/api/customer/customer/5/dashboard/',
    query: { orders_page: '1' },
  },
  {
    method: 'get',
    path: '/api/customer/maintenance-contract/',
    query: { customer: '5', page: '1', page_size: '1000' },
  },
  {
    method: 'get',
    path: '/api/equipment/location/',
    query: { customer: '5', page: '1', page_size: '1000' },
  },
  {
    method: 'get',
    path: '/api/equipment/equipment/',
    query: { customer: '5', page: '1', page_size: '1000' },
  },
]

function sortRequests(requests) {
  return [...requests].sort((a, b) => (a.path + JSON.stringify(a.query)).localeCompare(b.path + JSON.stringify(b.query)))
}

beforeEach(() => {
  api.get('/api/customer/customer/{id}/dashboard/', DASHBOARD())
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
      getDefaultCurrency: 'EUR',
    },
    queryClient,
    stubs: { OrderStats: true },
  })
  await settle()
  return wrapper
}

describe('CustomerView, staff detail', () => {
  test('fires four reads: the dashboard, contracts, locations, equipment', async () => {
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

  // The card on this screen is the Slice's own now
  // (src/features/customer/CustomerCard.vue), not @/components/CustomerCard.vue.
  // This pins that the record's fields still reach the sidebar.
  test('renders the customer card from the record', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Main 1, Amsterdam')
    expect(wrapper.text()).toContain('1234AB')
  })

  test('lists the orders, contracts, equipment and locations of the record', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('2024-001')
    expect(wrapper.text()).toContain('Gouda')
    expect(wrapper.text()).toContain('€1500.00')
    expect(wrapper.text()).toContain('Forklift')
    expect(wrapper.text()).toContain('Warehouse')
  })

  test('the Insights tab charts the dashboard stats without further reads', async () => {
    const wrapper = await mountView()
    const before = api.requests().length
    await wrapper.findAll('.nav-link').find((tab) => tab.text() === 'Insights').trigger('click')
    await settle()

    expect(api.requests()).toHaveLength(before)
  })

  test('a page change refetches the dashboard with the next orders page', async () => {
    const wrapper = await mountView()
    api.get('/api/customer/customer/{id}/dashboard/', ({ query }) =>
      query.orders_page === '2'
        ? fixtureFor(vCustomerDashboardResponse, {
          ...DASHBOARD(),
          orders: paginated([fixtureFor(ORDER_ITEM, { id: 201, order_id: '2024-021' })], { count: 45 }),
        })
        : DASHBOARD(),
    )

    await wrapper.get('button[aria-label="Go to page 2"]').trigger('click')
    await settle()

    const dashboardReads = api.requests().filter((r) => r.path === '/api/customer/customer/5/dashboard/')
    expect(dashboardReads.at(-1)).toEqual({
      method: 'get', path: '/api/customer/customer/5/dashboard/', query: { orders_page: '2' },
    })
    expect(wrapper.text()).toContain('2024-021')
  })
})

describe('CustomerView, a read that fails', () => {
  test('names the dashboard it could not load', async () => {
    api.get('/api/customer/customer/{id}/dashboard/', serverError)

    await mountView()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading customer')
  })

  test('names the contracts it could not load', async () => {
    api.get('/api/customer/maintenance-contract/', serverError)

    await mountView()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading maintenance contracts')
  })
})

describe('CustomerView, the customer dashboard', () => {
  test('asks for locations and equipment only, never a record, contracts, orders or stats', async () => {
    await mountView({ pk: null, auth: { isCustomer: true } })

    expect(sortRequests(api.requests())).toEqual(sortRequests([
      {
        method: 'get',
        path: '/api/equipment/location/',
        query: { page: '1', page_size: '1000' },
      },
      {
        method: 'get',
        path: '/api/equipment/equipment/',
        query: { page: '1', page_size: '1000' },
      },
    ]))
  })
})
