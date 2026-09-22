import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { vUserLeaveHours } from '@/api/valibot.gen'
import { LeaveList } from '@/features/workforce'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { workforceRoutes } from '../../support/workforce-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({ create: toastCreate }),
}))

const api = installApiSeam()
const endpoint = '/api/company/user-leave-hours/admin/'

function leave(overrides = {}) {
  return fixtureFor(vUserLeaveHours, {
    id: 9,
    user: 7,
    full_name: 'Jan Jansen',
    username: 'jjansen',
    start_date: '01-02-2026',
    start_date_iso: '2026-02-01',
    end_date: '01-02-2026',
    end_date_iso: '2026-02-01',
    total_hours: 8,
    total_minutes: 0,
    leave_type: 3,
    leave_type_name: 'Vakantie',
    last_status_full: 'Aangevraagd',
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)
const listRequests = () => api.requests().filter((request) => request.method === 'get' && request.path === endpoint)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => paginated([leave()], { count: 45 }))
  api.delete(endpoint + '{id}/', noContent)
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountLeaves(options = {}) {
  return mountListView(LeaveList, { deep: true, routes: workforceRoutes, ...options })
}

describe('LeaveList', () => {
  test('loads page one and renders every column', async () => {
    const wrapper = await mountLeaves()
    await settle()

    expect(listRequests()[0]).toMatchObject({ path: endpoint, query: { page: '1' } })
    const body = wrapper.get('tbody').text()
    expect(body).toContain('Jan Jansen')
    expect(body).toContain('01-02-2026 / 8:0')
    expect(body).toContain('Vakantie')
    expect(body).toContain('Aangevraagd')
    expect(wrapper.get('h3').text()).toContain('Leave')
  })

  test('the user cell links to the leave editor', async () => {
    const wrapper = await mountLeaves()
    await settle()

    expect(wrapper.get('tbody tr a').attributes('href')).toBe('/company/time-registration/leave/form/9')
  })

  test('a multi-day leave renders as a range', async () => {
    api.get(endpoint, () => paginated([leave({ end_date: '05-02-2026', end_date_iso: '2026-02-05' })]))
    const wrapper = await mountLeaves()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('01-02-2026 - 05-02-2026 / 8:0')
  })

  test('the add button links to the add route', async () => {
    const wrapper = await mountLeaves()
    await settle()

    expect(wrapper.get('header a.btn').attributes('href')).toBe('/company/time-registration/leave/form')
  })

  // The search moved from the toolbar's modal to the kit's inline field; only
  // the selector changed, the parameter it puts on the wire is the same.
  test('a search term rides the wire as q', async () => {
    const wrapper = await mountLeaves()
    await settle()

    await wrapper.get('input[aria-label="Search leave"]').setValue('jansen')
    await new Promise((resolve) => setTimeout(resolve, 350))
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({ q: 'jansen', page: '1' })
  })

  test('an empty list has an explicit empty state', async () => {
    api.get(endpoint, paginated([]))
    const wrapper = await mountLeaves()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('No leave found')
  })

  test('a load failure tells the user', async () => {
    api.get(endpoint, serverError)
    await mountLeaves()
    await settle()

    expect(bodies()).toContain('Error loading leave requests')
  })
})

describe('LeaveList row actions', () => {
  test('delete confirms, sends the row id and refetches', async () => {
    const wrapper = await mountLeaves()
    await settle()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)

    modal('delete-leave-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'delete').path).toBe(endpoint + '9/')
    expect(listRequests()).toHaveLength(2)
    expect(bodies()).toContain('Leave has been deleted')
  })

  test('the edit action opens the leave editor', async () => {
    const wrapper = await mountLeaves()
    await settle()

    expect(wrapper.get('tbody a[title="Edit"]').attributes('href')).toBe('/company/time-registration/leave/form/9')
  })

  test('a failed delete reports it', async () => {
    api.delete(endpoint + '{id}/', serverError)
    const wrapper = await mountLeaves()
    await settle()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-leave-modal').ok()
    await settle()

    expect(bodies()).toContain('Error deleting leave')
  })
})
