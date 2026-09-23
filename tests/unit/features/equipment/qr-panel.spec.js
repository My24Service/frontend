import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  vCustomer,
  vEquipment,
  vEquipmentDashboardResponse,
  vLocation,
  vLocationDashboardResponse,
} from '@/api/valibot.gen'
import {
  EquipmentDetail,
  LocationDetail,
} from '@/features/equipment'
import { captureDownloads } from '../../support/downloads.js'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({create: toastCreate}),
}))

const api = installApiSeam()

/**
 * The handles crossing the `QrPanel`/`useQrCode` seam, pinned where they
 * live: the recreate mutation's write-back into the detail cache, and the
 * file the download fetches and the name it saves it under.
 */
const stubs = {
  OrdersTable: {template: '<div class="orders-table-stub" />'},
  OrderStats: {template: '<div class="order-stats-stub" />'},
  WorkOrdersTable: {template: '<div class="work-orders-stub" />'},
  OrderTypesPie: {template: '<div class="order-types-stub" />'},
}

const routes = [
  {name: 'equipment-equipment-edit', path: '/equipment/equipment/form/:pk', component: {template: '<div />'}},
  {name: 'equipment-location-edit', path: '/equipment/locations/form/:pk', component: {template: '<div />'}},
  {name: 'equipment-location-view', path: '/equipment/locations/:pk', component: {template: '<div />'}},
  {name: 'equipment-building-list', path: '/equipment/buildings', component: {template: '<div />'}},
]

const EQUIPMENT = () => fixtureFor(vEquipment, {
  id: 11,
  name: 'Ketel 3000',
  uuid: '9f2c1a40-1111-4222-8333-444455556666',
  price: '121.00',
  price_currency: 'EUR',
  qr_path: '/media/qr/11.png',
  qr_url: 'https://example.test/qr/11.png',
})
const LOCATION = () => fixtureFor(vLocation, {
  id: 21,
  name: 'Bergruimte',
  customer_branch_view: fixtureFor(vCustomer, {id: 7, name: 'Acme', city: 'Utrecht'}),
  qr_path: '/media/qr/21.png',
  qr_url: 'https://example.test/qr/21.png',
})

// The detail pages read their orders and stats in one bundle; the QR handles
// pin the recreate write-back and the download, so the bundle answers an
// empty orders page here.
const EQUIPMENT_DASHBOARD = () =>
  fixtureFor(vEquipmentDashboardResponse, {equipment: EQUIPMENT(), orders: paginated([])})
const LOCATION_DASHBOARD = () =>
  fixtureFor(vLocationDashboardResponse, {location: LOCATION(), orders: paginated([])})

const requestsTo = (path, method = 'get') =>
  api.requests().filter((request) => request.method === method && request.path === path)
const bodies = () => toasts().map((toast) => toast.body)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get('/api/equipment/equipment/{id}/', EQUIPMENT)
  api.get('/api/equipment/location/{id}/', LOCATION)
  api.get('/api/equipment/equipment/{id}/dashboard/', EQUIPMENT_DASHBOARD())
  api.get('/api/equipment/location/{id}/dashboard/', LOCATION_DASHBOARD())
  api.get('/api/equipment/equipment/', () => paginated([], {count: 0}))
  api.get('/api/equipment/equipment-document/', () => paginated([]))
  api.get('/api/equipment/location-document/', () => paginated([]))
  api.post('/api/equipment/equipment/{id}/create_qr/', {qr_path: '/media/qr/11-new.png', qr_url: 'https://example.test/qr/11-new.png'})
  api.post('/api/equipment/location/{id}/create_qr/', {qr_path: '/media/qr/21-new.png', qr_url: 'https://example.test/qr/21-new.png'})
})
/**
 * The QR image is a stored file, not an API operation, so it is fetched
 * outside the generated client; record which URLs were asked for.
 */
function stubQrFetch() {
  const fetched = []
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    fetched.push(url)
    return new Response(new Uint8Array([137, 80, 78, 71]), {headers: {'Content-Type': 'image/png'}})
  }))
  return fetched
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  window.history.replaceState(null, '', '/')
})

function mountView(component, props) {
  return mountForm(component, {
    deep: true,
    routes,
    stubs,
    props,
    main: {
      getMemberHasBranches: true,
      getEquipmentQrType: 'my24service',
      getProductFamily: 'default',
      getCurrentLanguage: 'nl',
    },
    auth: {isEmployee: false, isCustomer: false},
  })
}

function downloadLink(wrapper) {
  return wrapper.findAll('a').find((anchor) => anchor.text() === 'Download')
}

describe('QrPanel handles', () => {
  test('recreate writes the new QR into the equipment detail cache', async () => {
    const wrapper = mountView(EquipmentDetail, {pk: '11', route_prefix: 'equipment-equipment'})
    await settle()
    expect(wrapper.get('img[alt="QR code"]').attributes('src')).toBe('https://example.test/qr/11.png')

    await wrapper.findAll('button').find((button) => button.text() === 'Recreate').trigger('click')
    await settle()
    await wrapper.vm.$nextTick()

    expect(requestsTo('/api/equipment/equipment/11/create_qr/', 'post')).toHaveLength(1)
    // The write-back lands in the cached record rather than a refetch: the
    // detail read ran once and the image shows the new QR.
    expect(requestsTo('/api/equipment/equipment/11/')).toHaveLength(1)
    expect(wrapper.get('img[alt="QR code"]').attributes('src')).toBe('https://example.test/qr/11-new.png')
  })

  test('recreate writes the new QR into the location detail cache', async () => {
    const wrapper = mountView(LocationDetail, {pk: '21', route_prefix: 'equipment-location'})
    await settle()

    await wrapper.findAll('button').find((button) => button.text() === 'Recreate').trigger('click')
    await settle()
    await wrapper.vm.$nextTick()

    expect(requestsTo('/api/equipment/location/21/create_qr/', 'post')).toHaveLength(1)
    expect(requestsTo('/api/equipment/location/21/')).toHaveLength(1)
    expect(wrapper.get('img[alt="QR code"]').attributes('src')).toBe('https://example.test/qr/21-new.png')
  })

  test('a failed recreate tells the user', async () => {
    api.post('/api/equipment/equipment/{id}/create_qr/', serverError)
    const wrapper = mountView(EquipmentDetail, {pk: '11', route_prefix: 'equipment-equipment'})
    await settle()

    await wrapper.findAll('button').find((button) => button.text() === 'Recreate').trigger('click')
    await settle()

    expect(bodies()).toContain('Error recreating QR code')
  })

  test('the equipment download names the file from name and uuid', async () => {
    const saved = captureDownloads()
    const fetched = stubQrFetch()
    const wrapper = mountView(EquipmentDetail, {pk: '11', route_prefix: 'equipment-equipment'})
    await settle()

    await downloadLink(wrapper).trigger('click')
    await settle()

    expect(fetched).toEqual(['/media/qr/11.png'])
    expect(saved).toEqual(['Ketel 3000 9f2c1a40-1111-4222-8333-444455556666.png'])
  })

  test('the location download names the file from the name alone', async () => {
    const saved = captureDownloads()
    const fetched = stubQrFetch()
    const wrapper = mountView(LocationDetail, {pk: '21', route_prefix: 'equipment-location'})
    await settle()

    await downloadLink(wrapper).trigger('click')
    await settle()

    // The location serializer exposes no uuid; the legacy name interpolated
    // an undefined there.
    expect(fetched).toEqual(['/media/qr/21.png'])
    expect(saved).toEqual(['Bergruimte.png'])
  })
})
