import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  vBranch,
  vBranchDashboardResponse,
  vEquipment,
  vLocation,
  vCustomer,
} from '@/api/valibot.gen'
import BranchView from '@/features/company/branch/BranchView.vue'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: spy } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: spy }) }
})

const api = installApiSeam()

const BRANCH_PATH = '/api/company/branch/'
const MY_PATH = '/api/company/branch-my/'
const DASHBOARD_PATH = '/api/company/branch/9/dashboard/'
const EQUIPMENT_PATH = '/api/equipment/equipment/'
const LOCATION_PATH = '/api/equipment/location/'

const stubs = {
  OrdersTable: { template: '<div class="orders-table-stub" />' },
  OrderStats: { template: '<div class="order-stats-stub" />' },
  BranchCard: { template: '<div class="branch-card-stub" />' },
}

const routes = [
  { name: 'company-branch-edit', path: '/company/branches/form/:pk', component: { template: '<div />' } },
  { name: 'company-my-branch', path: '/company/branches/form/my', component: { template: '<div />' } },
  { name: 'settings-branch-edit', path: '/settings/branches/form/:pk', component: { template: '<div />' } },
  { name: 'settings-my-branch', path: '/settings/branches/form/my', component: { template: '<div />' } },
  { name: 'equipment-equipment-edit', path: '/equipment/equipment/form/:pk', component: { template: '<div />' } },
  { name: 'equipment-equipment-add', path: '/equipment/equipment/form', component: { template: '<div />' } },
  { name: 'equipment-equipment-list', path: '/equipment/equipment/:type', component: { template: '<div />' } },
  { name: 'equipment-location-edit', path: '/equipment/locations/form/:pk', component: { template: '<div />' } },
  { name: 'equipment-location-add', path: '/equipment/locations/form', component: { template: '<div />' } },
  { name: 'equipment-location-list', path: '/equipment/locations', component: { template: '<div />' } },
]

const BRANCH = fixtureFor(vBranch, {
  id: 9,
  name: 'Vestiging Noord',
  address: 'Voorstraat 1',
  postal: '9711 AA',
  city: 'Groningen',
  country_code: 'NL',
  image: 'https://example.com/media/branch.jpg',
  created: '01-01-2026',
  modified: '02-01-2026',
})

function branchEquipment(overrides = {}) {
  return fixtureFor(vEquipment, {
    id: 51,
    name: 'Ketel',
    brand: 'Acme',
    created: '01-01-2026',
    ...overrides,
  })
}

function branchLocation(overrides = {}) {
  return fixtureFor(vLocation, {
    id: 21,
    name: 'Bergruimte',
    customer: 7,
    branch: 9,
    building: null,
    // A union of Customer and Branch, so the fixture must be a complete member.
    customer_branch_view: fixtureFor(vCustomer, { id: 7, name: 'Acme', city: 'Utrecht' }),
    created: '01-01-2026',
    modified: '02-01-2026',
    ...overrides,
  })
}

// The branch head, one orders page and the four stats blocks in one
// payload; the orders page is empty here because the tabs under test read
// the equipment and locations, not the orders.
const DASHBOARD = () =>
  fixtureFor(vBranchDashboardResponse, {
    branch: BRANCH,
    orders: paginated([]),
  })

const bodies = () => toasts().map((toast) => toast.body)
const requestsTo = (path) =>
  api.requests().filter((request) => request.method === 'get' && request.path === path)

beforeEach(() => {
  api.get('/api/company/branch/{id}/', BRANCH)
  api.get(MY_PATH, BRANCH)
  api.get('/api/company/branch/{id}/dashboard/', DASHBOARD())
  api.get(EQUIPMENT_PATH, () => paginated([branchEquipment()]))
  api.get(LOCATION_PATH, () => paginated([branchLocation()]))
})

function mountView(options = {}) {
  return mountForm(BranchView, {
    deep: true,
    props: { pk: 9 },
    routes,
    stubs,
    ...options,
  })
}

