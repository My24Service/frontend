import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  vBuildingDashboardResponse,
  vCustomer,
  vEquipment,
  vEquipmentDashboardResponse,
  vEquipmentDocument,
  vLocation,
  vLocationDashboardResponse,
  vOrder,
} from '@/api/valibot.gen'
import BuildingDetail from '@/features/equipment/building/BuildingDetail.vue'
import EquipmentDetail from '@/features/equipment/equipment/EquipmentDetail.vue'
import LocationDetail from '@/features/equipment/location/LocationDetail.vue'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({create: toastCreate}),
}))

const api = installApiSeam()

/**
 * The order Slice's own components, mounted un-rewritten by these screens.
 * They are stubbed here for one reason: each fetches on mount, so rendering
 * them for real would drag the order endpoints - and the order Slice's own
 * expectations - into a spec about the equipment detail page. What this file
 * asserts is the view's own requests and its own markup.
 */
const stubs = {
  OrdersTable: {template: '<div class="orders-table-stub" />'},
  OrderStats: {template: '<div class="order-stats-stub" />'},
  WorkOrdersTable: {template: '<div class="work-orders-stub" />'},
  OrderTypesPie: {template: '<div class="order-types-stub" />'},
}

const routes = [
  {name: 'equipment-equipment-edit', path: '/equipment/equipment/form/:pk', component: {template: '<div />'}},
  {name: 'equipment-equipment-edit-technical', path: '/equipment/equipment/technical/form/:pk', component: {template: '<div />'}},
  {name: 'equipment-equipment-edit-facility', path: '/equipment/equipment/facility/form/:pk', component: {template: '<div />'}},
  {name: 'equipment-equipment-view', path: '/equipment/equipment/:pk', component: {template: '<div />'}},
  {name: 'equipment-equipment-list', path: '/equipment/equipment/:type', component: {template: '<div />'}},
  {name: 'customers-equipment-list', path: '/customers/equipment', component: {template: '<div />'}},
  {name: 'equipment-location-edit', path: '/equipment/locations/form/:pk', component: {template: '<div />'}},
  {name: 'equipment-location-view', path: '/equipment/locations/:pk', component: {template: '<div />'}},
  // The settings layout mounts the same screens under its own name family.
  {name: 'settings-equipment-edit', path: '/settings/equipment/form/:pk', component: {template: '<div />'}},
  {name: 'settings-equipment-edit-technical', path: '/settings/equipment/technical/form/:pk', component: {template: '<div />'}},
  {name: 'settings-equipment-edit-facility', path: '/settings/equipment/facility/form/:pk', component: {template: '<div />'}},
  {name: 'settings-equipment-view-technical', path: '/settings/equipment/technical/:pk', component: {template: '<div />'}},
  {name: 'settings-equipment-view-facility', path: '/settings/equipment/facility/:pk', component: {template: '<div />'}},
  {name: 'equipment-building-list', path: '/equipment/buildings', component: {template: '<div />'}},
]

// Each dashboard answers the subject head, one orders page and the four
// stats blocks in one payload; the fixture names the rows the page shows.
const EQUIPMENT_DASHBOARD = () =>
  fixtureFor(vEquipmentDashboardResponse, {
    equipment: fixtureFor(vEquipment, { id: 11, name: 'Ketel 3000' }),
    orders: paginated([order()], { count: 3 }),
  })
const LOCATION_DASHBOARD = () =>
  fixtureFor(vLocationDashboardResponse, {
    location: fixtureFor(vLocation, {
      id: 21,
      name: 'Bergruimte',
      customer_branch_view: fixtureFor(vCustomer, { id: 7, name: 'Acme', city: 'Utrecht' }),
    }),
    orders: paginated([order()], { count: 3 }),
  })
const BUILDING_DASHBOARD = () =>
  fixtureFor(vBuildingDashboardResponse, {
    building: { id: 31, name: 'Hoofdgebouw', customer: 7, branch: null, customer_branch_view: null, created: '01-01-2026', modified: '01-01-2026' },
    orders: paginated([order()], { count: 3 }),
  })

function order() {
  return fixtureFor(vOrder, {id: 42, order_id: 'O-42', order_name: 'Ketel storing'})
}

const requestsTo = (path) =>
  api.requests().filter((request) => request.method === 'get' && request.path === path)
