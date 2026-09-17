import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { vCustomer, vEquipment, vEquipmentState } from '@/api/valibot.gen'
import EquipmentList from '@/features/equipment/equipment/EquipmentList.vue'
import my24 from '@/services/my24'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({create: toastCreate}),
}))

const api = installApiSeam()
const endpoint = '/api/equipment/equipment/'

// Every route name the screen's cells and header link to, so a deep mount can
// resolve them - a <router-link> with an unknown name throws at setup.
const routes = [
  {name: 'equipment-equipment-add', path: '/equipment/equipment/form', component: {template: '<div />'}},
  {name: 'equipment-equipment-edit', path: '/equipment/equipment/form/:pk', component: {template: '<div />'}},
  {name: 'equipment-equipment-edit-technical', path: '/equipment/equipment/technical/form/:pk', component: {template: '<div />'}},
  {name: 'equipment-equipment-edit-facility', path: '/equipment/equipment/facility/form/:pk', component: {template: '<div />'}},
  {name: 'equipment-equipment-view', path: '/equipment/equipment/:pk', component: {template: '<div />'}},
  {name: 'equipment-equipment-view-technical', path: '/equipment/equipment/technical/:pk', component: {template: '<div />'}},
  {name: 'equipment-equipment-view-facility', path: '/equipment/equipment/facility/:pk', component: {template: '<div />'}},
  {name: 'customer-view', path: '/customers/:pk', component: {template: '<div />'}},
  {name: 'company-branch-view', path: '/company/branches/:pk', component: {template: '<div />'}},
  // The settings layout shares this screen, and its row actions link into the
  // settings name family.
  {name: 'settings-equipment-add', path: '/settings/equipment/form', component: {template: '<div />'}},
  {name: 'settings-equipment-edit', path: '/settings/equipment/form/:pk', component: {template: '<div />'}},
  {name: 'settings-equipment-edit-technical', path: '/settings/equipment/technical/form/:pk', component: {template: '<div />'}},
  {name: 'settings-equipment-edit-facility', path: '/settings/equipment/facility/form/:pk', component: {template: '<div />'}},
  {name: 'settings-equipment-view-technical', path: '/settings/equipment/technical/:pk', component: {template: '<div />'}},
  {name: 'settings-equipment-view-facility', path: '/settings/equipment/facility/:pk', component: {template: '<div />'}},
]

function equipment(overrides = {}) {
  return fixtureFor(vEquipment, {
    id: 11,
    name: 'Ketel 3000',
    brand: 'Remeha',
    location_name: 'Zolder',
    num_orders: 4,
    latest_state: fixtureFor(vEquipmentState, {id: 3, equipment: 11, state: 'Goed', replace_months: 12}),
    customer: 7,
    branch: 9,
    // A union of Customer and Branch: a hand-written {id, name, city} is
    // neither, so the fixture has to be a complete member of the union.
    customer_branch_view: fixtureFor(vCustomer, {id: 7, name: 'Acme', city: 'Utrecht'}),
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)
const listRequests = () => api.requests().filter((request) => request.method === 'get' && request.path === endpoint)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => paginated([equipment()], {count: 45}))
  api.delete(endpoint + '{id}/', noContent)
  api.post('/api/equipment/equipment-state/', ({body}) => fixtureFor(vEquipmentState, {id: 5, ...body}))
})
afterEach(() => window.history.replaceState(null, '', '/'))

/**
 * The settings mount: its layout is what turns the row-action column on, so
 * every delete/add-state spec goes through here.
 */
async function mountEquipmentSettings(options = {}) {
  return mountEquipment({
    props: {route_prefix: 'settings-equipment', from_settings: true},
    ...options,
  })
}

async function mountEquipment(options = {}) {
  const wrapper = await mountListView(EquipmentList, {
    deep: true,
    routes,
    props: {route_prefix: 'equipment-equipment'},
    main: {getMemberHasBranches: true},
    auth: {isEmployee: false, isCustomer: false},
    ...options,
  })
  await settle()
  return wrapper
}

