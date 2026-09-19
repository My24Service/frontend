import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { vImport } from '@/api/valibot.gen'
import ImportList from '@/features/company/import/ImportList.vue'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({ create: toastCreate }),
}))

const api = installApiSeam()
const endpoint = '/api/company/import/'

const routes = [
  { name: 'company-import-list', path: '/company/import', component: { template: '<div />' } },
  { name: 'company-import-add', path: '/company/import/form', component: { template: '<div />' } },
  { name: 'company-import-edit', path: '/company/import/form/:pk', component: { template: '<div />' } },
  { name: 'company-import-preview', path: '/company/import/preview/:pk', component: { template: '<div />' } },
  { name: 'settings-company-import-list', path: '/settings/company/import', component: { template: '<div />' } },
  { name: 'settings-company-import-add', path: '/settings/company/import/form', component: { template: '<div />' } },
  { name: 'settings-company-import-edit', path: '/settings/company/import/form/:pk', component: { template: '<div />' } },
  { name: 'settings-company-import-preview', path: '/settings/company/import/preview/:pk', component: { template: '<div />' } },
]

function importRow(overrides = {}) {
  return fixtureFor(vImport, {
    id: 18,
    name: 'customers 2026',
    file: 'https://example.com/media/customers.xlsx',
    mapping: {},
    result_inserts: {},
    created: '01-01-2026',
    modified: '02-01-2026',
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)
const listRequests = () => api.requests().filter((request) => request.method === 'get' && request.path === endpoint)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => paginated([importRow()], { count: 45 }))
  api.delete(endpoint + '{id}/', noContent)
  api.post(endpoint + '{id}/revert/', { customers: [] })
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountImports(options = {}) {
  return mountListView(ImportList, {
    deep: true,
    routes,
    props: { route_prefix: 'company-import' },
    ...options,
  })
}

describe('ImportList', () => {
  test('loads page one and renders every column', async () => {
    const wrapper = await mountImports()
    await settle()

    expect(listRequests()[0]).toMatchObject({ path: endpoint, query: { page: '1', page_size: '20' } })
    const body = wrapper.get('tbody').text()
    expect(body).toContain('customers 2026')
    expect(body).toContain('customers.xlsx')
    expect(wrapper.get('h3').text()).toContain('Imports')
  })

  test('offers no sortable headers, because the endpoint declares no ordering', async () => {
    const wrapper = await mountImports()
    await settle()

    expect(wrapper.findAll('th.sortable-header')).toHaveLength(0)
    expect(listRequests()[0].query).not.toHaveProperty('ordering')
  })

  test('a search term is debounced onto the wire', async () => {
    const wrapper = await mountImports()
    await settle()

    await wrapper.get('input[aria-label="Search imports"]').setValue('customers')
    await new Promise((resolve) => setTimeout(resolve, 350))
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({ q: 'customers', page: '1' })
  })

  test('a pending row links to its preview and offers edit and delete', async () => {
    const wrapper = await mountImports()
    await settle()

    expect(wrapper.get('tbody a').attributes('href')).toBe('/company/import/preview/18')
    expect(wrapper.find('button[title="Delete"]').exists()).toBe(true)
  })

  test('an executed row offers revert instead of edit and delete', async () => {
    api.get(endpoint, () => paginated([importRow({ result_inserts: { customers: 3 } })]))
    const wrapper = await mountImports()
    await settle()

    const body = wrapper.get('tbody').text()
    expect(body).toContain('customers: 3 inserted')
    expect(wrapper.find('button[title="Delete"]').exists()).toBe(false)
    expect(wrapper.find('a[title="Revert import"]').exists()).toBe(true)
  })

  test('a settings mount links to the settings family', async () => {
    const wrapper = await mountImports({ props: { route_prefix: 'settings-company-import' } })
    await settle()

    expect(wrapper.get('tbody a').attributes('href')).toBe('/settings/company/import/preview/18')
  })

  test('an empty list has an explicit empty state', async () => {
    api.get(endpoint, paginated([]))
    const wrapper = await mountImports()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('No imports found')
  })

  test('a load failure tells the user', async () => {
    api.get(endpoint, serverError)
    await mountImports()
    await settle()

    expect(bodies()).toContain('Error loading imports')
  })
})

describe('ImportList row actions', () => {
  test('delete confirms, sends the row id and refetches', async () => {
    const wrapper = await mountImports()
    await settle()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)

    modal('delete-company-import-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'delete').path).toBe(endpoint + '18/')
    expect(listRequests()).toHaveLength(2)
    expect(bodies()).toContain('Import has been deleted')
  })

  test('revert confirms, posts revert and refetches', async () => {
    api.get(endpoint, () => paginated([importRow({ result_inserts: { customers: 3 } })]))
    const wrapper = await mountImports()
    await settle()

    await wrapper.get('a[title="Revert import"]').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.method === 'post')).toHaveLength(0)

    modal('revert-import-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'post').path).toBe(endpoint + '18/revert/')
    expect(listRequests()).toHaveLength(2)
    expect(bodies()).toContain('Import has been reverted')
  })

  test('a failed revert keeps the row and reports it', async () => {
    api.get(endpoint, () => paginated([importRow({ result_inserts: { customers: 3 } })]))
    api.post(endpoint + '{id}/revert/', serverError)
    const wrapper = await mountImports()
    await settle()

    await wrapper.get('a[title="Revert import"]').trigger('click')
    await settle()
    modal('revert-import-modal').ok()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('customers 2026')
    expect(bodies()).toContain('Error reverting import')
  })

  test('cancelling the revert sends no mutation', async () => {
    api.get(endpoint, () => paginated([importRow({ result_inserts: { customers: 3 } })]))
    const wrapper = await mountImports()
    await settle()

    await wrapper.get('a[title="Revert import"]').trigger('click')
    await settle()
    modal('revert-import-modal').cancel()
    await settle()

    expect(api.requests().filter((request) => request.method === 'post')).toHaveLength(0)
  })
})
