import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { vBranch } from '@/api/valibot.gen'
import BranchList from '@/features/company/branch/BranchList.vue'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({ create: toastCreate }),
}))

const api = installApiSeam()
const endpoint = '/api/company/branch/'

const routes = [
  { name: 'company-branches', path: '/company/branches', component: { template: '<div />' } },
  { name: 'company-branch-add', path: '/company/branches/form', component: { template: '<div />' } },
  { name: 'company-branch-edit', path: '/company/branches/form/:pk', component: { template: '<div />' } },
  { name: 'company-branch-view', path: '/company/branches/:pk', component: { template: '<div />' } },
  { name: 'settings-branch-add', path: '/settings/branches/form', component: { template: '<div />' } },
  { name: 'settings-branch-edit', path: '/settings/branches/form/:pk', component: { template: '<div />' } },
  { name: 'settings-branch-view', path: '/settings/branches/:pk', component: { template: '<div />' } },
]

function branch(overrides = {}) {
  return fixtureFor(vBranch, {
    id: 9,
    name: 'Vestiging Noord',
    address: 'Voorstraat 1',
    postal: '9711 AA',
    city: 'Groningen',
    country_code: 'NL',
    tel: '050-1234567',
    email: 'noord@example.com',
    contact: 'J. Jansen',
    mobile: '06-12345678',
    created: '01-01-2026',
    modified: '02-01-2026',
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)
const listRequests = () => api.requests().filter((request) => request.method === 'get' && request.path === endpoint)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => paginated([branch()], { count: 45 }))
  api.delete(endpoint + '{id}/', noContent)
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountBranches(options = {}) {
  return mountListView(BranchList, {
    deep: true,
    routes,
    ...options,
  })
}

describe('BranchList', () => {
  test('loads page one and renders every column', async () => {
    const wrapper = await mountBranches()
    await settle()

    expect(listRequests()[0]).toMatchObject({ path: endpoint, query: { page: '1', page_size: '20' } })
    const body = wrapper.get('tbody').text()
    expect(body).toContain('Vestiging Noord, Groningen, NL')
    expect(body).toContain('J. Jansen')
    expect(body).toContain('050-1234567')
    expect(body).toContain('06-12345678')
    expect(body).toContain('Voorstraat 1')
    expect(wrapper.get('h3').text()).toContain('Branches')
  })

  test('the contact links to the email address when there is one', async () => {
    const wrapper = await mountBranches()
    await settle()

    const mailto = wrapper.get('tbody').findAll('a').find((a) => (a.attributes('href') ?? '').startsWith('mailto:'))
    expect(mailto.attributes('href')).toBe('mailto:noord@example.com')
  })

  test('a contact without an email renders as plain text', async () => {
    api.get(endpoint, () => paginated([branch({ email: null })]))
    const wrapper = await mountBranches()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('J. Jansen')
    expect(wrapper.get('tbody').findAll('a[href^="mailto:"]')).toHaveLength(0)
  })

  test('a sort click sorts the wire through the ordering allow-list', async () => {
    const wrapper = await mountBranches()
    await settle()

    await wrapper.get('th[aria-label="Sort by name"]').trigger('click')
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({ ordering: 'name' })
  })

  test('a search term is debounced onto the wire', async () => {
    const wrapper = await mountBranches()
    await settle()

    await wrapper.get('input[aria-label="Search branches"]').setValue('noord')
    await new Promise((resolve) => setTimeout(resolve, 350))
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({ q: 'noord', page: '1' })
  })

  test('the identity cell links to the mount\'s view route', async () => {
    const wrapper = await mountBranches()
    await settle()

    expect(wrapper.get('tbody a').attributes('href')).toBe('/company/branches/9')
  })

  test('a settings mount links to the settings family', async () => {
    const wrapper = await mountBranches({ props: { from_settings: true } })
    await settle()

    expect(wrapper.get('tbody a').attributes('href')).toBe('/settings/branches/9')
  })

  test('an empty list has an explicit empty state', async () => {
    api.get(endpoint, paginated([]))
    const wrapper = await mountBranches()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('No branches found')
  })

  test('a load failure tells the user', async () => {
    api.get(endpoint, serverError)
    await mountBranches()
    await settle()

    expect(bodies()).toContain('Error loading branches')
  })
})

describe('BranchList row actions', () => {
  test('delete confirms, sends the row id and refetches', async () => {
    const wrapper = await mountBranches()
    await settle()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)

    modal('delete-branch-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'delete').path).toBe(endpoint + '9/')
    expect(listRequests()).toHaveLength(2)
    expect(bodies()).toContain('Branch has been deleted')
  })

  test('a failed delete keeps the row and reports it', async () => {
    api.delete(endpoint + '{id}/', serverError)
    const wrapper = await mountBranches()
    await settle()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-branch-modal').ok()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('Vestiging Noord')
    expect(bodies()).toContain('Error deleting branch')
  })

  test('the row actions show on the settings mount too', async () => {
    const wrapper = await mountBranches({ props: { from_settings: true } })
    await settle()

    // The edit control is a link (its title sits on the anchor); the delete
    // control is a button.
    expect(wrapper.find('button[title="Delete"]').exists()).toBe(true)
    expect(wrapper.find('a[title="Edit"]').exists()).toBe(true)
  })
})
