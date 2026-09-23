import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { vCustomer, vLocation } from '@/api/valibot.gen'
import { LocationList } from '@/features/equipment'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { captureDownloads, xlsxResponse } from '../../support/downloads.js'

import { addFilter, editorInput } from '../../support/column-filters.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({create: toastCreate}),
}))

const api = installApiSeam()
const endpoint = '/api/equipment/location/'

const routes = [
  {name: 'equipment-location-add', path: '/equipment/locations/form', component: {template: '<div />'}},
  {name: 'equipment-location-edit', path: '/equipment/locations/form/:pk', component: {template: '<div />'}},
  {name: 'equipment-location-view', path: '/equipment/locations/:pk', component: {template: '<div />'}},
  {name: 'company-branch-view', path: '/company/branches/:pk', component: {template: '<div />'}},
  {name: 'settings-location-add', path: '/settings/locations/form', component: {template: '<div />'}},
  {name: 'settings-location-edit', path: '/settings/locations/form/:pk', component: {template: '<div />'}},
  {name: 'settings-location-view', path: '/settings/locations/:pk', component: {template: '<div />'}},
]

function location(overrides = {}) {
  return fixtureFor(vLocation, {
    id: 21,
    name: 'Bergruimte',
    customer: 7,
    branch: 9,
    building: null,
    // A union of Customer and Branch, so the fixture must be a complete member.
    customer_branch_view: fixtureFor(vCustomer, {id: 7, name: 'Acme', city: 'Utrecht'}),
    created: '01-01-2026',
    modified: '02-01-2026',
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)
const listRequests = () => api.requests().filter((request) => request.method === 'get' && request.path === endpoint)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => paginated([location()], {count: 45}))
  api.delete(endpoint + '{id}/', noContent)
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountLocations(options = {}) {
  return mountListView(LocationList, {
    deep: true,
    routes,
    props: {route_prefix: 'equipment-location'},
    main: {getMemberHasBranches: true},
    auth: {isEmployee: false, isCustomer: false},
    ...options,
  })
}

async function mountLocationSettings(options = {}) {
  return mountLocations({
    props: {route_prefix: 'settings-location', from_settings: true},
    ...options,
  })
}

describe('LocationList', () => {
  test('loads page one and renders every column', async () => {
    const wrapper = await mountLocations()
    await settle()

    expect(listRequests()[0]).toMatchObject({path: endpoint, query: {page: '1', page_size: '20'}})
    const body = wrapper.get('tbody').text()
    expect(body).toContain('Bergruimte')
    expect(body).toContain('Acme')
    expect(body).toContain('Utrecht')
    expect(wrapper.get('h3').text()).toContain('Locations')
  })

  test('sorts on the columns the endpoint orders by, and not on the owner', async () => {
    const wrapper = await mountLocations()

    // name/created/modified are the endpoint's ordering allow-list
    // (apps/equipment/views.py). The owner column is a display column showing
    // the related name while filtering on the key, so ordering by it would sort
    // by id and not match the labels the table shows - it offers no sort.
    expect(wrapper.find('th[aria-label="Sort by created"]').exists()).toBe(true)
    expect(wrapper.find('th[aria-label="Sort by modified"]').exists()).toBe(true)
    expect(wrapper.find('th[aria-label="Sort by customer"]').exists()).toBe(false)
    expect(wrapper.find('th[aria-label="Sort by branch"]').exists()).toBe(false)

    await wrapper.get('th[aria-label="Sort by name"]').trigger('click')
    await settle()

    // The term the header click put on the wire names an allowed column (the
    // kit's toggle decides which direction this click landed on), and the page
    // resets to the first.
    const query = listRequests().at(-1).query
    expect(query.ordering).toMatch(/^-?name$/)
    expect(query.page).toBe('1')
  })

  test('keeps the ordering a shared address carries', async () => {
    window.history.replaceState(null, '', '/#/?ordering=name')
    await mountLocations()
    await settle()

    // `ordering` is a declared parameter on this endpoint now, so URL sync
    // restores it into the sort state and it rides the wire.
    expect(listRequests()[0].query).toMatchObject({ordering: 'name'})
  })

  test('a search term is debounced onto the wire', async () => {
    const wrapper = await mountLocations()
    await settle()

    await wrapper.get('input[aria-label="Search locations"]').setValue('berg')
    await new Promise((resolve) => setTimeout(resolve, 350))
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({q: 'berg', page: '1'})
  })

  test('the name links to the mount\'s view route', async () => {
    const wrapper = await mountLocations()
    await settle()

    expect(wrapper.get('tbody a').attributes('href')).toBe('/equipment/locations/21')
  })

  test('a customer mount shows no owner column', async () => {
    const wrapper = await mountLocations({
      main: {getMemberHasBranches: false},
      auth: {isEmployee: false, isCustomer: true},
    })
    await settle()

    expect(wrapper.get('thead').text()).not.toContain('Branch')
    expect(wrapper.get('tbody').text()).toContain('Bergruimte')
  })

  test('an empty list has an explicit empty state', async () => {
    api.get(endpoint, paginated([]))
    const wrapper = await mountLocations()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('No locations found')
  })

  test('a load failure tells the user', async () => {
    api.get(endpoint, serverError)
    await mountLocations()
    await settle()

    expect(bodies()).toContain('Error loading locations')
  })
})

describe('LocationList row actions', () => {
  test('delete confirms, sends the row id and refetches', async () => {
    const wrapper = await mountLocationSettings()
    await settle()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)

    modal('delete-location-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'delete').path).toBe(endpoint + '21/')
    expect(listRequests()).toHaveLength(2)
    expect(bodies()).toContain('Location has been deleted')
  })

  test('a failed delete keeps the row and reports it', async () => {
    api.delete(endpoint + '{id}/', serverError)
    const wrapper = await mountLocationSettings()
    await settle()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-location-modal').ok()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('Bergruimte')
    expect(bodies()).toContain('Error deleting location')
  })

  test('the row actions are absent without the settings mount', async () => {
    const wrapper = await mountLocations()
    await settle()

    expect(wrapper.find('button[title="Delete"]').exists()).toBe(false)
    expect(wrapper.find('button[title="Edit"]').exists()).toBe(false)
  })
})

describe('LocationList QR export', () => {
  afterEach(() => vi.restoreAllMocks())

  test('exports the committed search term and saves the spreadsheet', async () => {
    const saved = captureDownloads()
    api.get('/api/equipment/location-export-qr/', xlsxResponse)
    const wrapper = await mountLocations()
    await settle()

    await wrapper.get('input[aria-label="Search locations"]').setValue('berg & ruimte')
    await new Promise((resolve) => setTimeout(resolve, 350))
    await settle()
    await wrapper.get('button[title="Download QR-codes"]').trigger('click')
    await settle()

    const exports = api.requests().filter((request) => request.path === '/api/equipment/location-export-qr/')
    expect(exports.map((request) => request.query)).toEqual([{ q: 'berg & ruimte' }])
    expect(saved).toEqual(['locations.xlsx'])
  })
})

describe('LocationList column filters', () =>
{
  test('a column filter rides the wire under its bare column name', async () =>
  {
    const wrapper = await mountLocations()
    await settle()

    await addFilter(wrapper, 'Name')
    await editorInput(wrapper, 'name').setValue('Bergruimte')
    // The kit commits the search and the filters on a 300 ms debounce.
    await new Promise((resolve) => setTimeout(resolve, 350))
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({name: 'Bergruimte'})

    // The kit mirrors the filters into the address, so a shared link restores them.
    expect(window.location.hash).toContain('name=Bergruimte')
  })
})
