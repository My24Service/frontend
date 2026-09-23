import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { vBuilding, vCustomer } from '@/api/valibot.gen'
import { BuildingList } from '@/features/equipment'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

import { addFilter, editorInput } from '../../support/column-filters.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({create: toastCreate}),
}))

const api = installApiSeam()
const endpoint = '/api/equipment/building/'

// The screen's links are its own: it takes no route_prefix, and it has one
// mount, so one name family. See tests/unit/router/equipment-route-names.spec.js
// for the contract that every name these screens emit is registered somewhere.
const routes = [
  {name: 'equipment-building-add', path: '/equipment/buildings/form', component: {template: '<div />'}},
  {name: 'equipment-building-edit', path: '/equipment/buildings/form/:pk', component: {template: '<div />'}},
  {name: 'equipment-building-view', path: '/equipment/buildings/:pk', component: {template: '<div />'}},
  {name: 'customer-view', path: '/customers/:pk', component: {template: '<div />'}},
  {name: 'company-branch-view', path: '/company/branches/:pk', component: {template: '<div />'}},
]

function building(overrides = {}) {
  return fixtureFor(vBuilding, {
    id: 31,
    name: 'Hoofdgebouw',
    customer: 7,
    branch: 9,
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
  api.get(endpoint, () => paginated([building()], {count: 45}))
  api.delete(endpoint + '{id}/', noContent)
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountBuildings(options = {}) {
  const wrapper = await mountListView(BuildingList, {
    deep: true,
    routes,
    main: {getMemberHasBranches: true},
    auth: {isEmployee: false, isCustomer: false},
    ...options,
  })
  await settle()
  return wrapper
}

describe('BuildingList', () => {
  test('loads page one and renders its columns', async () => {
    const wrapper = await mountBuildings()

    expect(listRequests()[0]).toMatchObject({path: endpoint, query: {page: '1', page_size: '20'}})
    const body = wrapper.get('tbody').text()
    expect(body).toContain('Hoofdgebouw')
    expect(body).toContain('Acme')
    expect(wrapper.get('h3').text()).toContain('Buildings')
  })

  test('sorts on the columns the endpoint orders by', async () => {
    const wrapper = await mountBuildings()
    await settle()

    // name/created/modified are the endpoint's ordering allow-list
    // (apps/equipment/views.py).
    expect(wrapper.find('th[aria-label="Sort by created"]').exists()).toBe(true)
    expect(wrapper.find('th[aria-label="Sort by modified"]').exists()).toBe(true)

    await wrapper.get('th[aria-label="Sort by name"]').trigger('click')
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({ordering: 'name', page: '1'})
  })

  test('a search term is debounced onto the wire', async () => {
    const wrapper = await mountBuildings()

    await wrapper.get('input[aria-label="Search buildings"]').setValue('hoofd')
    await new Promise((resolve) => setTimeout(resolve, 350))
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({q: 'hoofd', page: '1'})
  })

  test('the name links into the equipment route family on a branch tenant', async () => {
    const wrapper = await mountBuildings()

    expect(wrapper.get('tbody a[href="/equipment/buildings/31"]').exists()).toBe(true)
  })

  test('the new-building link follows the same branch', async () => {
    const wrapper = await mountBuildings()

    expect(wrapper.get('a.btn').attributes('href')).toBe('/equipment/buildings/form')
  })

  test('a branchless tenant gets the same links, not a family that does not exist', async () => {
    // The legacy screen asked for `customers-building-*` here, and no router
    // ever registered those names, so every link on a branchless tenant was
    // dead. The screen has one mount, so it has one name family.
    const wrapper = await mountBuildings({main: {getMemberHasBranches: false}})

    expect(wrapper.get('tbody a[href="/equipment/buildings/31"]').exists()).toBe(true)
    expect(wrapper.get('a.btn').attributes('href')).toBe('/equipment/buildings/form')
  })

  test('a row with no owner view renders without throwing', async () => {
    api.get(endpoint, () => paginated([building({customer_branch_view: null})], {count: 1}))
    const wrapper = await mountBuildings()

    expect(wrapper.get('tbody').text()).toContain('Hoofdgebouw')
  })

  test('an empty list has an explicit empty state', async () => {
    api.get(endpoint, paginated([]))
    const wrapper = await mountBuildings()

    expect(wrapper.get('tbody').text()).toContain('No buildings found')
  })

  test('a load failure tells the user', async () => {
    api.get(endpoint, serverError)
    await mountBuildings()

    expect(bodies()).toContain('Error loading buildings')
  })
})

describe('BuildingList delete', () => {
  test('confirms, sends the row id and refetches', async () => {
    const wrapper = await mountBuildings()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)

    modal('delete-building-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'delete').path).toBe(endpoint + '31/')
    expect(listRequests()).toHaveLength(2)
    expect(bodies()).toContain('building has been deleted')
  })

  test('a failed delete keeps the row and reports it', async () => {
    api.delete(endpoint + '{id}/', serverError)
    const wrapper = await mountBuildings()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-building-modal').ok()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('Hoofdgebouw')
    expect(bodies()).toContain('Error deleting building')
  })
})

describe('BuildingList column filters', () =>
{
  test('a column filter rides the wire under its bare column name', async () =>
  {
    const wrapper = await mountBuildings()
    await settle()

    await addFilter(wrapper, 'Name')
    await editorInput(wrapper, 'name').setValue('Hoofdgebouw')
    // The kit commits the search and the filters on a 300 ms debounce.
    await new Promise((resolve) => setTimeout(resolve, 350))
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({name: 'Hoofdgebouw'})

    // The kit mirrors the filters into the address, so a shared link restores them.
    expect(window.location.hash).toContain('name=Hoofdgebouw')
  })
})