describe('EquipmentList loads the type it was asked for', () => {
  test('requests the default type and renders every column', async () => {
    const wrapper = await mountEquipment()

    expect(listRequests()[0]).toMatchObject({
      path: endpoint,
      query: {type: 'technical', page: '1', page_size: '20'},
    })
    const body = wrapper.get('tbody').text()
    expect(body).toContain('Ketel 3000')
    expect(body).toContain('Remeha')
    expect(body).toContain('Zolder')
    expect(body).toContain('Goed')
    expect(body).toContain('12')
    expect(body).toContain('4')
    expect(wrapper.get('h3').text()).toContain('Equipment')
  })

  test('a facility mount asks the endpoint for facility', async () => {
    await mountEquipment({props: {route_prefix: 'equipment-equipment', type: 'facility'}})

    expect(listRequests()[0].query.type).toBe('facility')
  })

  test('a shared address restores the search term and page before the first request', async () => {
    window.history.replaceState(null, '', '/#/?q=ketel&page=2')
    const wrapper = await mountEquipment()

    expect(listRequests()[0].query).toMatchObject({q: 'ketel', page: '2', page_size: '20'})
    expect(wrapper.get('input[aria-label="Search equipment"]').element.value).toBe('ketel')
  })

  test('an empty list has an explicit empty state', async () => {
    api.get(endpoint, paginated([]))
    const wrapper = await mountEquipment()

    expect(wrapper.get('tbody').text()).toContain('No equipment found')
  })

  test('a list load failure tells the user and stops the spinner', async () => {
    api.get(endpoint, serverError)
    const wrapper = await mountEquipment()

    expect(bodies()).toContain('Error loading equipment')
    expect(wrapper.text()).not.toContain('Loading...')
  })
})

describe('EquipmentList sorting rides the endpoint ordering allow-list', () => {
  test('clicking a sortable header sends ordering, not sort_field', async () => {
    const wrapper = await mountEquipment()

    // The header cell is itself the control; there is no inner button.
    await wrapper.get('th[aria-label="Sort by name"]').trigger('click')
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({ordering: 'name', page: '1'})
  })

  test('the owner columns are not offered as sortable, because the allow-list excludes them', async () => {
    const wrapper = await mountEquipment()

    // The endpoint's ordering enum is name/brand/identifier/serialnumber/
    // description/type/num_orders; a customer or branch header would send a
    // term the contract does not admit.
    expect(wrapper.find('th[aria-label="Sort by branch"]').exists()).toBe(false)
    expect(wrapper.find('th[aria-label="Sort by brand"]').exists()).toBe(true)
    expect(wrapper.find('th[aria-label="Sort by num_orders"]').exists()).toBe(true)
  })
})

describe('EquipmentList search', () => {
  test('a typed term is debounced, committed and reset to page one', async () => {
    const wrapper = await mountEquipment()
    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()
    expect(listRequests().at(-1).query.page).toBe('2')

    await wrapper.get('input[aria-label="Search equipment"]').setValue('ketel & pomp')
    await new Promise((resolve) => setTimeout(resolve, 350))
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({q: 'ketel & pomp', page: '1'})
  })
})

describe('EquipmentList row actions', () => {
  test('the name links to the typed view route on a branch tenant', async () => {
    const wrapper = await mountEquipment()

    expect(wrapper.get('tbody a').attributes('href')).toBe('/equipment/equipment/technical/11')
  })

  test('the owner cell links on the owner foreign key, not the row id', async () => {
    const wrapper = await mountEquipment()

    expect(wrapper.get('tbody a[href="/company/branches/9"]').exists()).toBe(true)
  })

  test('a row whose owner foreign key is null renders the label without an unresolvable link', async () => {
    api.get(endpoint, () => paginated([equipment({branch: null})], {count: 1}))
    const wrapper = await mountEquipment()

    expect(wrapper.get('tbody').text()).toContain('Acme')
    expect(wrapper.find('tbody a[href^="/company/branches/"]').exists()).toBe(false)
  })

  test('a customer mount shows no owner column and no brand column', async () => {
    const wrapper = await mountEquipment({
      main: {getMemberHasBranches: false},
      auth: {isEmployee: false, isCustomer: true},
    })

    expect(wrapper.find('tbody a[href="/customers/7"]').exists()).toBe(false)
    expect(wrapper.get('thead').text()).not.toContain('Brand')
    expect(wrapper.get('thead').text()).toContain('Location')
  })

  test('delete asks for confirmation, sends the row id, refetches and reports', async () => {
    const wrapper = await mountEquipmentSettings({main: {getMemberHasBranches: true}, auth: {isEmployee: false, isCustomer: false}})
    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)
    modal('delete-equipment-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'delete').path).toBe(endpoint + '11/')
    expect(listRequests()).toHaveLength(2)
    expect(bodies()).toContain('Equipment has been deleted')
  })

  test('cancelling the delete sends no mutation', async () => {
    const wrapper = await mountEquipmentSettings()
    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-equipment-modal').cancel()
    await settle()

    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)
  })

  test('a failed delete keeps the row and reports the failure', async () => {
    api.delete(endpoint + '{id}/', serverError)
    const wrapper = await mountEquipmentSettings()
    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-equipment-modal').ok()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('Ketel 3000')
    expect(bodies()).toContain('Error deleting equipment')
  })
})

