import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { vResultResponse, vUserSickLeave } from '@/api/valibot.gen'
import SickLeaveList from '@/views/company/time-registration/SickLeaveList.vue'
import UnconfirmedSickLeaveList from '@/views/company/time-registration/UnconfirmedSickLeaveList.vue'
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
const resource = '/api/company/user-sick-leave/admin/'
const endpoint = resource

function sickLeave(overrides = {}) {
  return fixtureFor(vUserSickLeave, {
    id: 9,
    user: 7,
    user_full_name: 'Jan Jansen',
    full_name: 'Jan Jansen',
    created_by_fullname: 'Petra Planners',
    created_is_confirmed: false,
    start_date: '01-02-2026',
    end_date: null,
    last_status_full: 'Aangemeld',
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)
const listRequests = () => api.requests().filter((request) => request.method === 'get' && request.path === endpoint)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => paginated([sickLeave()], { count: 2 }))
  api.delete(endpoint + '{id}/', noContent)
  api.get(resource + 'all_unconfirmed/', () => paginated([sickLeave()], { count: 1 }))
  api.post(resource + '{id}/set_confirmed/', fixtureFor(vResultResponse, { result: true }))
})
afterEach(() => window.history.replaceState(null, '', '/'))

// The sub-nav the screens mount reads `getMemberCompanycode`, which reads
// `state.memberInfo` — null under a fresh testing pinia, and a getter that then
// throws. Seed a tenant so the nav renders the way it does in the application.
const TENANT = {memberInfo: {companycode: 'acme'}}

async function mountSick(options = {}) {
  return mountListView(SickLeaveList, { deep: true, routes: workforceRoutes, main: TENANT, ...options })
}

async function mountUnconfirmed(options = {}) {
  return mountListView(UnconfirmedSickLeaveList, { deep: true, routes: workforceRoutes, main: TENANT, ...options })
}

describe('SickLeaveList', () => {
  test('loads page one and renders every column', async () => {
    const wrapper = await mountSick()
    await settle()

    expect(listRequests()[0]).toMatchObject({ path: endpoint, query: { page: '1' } })
    const body = wrapper.get('tbody').text()
    expect(body).toContain('Jan Jansen')
    expect(body).toContain('01-02-2026')
    expect(body).toContain('Petra Planners')
    expect(body).toContain('Aangemeld')
    expect(wrapper.get('h3').text()).toContain('Sick leave')
  })

  test('a closed sick leave renders as a range', async () => {
    api.get(endpoint, () => paginated([sickLeave({ end_date: '05-02-2026' })]))
    const wrapper = await mountSick()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('01-02-2026 - 05-02-2026')
  })

  test('the edit action opens the sick-leave editor', async () => {
    const wrapper = await mountSick()
    await settle()

    expect(wrapper.get('tbody a[title="Edit"]').attributes('href')).toBe('/company/time-registration/sick-leave/form/9')
  })

  test('the add button links to the add route', async () => {
    const wrapper = await mountSick()
    await settle()

    expect(wrapper.get('header a.btn').attributes('href')).toBe('/company/time-registration/sick-leave/form')
  })

  test('a load failure tells the user', async () => {
    api.get(endpoint, serverError)
    await mountSick()
    await settle()

    expect(bodies()).toContain('Error loading sick leave request')
  })

  // CHARACTERISATION OF A DEFECT: showDeleteModal() reads a bare `id` it never
  // receives - the template passes the row id to a method that declares no
  // parameter - so the handler throws before the modal is shown and no sick
  // leave can be deleted at all. Pinned as it stands; the conversion repairs it
  // and this expectation flips.
  test('the delete action cannot open the confirmation', async () => {
    const wrapper = await mountSick()
    await settle()

    await expect(wrapper.get('button[title="Delete"]').trigger('click')).rejects.toThrow('id is not defined')
    expect(modal('delete-sick-leave-modal').isOpen()).toBe(false)
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)
  })
})

describe('UnconfirmedSickLeaveList', () => {
  test('loads the unconfirmed page one and renders every column', async () => {
    const wrapper = await mountUnconfirmed()
    await settle()

    expect(api.requests().filter((request) => request.method === 'get')).toEqual([
      expect.objectContaining({ path: resource + 'all_unconfirmed/', query: { page: '1' } }),
    ])
    const body = wrapper.get('tbody').text()
    expect(body).toContain('Jan Jansen')
    expect(body).toContain('01-02-2026')
    expect(body).toContain('Petra Planners')
    expect(wrapper.get('h3').text()).toContain('Unconfirmed sick leave')
  })

  test('confirming posts set_confirmed for the row it was shown', async () => {
    const wrapper = await mountUnconfirmed()
    await settle()

    const confirm = wrapper.get('tbody a[title="Confirm"]')
    await confirm.trigger('click')
    await settle()
    modal('confirm-leave-modal').ok()
    await settle()

    expect(api.requests().filter((request) => request.method === 'post')).toEqual([
      expect.objectContaining({ path: resource + '9/set_confirmed/' }),
    ])
    expect(bodies()).toContain('Leave as been marked as confirmed')
  })

  test('a failed confirm reports it', async () => {
    api.post(resource + '{id}/set_confirmed/', serverError)
    const wrapper = await mountUnconfirmed()
    await settle()

    await wrapper.get('tbody a[title="Confirm"]').trigger('click')
    await settle()
    modal('confirm-leave-modal').ok()
    await settle()

    expect(bodies()).toContain('Error confirming sick leave')
  })

  test('a load failure tells the user', async () => {
    api.get(resource + 'all_unconfirmed/', serverError)
    await mountUnconfirmed()
    await settle()

    expect(bodies()).toContain('Error loading unconfirmed sick leave request')
  })
})
