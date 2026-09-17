import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { vMinimalMember, vPartnerDetail } from '@/api/valibot.gen'
import PartnerList from '@/features/company/partner/PartnerList.vue'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({ create: toastCreate }),
}))

const api = installApiSeam()
const endpoint = '/api/company/partner/'

const routes = [
  { name: 'partner-request-add', path: '/company/partners/requests/form', component: { template: '<div />' } },
  { name: 'company-partners-active', path: '/company/partners/active', component: { template: '<div />' } },
  { name: 'company-partners-requests-sent', path: '/company/partners/requests-sent', component: { template: '<div />' } },
  { name: 'company-partners-requests-received', path: '/company/partners/requests-received', component: { template: '<div />' } },
]

function memberView(overrides = {}) {
  return fixtureFor(vMinimalMember, {
    id: 11,
    companycode: 'acme',
    name: 'Acme BV',
    city: 'Utrecht',
    email: 'info@acme.test',
    www: 'https://acme.test',
    has_branches: true,
    ...overrides,
  })
}

function partner(overrides = {}) {
  return fixtureFor(vPartnerDetail, {
    id: 6,
    partner: 11,
    partner_view: memberView(),
    created: '01-01-2026',
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)
const listRequests = () => api.requests().filter((request) => request.method === 'get' && request.path === endpoint)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => paginated([partner()], { count: 45 }))
  api.delete(endpoint + '{id}/', noContent)
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountPartners(options = {}) {
  return mountListView(PartnerList, {
    deep: true,
    routes,
    ...options,
  })
}

describe('PartnerList', () => {
  test('loads page one and renders every column', async () => {
    const wrapper = await mountPartners()
    await settle()

    expect(listRequests()[0]).toMatchObject({ path: endpoint, query: { page: '1', page_size: '20' } })
    const body = wrapper.get('tbody').text()
    expect(body).toContain('Acme BV')
    expect(body).toContain('acme')
    expect(body).toContain('Utrecht')
    expect(body).toContain('info@acme.test')
    expect(wrapper.get('h3').text()).toContain('Partners')
  })

  test('a sort click sorts the wire through the ordering allow-list', async () => {
    const wrapper = await mountPartners()
    await settle()

    await wrapper.get('th[aria-label="Sort by partner__name"]').trigger('click')
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({ ordering: 'partner__name' })
  })

  test('a search term is debounced onto the wire', async () => {
    const wrapper = await mountPartners()
    await settle()

    await wrapper.get('input[aria-label="Search partners"]').setValue('acme')
    await new Promise((resolve) => setTimeout(resolve, 350))
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({ q: 'acme', page: '1' })
  })

  test('an empty list has an explicit empty state', async () => {
    api.get(endpoint, paginated([]))
    const wrapper = await mountPartners()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('No partners found')
  })

  test('a load failure tells the user', async () => {
    api.get(endpoint, serverError)
    await mountPartners()
    await settle()

    expect(bodies()).toContain('Error loading partners')
  })
})

describe('PartnerList row actions', () => {
  test('delete confirms, sends the row id and refetches', async () => {
    const wrapper = await mountPartners()
    await settle()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)

    modal('delete-partner-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'delete').path).toBe(endpoint + '6/')
    expect(listRequests()).toHaveLength(2)
    expect(bodies()).toContain('partner has been deleted')
  })

  test('a failed delete keeps the row and reports it', async () => {
    api.delete(endpoint + '{id}/', serverError)
    const wrapper = await mountPartners()
    await settle()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-partner-modal').ok()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('Acme BV')
    expect(bodies()).toContain('Error deleting partner')
  })
})