describe('EquipmentList add state', () => {
  test('adding a state posts the row id and a numeric lifespan, then refetches', async () => {
    const wrapper = await mountEquipmentSettings()
    await wrapper.get('button[title="Add state"]').trigger('click')
    await settle()

    modal('add-state-modal').typeInto('#add-state-state', 'Versleten')
    modal('add-state-modal').typeInto('#add-state-replace_months', '6')
    modal('add-state-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'post')).toMatchObject({
      path: '/api/equipment/equipment-state/',
      // Not the string the input holds: the request schema declares an integer.
      body: {equipment: 11, state: 'Versleten', replace_months: 6},
    })
    expect(bodies()).toContain('State added')
    expect(listRequests()).toHaveLength(2)
  })

  test('an empty lifespan is omitted rather than sent as an empty string', async () => {
    const wrapper = await mountEquipmentSettings()
    await wrapper.get('button[title="Add state"]').trigger('click')
    await settle()

    modal('add-state-modal').typeInto('#add-state-state', 'Versleten')
    modal('add-state-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'post').body)
      .toEqual({equipment: 11, state: 'Versleten'})
  })

  test('a failed state add reports the failure', async () => {
    api.post('/api/equipment/equipment-state/', serverError)
    const wrapper = await mountEquipmentSettings()
    await wrapper.get('button[title="Add state"]').trigger('click')
    await settle()

    modal('add-state-modal').typeInto('#add-state-state', 'Versleten')
    modal('add-state-modal').ok()
    await settle()

    expect(bodies()).toContain('Error adding state')
  })
})

describe('EquipmentList QR export', () => {
  /**
   * The export URL is built by the screen and handed to
   * `my24.downloadItemAuth`, which GETs it outside the generated client and so
   * outside the seam. It is asserted here on the boundary the screen owns.
   */
  function spyDownload() {
    return vi.spyOn(my24, 'downloadItemAuth').mockImplementation(() => {})
  }

  test('exports the committed search term, encoded', async () => {
    const download = spyDownload()
    const wrapper = await mountEquipment()
    await wrapper.get('input[aria-label="Search equipment"]').setValue('ketel & pomp')
    await new Promise((resolve) => setTimeout(resolve, 350))
    await settle()

    await wrapper.get('button[title="Download QR-codes"]').trigger('click')

    expect(download).toHaveBeenCalledWith(
      '/api/equipment/equipment-export-qr/?q=ketel+%26+pomp&type=technical', 'equipment.xlsx')
  })

  test('commits the search draft before exporting, so the file answers the screen', async () => {
    const download = spyDownload()
    const wrapper = await mountEquipment()

    // Deliberately no debounce wait: the export must not ship the previous term.
    await wrapper.get('input[aria-label="Search equipment"]').setValue('ketel')
    await wrapper.get('button[title="Download QR-codes"]').trigger('click')

    expect(download).toHaveBeenCalledWith(
      '/api/equipment/equipment-export-qr/?q=ketel&type=technical', 'equipment.xlsx')
  })

  test('an unfiltered export still scopes to the type on screen', async () => {
    const download = spyDownload()
    const wrapper = await mountEquipment()

    await wrapper.get('button[title="Download QR-codes"]').trigger('click')

    // The type is not a filter the user set, it is which screen this is: a
    // facility list exports facility QR codes.
    expect(download).toHaveBeenCalledWith(
      '/api/equipment/equipment-export-qr/?type=technical', 'equipment.xlsx')
  })

  test('a facility mount exports facility QR codes', async () => {
    const download = spyDownload()
    const wrapper = await mountEquipment({props: {route_prefix: 'equipment-equipment', type: 'facility'}})

    await wrapper.get('button[title="Download QR-codes"]').trigger('click')

    expect(download).toHaveBeenCalledWith(
      '/api/equipment/equipment-export-qr/?type=facility', 'equipment.xlsx')
  })
})