const bodies = () => toasts().map((toast) => toast.body)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get('/api/equipment/equipment/{id}/', () => fixtureFor(vEquipment, {
    id: 11,
    name: 'Ketel 3000',
    brand: 'Remeha',
    price: '121.00',
    price_currency: 'EUR',
    qr_path: '/media/qr/11.png',
    qr_url: 'https://example.test/qr/11.png',
    installation_date: '2026-01-15',
  }))
  api.get('/api/equipment/location/{id}/', () => fixtureFor(vLocation, {
    id: 21,
    name: 'Bergruimte',
    customer_branch_view: fixtureFor(vCustomer, {id: 7, name: 'Acme', city: 'Utrecht'}),
  }))
  api.get('/api/equipment/building/{id}/', () => ({id: 31, name: 'Hoofdgebouw', customer: 7, branch: null, customer_branch_view: null, created: '01-01-2026', modified: '01-01-2026'}))
  api.get('/api/equipment/equipment/{id}/dashboard/', EQUIPMENT_DASHBOARD())
  api.get('/api/equipment/location/{id}/dashboard/', LOCATION_DASHBOARD())
  api.get('/api/equipment/building/{id}/dashboard/', BUILDING_DASHBOARD())
  api.get('/api/equipment/equipment/', () => paginated([], {count: 0}))
  // The documents panel renders inside the record's detail frame and reads the
  // record's documents whether or not the family shows them.
  api.get('/api/equipment/equipment-document/', () => paginated([]))
  api.get('/api/equipment/location-document/', () => paginated([]))
})
afterEach(() => window.history.replaceState(null, '', '/'))

function mountView(component, options = {}) {
  return mountForm(component, {
    deep: true,
    routes,
    stubs,
    main: {
      getMemberHasBranches: true,
      getEquipmentQrType: 'my24service',
      getProductFamily: 'default',
      getCurrentLanguage: 'nl',
    },
    auth: {isEmployee: false, isCustomer: false},
    ...options,
  })
}

describe('EquipmentDetail', () => {
  test('renders the record against its detail query', async () => {
    const wrapper = mountView(EquipmentDetail, {props: {pk: '11', route_prefix: 'equipment-equipment'}})
    await settle()

    expect(requestsTo('/api/equipment/equipment/11/')).toHaveLength(1)
    const text = wrapper.text()
    expect(text).toContain('Ketel 3000')
    expect(text).toContain('Remeha')
    // Money goes through toDinero, so the price renders in the app's format
    // rather than as the raw decimal the API sends.
    expect(text).toContain('121.00')
    expect(text).toContain('15-01-2026')
  })

  test('issues the detail retrieve and one bundle, nothing else', async () => {
    mountView(EquipmentDetail, {props: {pk: '11', route_prefix: 'equipment-equipment'}})
    await settle()

    expect(api.requests().map((request) => request.path).sort()).toEqual([
      '/api/equipment/equipment-document/',
      '/api/equipment/equipment/11/',
      '/api/equipment/equipment/11/dashboard/',
    ])
  })

  test('reads the orders and the Insights payloads in that bundle', async () => {
    mountView(EquipmentDetail, {props: {pk: '11', route_prefix: 'equipment-equipment'}})
    await settle()

    const bundles = requestsTo('/api/equipment/equipment/11/dashboard/')
    expect(bundles).toHaveLength(1)
    expect(bundles[0].query).toEqual({orders_page: '1'})
    // The fan-out is gone: no per-kind orders list, no stats endpoints.
    expect(requestsTo('/api/order/order/all_for_equipment_location/')).toHaveLength(0)
    expect(requestsTo('/api/order/order/')).toHaveLength(0)
    expect(requestsTo('/api/order/order/order_types_stats/')).toHaveLength(0)
    expect(requestsTo('/api/order/order/order_counts_stats/')).toHaveLength(0)
    expect(requestsTo('/api/order/order/order_types_month_stats/')).toHaveLength(0)
    expect(requestsTo('/api/order/order/counts_year_order_type_stats/')).toHaveLength(0)
  })

  test('the default family offers the untyped edit route', async () => {
    const wrapper = mountView(EquipmentDetail, {props: {pk: '11', route_prefix: 'equipment-equipment'}})
    await settle()

    expect(wrapper.get('.page-title a.btn').attributes('href')).toBe('/equipment/equipment/form/11')
    expect(wrapper.find('.work-orders-stub').exists()).toBe(false)
    expect(wrapper.find('.order-types-stub').exists()).toBe(false)
  })

  test('the shltr family shows its own cards, and the edit link only from settings', async () => {
    const withoutSettings = mountView(EquipmentDetail, {
      props: {pk: '11', route_prefix: 'equipment-equipment'},
      main: {getProductFamily: 'shltr', getMemberHasBranches: true, getEquipmentQrType: 'my24service', getCurrentLanguage: 'nl'},
    })
    await settle()

    // The two shltr-only cards: latest workorders and the order-type pie.
    expect(withoutSettings.find('.work-orders-stub').exists()).toBe(true)
    expect(withoutSettings.find('.order-types-stub').exists()).toBe(true)
    // shltr reaches the editor through settings, so this mount offers no link.
    expect(withoutSettings.find('.page-title a.btn').exists()).toBe(false)

    const fromSettings = mountView(EquipmentDetail, {
      props: {pk: '11', route_prefix: 'settings-equipment', from_settings: true},
      main: {getProductFamily: 'shltr', getMemberHasBranches: true, getEquipmentQrType: 'my24service', getCurrentLanguage: 'nl'},
    })
    await settle()

    // The typed route under the mount's own prefix: settings has no untyped
    // `settings-equipment-edit` for the default family to reach.
    expect(fromSettings.get('.page-title a.btn').attributes('href'))
      .toBe('/settings/equipment/technical/form/11')
    expect(fromSettings.get('.page-title a.btn').classes()).toContain('btn-primary')
  })

  test('the QR block follows the tenant setting, not the family', async () => {
    const withQr = mountView(EquipmentDetail, {props: {pk: '11', route_prefix: 'equipment-equipment'}})
    await settle()
    expect(withQr.get('img[alt="QR code"]').attributes('src')).toBe('https://example.test/qr/11.png')
    expect(withQr.text()).toContain('Recreate')

    const withoutQr = mountView(EquipmentDetail, {
      props: {pk: '11', route_prefix: 'equipment-equipment'},
      main: {getEquipmentQrType: 'none', getMemberHasBranches: true, getProductFamily: 'default', getCurrentLanguage: 'nl'},
    })
    await settle()
    expect(withoutQr.find('img[alt="QR code"]').exists()).toBe(false)
    expect(withoutQr.text()).not.toContain('Recreate')
  })

  test('a failed detail read tells the user', async () => {
    api.get('/api/equipment/equipment/{id}/', serverError)
    mountView(EquipmentDetail, {props: {pk: '11', route_prefix: 'equipment-equipment'}})
    await settle()

    expect(bodies()).toContain('Error fetching equipment detail')
  })
})

