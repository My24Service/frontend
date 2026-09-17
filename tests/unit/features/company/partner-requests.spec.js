import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { vMinimalMember, vPartnerRequest } from '@/api/valibot.gen'
import PartnerRequestsSentList from '@/features/company/partner/PartnerRequestsSentList.vue'
import PartnerRequestsReceivedList from '@/features/company/partner/PartnerRequestsReceivedList.vue'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({ create: toastCreate }),
}))

const api = installApiSeam()

const SENT_PATH = '/api/company/partner-request/sent/'
const RECEIVED_PATH = '/api/company/partner-request/received/'

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
    ...overrides,
  })
}

function sentRequest(overrides = {}) {
  return fixtureFor(vPartnerRequest, {
    id: 31,
    from_member: 7,
    to_member: 11,
    from_member_view: memberView({ id: 7, companycode: 'mine', name: 'Mine BV' }),
    to_member_view: memberView(),
    status: 'requested',
    created: '01-01-2026',
    modified: '02-01-2026',
    ...overrides,
  })
}

function receivedRequest(overrides = {}) {
  return fixtureFor(vPartnerRequest, {
    id: 32,
    from_member: 11,
    to_member: 7,
    from_member_view: memberView(),
    to_member_view: memberView({ id: 7, companycode: 'mine', name: 'Mine BV' }),
    status: 'requested',
    created: '01-01-2026',
    modified: '02-01-2026',
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(SENT_PATH, () => paginated([sentRequest()]))
  api.get(RECEIVED_PATH, () => paginated([receivedRequest()]))
  api.delete('/api/company/partner-request/{id}/', noContent)
  api.patch('/api/company/partner-request/{id}/accept/', { success: true })
  api.patch('/api/company/partner-request/{id}/reject/', { success: true })
  // Accepting births the relation, so the partners list refetches too.
  api.get('/api/company/partner/', () => paginated([]))
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountSent(options = {}) {
  return mountListView(PartnerRequestsSentList, { deep: true, routes, ...options })
}

async function mountReceived(options = {}) {
  return mountListView(PartnerRequestsReceivedList, { deep: true, routes, ...options })
}

describe('PartnerRequestsSentList', () => {
  test('loads the sent requests and renders the destination', async () => {
    const wrapper = await mountSent()
    await settle()

    const sent = api.requests().filter((request) => request.method === 'get' && request.path === SENT_PATH)
    expect(sent[0]).toMatchObject({ query: { page: '1', page_size: '20' } })
    const body = wrapper.get('tbody').text()
    expect(body).toContain('Acme BV')
    expect(body).toContain('requested')
  })

  test('a search term is debounced onto the wire', async () => {
    const wrapper = await mountSent()
    await settle()

    await wrapper.get('input[aria-label="Search partner requests"]').setValue('acme')
    await new Promise((resolve) => setTimeout(resolve, 350))
    await settle()

    const sent = api.requests().filter((request) => request.method === 'get' && request.path === SENT_PATH)
    expect(sent.at(-1).query).toMatchObject({ q: 'acme' })
  })

  test('delete confirms, sends the row id and refetches', async () => {
    const wrapper = await mountSent()
    await settle()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-partner-request-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'delete').path)
      .toBe('/api/company/partner-request/31/')
    expect(bodies()).toContain('Partner request has been deleted')
  })
})

describe('PartnerRequestsReceivedList', () => {
  test('loads the received requests and renders the sender', async () => {
    const wrapper = await mountReceived()
    await settle()

    const received = api.requests().filter((request) => request.method === 'get' && request.path === RECEIVED_PATH)
    expect(received[0]).toMatchObject({ query: { page: '1', page_size: '20' } })
    expect(wrapper.get('tbody').text()).toContain('Acme BV')
  })

  test('accepting confirms, patches accept and refetches both lists', async () => {
    const wrapper = await mountReceived()
    await settle()

    await wrapper.findAll('button').find((button) => button.text() === 'Accept').trigger('click')
    await settle()
    modal('accept-received-partner-request-modal').ok()
    await settle()

    const patch = api.requests().find((request) => request.method === 'patch')
    expect(patch.path).toBe('/api/company/partner-request/32/accept/')
    expect(bodies()).toContain('Partner request has been accepted')
    // The relation is born, so the partners list is marked stale too. It is
    // not mounted here, so nothing refetches on the wire; the received list
    // does.
    const received = api.requests().filter((request) => request.method === 'get' && request.path === RECEIVED_PATH)
    expect(received).toHaveLength(2)
  })

  test('rejecting confirms and patches reject', async () => {
    const wrapper = await mountReceived()
    await settle()

    await wrapper.findAll('button').find((button) => button.text() === 'Reject').trigger('click')
    await settle()
    modal('reject-received-partner-request-modal').ok()
    await settle()

    const patch = api.requests().filter((request) => request.method === 'patch')
    expect(patch).toHaveLength(1)
    expect(patch[0].path).toBe('/api/company/partner-request/32/reject/')
    expect(bodies()).toContain('Partner request has been rejected')
  })

  test('the reject dialog is titled Reject', async () => {
    const wrapper = await mountReceived()
    await settle()

    // The legacy dialog was titled "Accept?" - a copy slip on the reject path.
    await wrapper.findAll('button').find((button) => button.text() === 'Reject').trigger('click')
    await settle()

    expect(document.getElementById('reject-received-partner-request-modal').textContent).toContain('Reject?')
    expect(document.getElementById('reject-received-partner-request-modal').textContent).not.toContain('Accept?')
  })

  test('a non-requested row offers delete instead of accept and reject', async () => {
    api.get(RECEIVED_PATH, () => paginated([receivedRequest({ status: 'accepted' })]))
    const wrapper = await mountReceived()
    await settle()

    expect(wrapper.find('button[title="Delete"]').exists()).toBe(true)
    expect(wrapper.findAll('button').find((button) => button.text() === 'Accept')).toBe(undefined)
    expect(wrapper.findAll('button').find((button) => button.text() === 'Reject')).toBe(undefined)
  })

  test('a failed load names the received list', async () => {
    api.get(RECEIVED_PATH, serverError)
    await mountReceived()
    await settle()

    // The legacy toast blamed the *sent* list here.
    expect(bodies()).toContain('Error loading partner requests received')
  })
})
