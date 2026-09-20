import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { vResultResponse, vUserLeaveHours } from '@/api/valibot.gen'
import LeaveRequestsList from '@/views/company/time-registration/LeaveRequestsList.vue'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { workforceRoutes } from '../../support/workforce-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({ create: toastCreate }),
}))

const api = installApiSeam()
const resource = '/api/company/user-leave-hours/admin/'
const endpoint = resource + 'all_not_accepted/'

function leaveRequest(overrides = {}) {
  return fixtureFor(vUserLeaveHours, {
    id: 1,
    user: 7,
    full_name: 'Jan Jansen',
    start_date: '01-02-2026',
    start_date_iso: '2026-02-01',
    end_date: '01-02-2026',
    end_date_iso: '2026-02-01',
    total_hours: 8,
    total_minutes: 0,
    leave_type_name: 'Vakantie',
    last_status_full: 'Aangevraagd',
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)
const listRequests = () => api.requests().filter((request) => request.method === 'get' && request.path === endpoint)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => paginated([leaveRequest()], { count: 3 }))
  api.post(resource + '{id}/set_accepted/', fixtureFor(vResultResponse, { result: true }))
  api.post(resource + '{id}/set_rejected/', fixtureFor(vResultResponse, { result: true }))
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountRequests(options = {}) {
  return mountListView(LeaveRequestsList, { deep: true, routes: workforceRoutes, ...options })
}

/** The row action whose title says `word`, driven as a user would click it. */
function rowAction(wrapper, word) {
  const action = wrapper.findAll('a').find((link) => new RegExp(word, 'i').test(link.attributes('title') || ''))
  expect(action, `the row offers a ${word} action`).toBeTruthy()
  return action
}

/** Confirm the modal the row action just opened, once it has finished opening. */
async function confirm(id) {
  await settle()
  modal(id).ok()
  await settle()
}

describe('LeaveRequestsList', () => {
  test('loads the unaccepted page one and renders every column', async () => {
    const wrapper = await mountRequests()
    await settle()

    expect(listRequests()[0]).toMatchObject({ path: endpoint, query: { page: '1' } })
    const body = wrapper.get('tbody').text()
    expect(body).toContain('Jan Jansen')
    expect(body).toContain('01-02-2026 / 8:0')
    expect(body).toContain('Vakantie')
    expect(body).toContain('Aangevraagd')
    expect(wrapper.get('h3').text()).toContain('Leave')
  })

  test('a load failure tells the user', async () => {
    api.get(endpoint, serverError)
    await mountRequests()
    await settle()

    expect(bodies()).toContain('Error loading leave requests')
  })
})

describe('LeaveRequestsList accepting and rejecting', () => {
  test('accepting posts set_accepted for the row it was shown', async () => {
    const wrapper = await mountRequests()
    await settle()

    await rowAction(wrapper, 'accept').trigger('click')
    await confirm('accept-leave-modal')

    expect(api.requests().filter((request) => request.method === 'post')).toEqual([
      expect.objectContaining({ path: resource + '1/set_accepted/' }),
    ])
    expect(bodies()).toContain('Leave as been accepted')
    expect(listRequests()).toHaveLength(2)
  })

  test('rejecting posts set_rejected for the row it was shown', async () => {
    const wrapper = await mountRequests()
    await settle()

    await rowAction(wrapper, 'reject').trigger('click')
    await confirm('reject-leave-modal')

    expect(api.requests().filter((request) => request.method === 'post')).toEqual([
      expect.objectContaining({ path: resource + '1/set_rejected/' }),
    ])
    expect(bodies()).toContain('Leave as been rejected')
    expect(listRequests()).toHaveLength(2)
  })

  test('a failed accept reports it', async () => {
    api.post(resource + '{id}/set_accepted/', serverError)
    const wrapper = await mountRequests()
    await settle()

    await rowAction(wrapper, 'accept').trigger('click')
    await confirm('accept-leave-modal')

    expect(bodies()).toContain('Error accepting leave')
  })
})