describe('LocationDetail', () => {
  test('reads the orders and the Insights payloads in one bundle for the location', async () => {
    mountView(LocationDetail, {props: {pk: '21', route_prefix: 'equipment-location'}})
    await settle()

    const bundles = requestsTo('/api/equipment/location/21/dashboard/')
    expect(bundles).toHaveLength(1)
    expect(bundles[0].query).toEqual({orders_page: '1'})

    // The legacy screen called the *equipment* stats helpers with a location
    // id, so its charts showed whatever equipment shared that id. The bundle
    // carries the location's own stats, and the shared equipment-location
    // list stays untouched.
    expect(requestsTo('/api/order/order/all_for_equipment_location/')).toHaveLength(0)
    expect(requestsTo('/api/order/order/order_types_stats/')).toHaveLength(0)
  })

  test('renders the location and its equipment-at-this-location request', async () => {
    const wrapper = mountView(LocationDetail, {props: {pk: '21', route_prefix: 'equipment-location'}})
    await settle()

    expect(wrapper.text()).toContain('Bergruimte')
    expect(requestsTo('/api/equipment/equipment/')[0].query).toMatchObject({
      location: '21',
      page_size: '1000',
    })
  })

  test('the orders title follows the family', async () => {
    const defaultFamily = mountView(LocationDetail, {props: {pk: '21', route_prefix: 'equipment-location'}})
    await settle()
    expect(defaultFamily.text()).toContain('Past orders')

    const shltrFamily = mountView(LocationDetail, {
      props: {pk: '21', route_prefix: 'equipment-location'},
      main: {getProductFamily: 'shltr', getMemberHasBranches: true, getEquipmentQrType: 'my24service', getCurrentLanguage: 'nl'},
    })
    await settle()
    expect(shltrFamily.text()).not.toContain('Past orders')
  })
})

describe('BuildingDetail', () => {
  test('reads its orders and Insights payloads in one bundle, not the order list', async () => {
    mountView(BuildingDetail, {props: {pk: '31'}})
    await settle()

    expect(requestsTo('/api/equipment/building/31/')).toHaveLength(1)
    const bundles = requestsTo('/api/equipment/building/31/dashboard/')
    expect(bundles).toHaveLength(1)
    expect(bundles[0].query).toEqual({orders_page: '1'})
    // The building list op is not it either: the bundle carries the page.
    expect(requestsTo('/api/order/order/')).toHaveLength(0)
    expect(requestsTo('/api/order/order/all_for_equipment_location/')).toHaveLength(0)
    expect(requestsTo('/api/order/order/order_types_stats/')).toHaveLength(0)
  })
})