describe('BranchView', () => {
  test('renders the header, the card and the planning edit link', async () => {
    const wrapper = mountView()
    await settle()

    expect(wrapper.get('h3').text()).toContain('Vestiging Noord')
    expect(wrapper.find('.branch-card-stub').exists()).toBe(true)
    expect(wrapper.get('a.btn').attributes('href')).toBe('/company/branches/form/9')
  })

  test('issues the branch retrieve, one bundle, and the two tables', async () => {
    mountView()
    await settle()

    expect(api.requests().map((request) => request.path).sort()).toEqual([
      '/api/company/branch/9/',
      '/api/company/branch/9/dashboard/',
      '/api/equipment/equipment/',
      '/api/equipment/location/',
    ])
  })

  test('reads the orders and the stats in that bundle, not the order list', async () => {
    mountView()
    await settle()

    const bundles = requestsTo(DASHBOARD_PATH)
    expect(bundles).toHaveLength(1)
    expect(bundles[0].query).toEqual({orders_page: '1'})
    // The fan-out is gone: no plain orders list, no stats endpoints.
    expect(requestsTo('/api/order/order/')).toHaveLength(0)
    expect(requestsTo('/api/order/order/order_types_stats/')).toHaveLength(0)
    expect(requestsTo('/api/order/order/order_counts_stats/')).toHaveLength(0)
    expect(requestsTo('/api/order/order/order_types_month_stats/')).toHaveLength(0)
    expect(requestsTo('/api/order/order/counts_year_order_type_stats/')).toHaveLength(0)
  })

  test('the equipment and location reads narrow to the branch', async () => {
    mountView()
    await settle()

    expect(requestsTo(EQUIPMENT_PATH)[0].query).toEqual({ branch: '9', page: '1' })
    expect(requestsTo(LOCATION_PATH)[0].query).toEqual({ branch: '9', page: '1' })
  })

  test('the equipment tab links to the equipment screens', async () => {
    const wrapper = mountView()
    await settle()

    const tab = wrapper.get('#equipment-table')
    expect(tab.text()).toContain('Ketel')
    expect(tab.get('a[href="/equipment/equipment/form/51"]').text()).toContain('Edit')
  })

  test('the locations tab links to the location screens', async () => {
    const wrapper = mountView()
    await settle()

    const tab = wrapper.get('#branch-location-table')
    expect(tab.text()).toContain('Bergruimte')
    expect(tab.get('a[href="/equipment/locations/form/21"]').text()).toContain('Edit')
  })

  test('a settings mount links to the settings edit route', async () => {
    const wrapper = mountView({ props: { pk: 9, from_settings: true } })
    await settle()

    expect(wrapper.get('a.btn').attributes('href')).toBe('/settings/branches/form/9')
  })

  test('a failed detail read tells the user', async () => {
    api.get('/api/company/branch/{id}/', serverError)
    mountView()
    await settle()

    expect(bodies()).toContain('Error fetching branch detail')
  })
})

describe('BranchView as a branch employee', () => {
  function mountEmployee(options = {}) {
    return mountView({
      props: { pk: null },
      auth: { isBranchEmployee: true, branchEmployeeBranch: 9 },
      ...options,
    })
  }

  test('reads branch-my and the bundle for the own branch', async () => {
    const wrapper = mountEmployee()
    await settle()

    expect(requestsTo(MY_PATH)).toHaveLength(1)
    expect(requestsTo(BRANCH_PATH + '9/')).toHaveLength(0)
    const bundles = requestsTo(DASHBOARD_PATH)
    expect(bundles).toHaveLength(1)
    expect(bundles[0].query).toEqual({orders_page: '1'})
    expect(wrapper.get('h3').text()).toContain('Vestiging Noord')
  })

  test('the tables read whole collections and the orders come from the bundle', async () => {
    mountEmployee()
    await settle()

    // The legacy screen sent no branch parameter on the table reads; the
    // server pins the employee's scope itself. The orders no longer have a
    // read of their own: the bundle carries their page.
    expect(requestsTo('/api/order/order/')).toHaveLength(0)
    expect(requestsTo(EQUIPMENT_PATH)[0].query).toEqual({ page: '1' })
    expect(requestsTo(LOCATION_PATH)[0].query).toEqual({ page: '1' })
  })

  test('the edit link goes to the own-branch form and no card shows', async () => {
    const wrapper = mountEmployee()
    await settle()

    expect(wrapper.get('a.btn').attributes('href')).toBe('/company/branches/form/my')
    expect(wrapper.find('.branch-card-stub').exists()).toBe(false)
  })
})
