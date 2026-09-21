import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  vBranch,
  vBranchDashboardResponse,
  vCustomer,
  vEquipment,
  vEquipmentDashboardResponse,
  vLocation,
  vOrder,
} from '@/api/valibot.gen'
import { BranchView } from '@/features/company'
import { EquipmentDetail } from '@/features/equipment'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: spy } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: spy }) }
})

const api = installApiSeam()

/**
 * The handles crossing the `useDetailChrome` seam: the search button shows
 * the modal, its search hides the modal and narrows the orders block, and
 * the refresh button re-reads both the orders and the record. `useDetailChrome`
 * is a pure logic move - no markup crosses it - so these pins are the proof.
 */
const orderStubs = {
  OrdersTable: { template: '<div class="orders-table-stub" />' },
  OrderStats: { template: '<div class="order-stats-stub" />' },
  WorkOrdersTable: { template: '<div class="work-orders-stub" />' },
  OrderTypesPie: { template: '<div class="order-types-stub" />' },
}

const equipmentRoutes = [
  { name: 'equipment-equipment-edit', path: '/equipment/equipment/form/:pk', component: { template: '<div />' } },
  { name: 'equipment-building-list', path: '/equipment/buildings', component: { template: '<div />' } },
]

const branchRoutes = [
  { name: 'company-branch-edit', path: '/company/branches/form/:pk', component: { template: '<div />' } },
  { name: 'company-my-branch', path: '/company/branches/form/my', component: { template: '<div />' } },
  { name: 'equipment-equipment-edit', path: '/equipment/equipment/form/:pk', component: { template: '<div />' } },
  { name: 'equipment-equipment-add', path: '/equipment/equipment/form', component: { template: '<div />' } },
  { name: 'equipment-equipment-list', path: '/equipment/equipment/:type', component: { template: '<div />' } },
  { name: 'equipment-location-edit', path: '/equipment/locations/form/:pk', component: { template: '<div />' } },
  { name: 'equipment-location-add', path: '/equipment/locations/form', component: { template: '<div />' } },
  { name: 'equipment-location-list', path: '/equipment/locations', component: { template: '<div />' } },
]

const EQUIPMENT_DASHBOARD_PATH = '/api/equipment/equipment/11/dashboard/'
const BRANCH_DASHBOARD_PATH = '/api/company/branch/9/dashboard/'

const BRANCH = fixtureFor(vBranch, { id: 9, name: 'Vestiging Noord', city: 'Groningen' })

function order() {
  return fixtureFor(vOrder, { id: 42, order_id: 'O-42', order_name: 'Ketel storing' })
}

function equipmentDashboard() {
  return fixtureFor(vEquipmentDashboardResponse, {
    equipment: fixtureFor(vEquipment, { id: 11, name: 'Ketel 3000' }),
    orders: paginated([order()], { count: 3 }),
  })
}

function branchDashboard() {
  return fixtureFor(vBranchDashboardResponse, { branch: BRANCH, orders: paginated([]) })
}

const requestsTo = (path, method = 'get') =>
  api.requests().filter((request) => request.method === method && request.path === path)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get('/api/equipment/equipment/{id}/', () => fixtureFor(vEquipment, {
    id: 11, name: 'Ketel 3000', price: '121.00', price_currency: 'EUR', installation_date: '2026-01-15',
  }))
  // No mock for the old fan-out: any call to the per-kind orders list or
  // the stats endpoints is an unhandled request and fails the test.
  api.get('/api/equipment/equipment/{id}/dashboard/', equipmentDashboard())
  api.get('/api/equipment/equipment/', () => paginated([], { count: 0 }))
  api.get('/api/equipment/equipment-document/', () => paginated([]))
  api.get('/api/equipment/location-document/', () => paginated([]))
  api.get('/api/company/branch/{id}/', BRANCH)
  api.get('/api/company/branch-my/', BRANCH)
  api.get('/api/company/branch/{id}/dashboard/', branchDashboard())
  api.get('/api/equipment/location/', () => paginated([fixtureFor(vLocation, {
    id: 21, name: 'Bergruimte',
    customer_branch_view: fixtureFor(vCustomer, { id: 7, name: 'Acme', city: 'Utrecht' }),
  })]))
})
afterEach(() => window.history.replaceState(null, '', '/'))

function mountEquipment(searchModal) {
  return mountForm(EquipmentDetail, {
    deep: true,
    routes: equipmentRoutes,
    stubs: { ...orderStubs, SearchModal: searchModal },
    props: { pk: '11', route_prefix: 'equipment-equipment' },
    main: {
      getMemberHasBranches: true,
      getEquipmentQrType: 'my24service',
      getProductFamily: 'default',
      getCurrentLanguage: 'nl',
    },
    auth: { isEmployee: false, isCustomer: false },
  })
}

function mountBranch(options = {}) {
  return mountForm(BranchView, {
    deep: true,
    props: { pk: 9 },
    routes: branchRoutes,
    stubs: {
      OrdersTable: { template: '<div class="orders-table-stub" />' },
      OrderStats: { template: '<div class="order-stats-stub" />' },
      BranchCard: { template: '<div class="branch-card-stub" />' },
    },
    ...options,
  })
}

describe('useDetailChrome', () => {
  test('the search button shows the modal and its search narrows the orders', async () => {
    const show = vi.fn()
    const hide = vi.fn()
    const searchModal = { template: '<div class="search-modal-stub" />', methods: { show, hide } }
    const wrapper = mountEquipment(searchModal)
    await settle()

    await wrapper.get('button[title="Search"]').trigger('click')
    expect(show).toHaveBeenCalledTimes(1)

    wrapper.findComponent(searchModal).vm.$emit('do-search', 'ketel')
    await settle()

    expect(hide).toHaveBeenCalledTimes(1)
    const queries = requestsTo(EQUIPMENT_DASHBOARD_PATH)
    expect(queries.length).toBeGreaterThan(1)
    expect(queries.at(-1).query).toEqual({ orders_page: '1', orders_search: 'ketel' })
  })

  test('the refresh button re-reads the bundle and the record', async () => {
    const wrapper = mountEquipment({ template: '<div class="search-modal-stub" />' })
    await settle()
    const bundleBefore = requestsTo(EQUIPMENT_DASHBOARD_PATH).length
    const detailBefore = requestsTo('/api/equipment/equipment/11/').length

    await wrapper.get('button[title="Refresh"]').trigger('click')
    await settle()

    expect(requestsTo(EQUIPMENT_DASHBOARD_PATH)).toHaveLength(bundleBefore + 1)
    expect(requestsTo('/api/equipment/equipment/11/')).toHaveLength(detailBefore + 1)
  })

  test('a planning refresh re-reads the branch bundle and the retrieve', async () => {
    const wrapper = mountBranch()
    await settle()
    const detailBefore = requestsTo('/api/company/branch/9/').length
    const bundleBefore = requestsTo(BRANCH_DASHBOARD_PATH).length

    await wrapper.get('button[title="Refresh"]').trigger('click')
    await settle()

    expect(requestsTo('/api/company/branch/9/')).toHaveLength(detailBefore + 1)
    expect(requestsTo(BRANCH_DASHBOARD_PATH)).toHaveLength(bundleBefore + 1)
  })

  test('an employee refresh re-reads branch-my and the bundle instead', async () => {
    const wrapper = mountBranch({
      props: { pk: null },
      auth: { isBranchEmployee: true, branchEmployeeBranch: 9 },
    })
    await settle()
    const myBefore = requestsTo('/api/company/branch-my/').length
    const bundleBefore = requestsTo(BRANCH_DASHBOARD_PATH).length

    await wrapper.get('button[title="Refresh"]').trigger('click')
    await settle()

    expect(requestsTo('/api/company/branch-my/')).toHaveLength(myBefore + 1)
    expect(requestsTo(BRANCH_DASHBOARD_PATH)).toHaveLength(bundleBefore + 1)
    expect(requestsTo('/api/company/branch/9/')).toHaveLength(0)
  })
})
