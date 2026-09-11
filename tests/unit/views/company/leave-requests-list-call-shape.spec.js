import { beforeEach, describe, expect, test, vi } from 'vitest'

import LeaveRequestsList from '@/views/company/time-registration/LeaveRequestsList.vue'

import { mountListView, resetFakeHttp } from '../../support/form-harness.js'
import { modal } from '../../support/modal.js'
import { requestShapes } from '../../support/request-recorder.js'

const fakeHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/services/api', () => ({ default: fakeHttp, normalClient: fakeHttp }))

vi.mock('@/api/client.gen', async () => {
  const { apiClientMock } = await import('../../support/api-client-mock.js')
  return apiClientMock(fakeHttp)
})

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

// Call-shape characterisation for LeaveRequestsList.
//
// doAccept() and doReject() both go through the legacy service and POST
// `/company/user-leave-hours/admin/{pk}/set_accepted|rejected/` with
// `this.preUpdate({})` as the body (an empty object). Neither has been
// migrated to the generated companyUserLeaveHoursAdminSet* operations, and the
// list read (getLeaveRequests -> BaseModel.list) has not either.
//
// This header used to claim all three had moved to the generated operations.
// They had not, and because nothing here asserted a write at all, doReject()
// went on calling `leaveHoursService.doReject(pk)` - a method that does not
// exist - long after the mislabelled service method it replaced. The call threw
// into its own catch, the user was told "Error rejecting leave", and the suite
// stayed green. The two write cases below are what would have caught it.

beforeEach(() => {
  resetFakeHttp(fakeHttp, {
    // created() -> loadData() -> getLeaveRequests() BaseModel list, and the
    // same list reloaded after each action.
    '/company/user-leave-hours/admin/all_not_accepted/': { results: [{ id: 1 }], count: 1 },
  })
})

// What the list fetch puts on the wire, pinned by mounting the view rather
// than by calling the service - which is what catches a setup() that no longer
// resolves. The shape is the contract a later useListQuery conversion has to
// reproduce.
describe('LeaveRequestsList - list fetch', () => {
  test('fetches page one by default', async () => {
    await mountListView(LeaveRequestsList)
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/company/user-leave-hours/admin/all_not_accepted/', query: { page: '1' }, body: undefined },
    ])
  })
})

/**
 * Confirm the modal the row action just opened. The wait is load-bearing:
 * bootstrap-vue-next renders the footer immediately but does not emit `ok`
 * until the modal has finished opening, so clicking straight after the row
 * action lands on a button that is still display:none and does nothing.
 */
async function confirm(id) {
  await vi.waitFor(() => expect(modal(id).isOpen()).toBe(true))
  modal(id).ok()
}

/** The row action whose title says `word`, driven as a user would click it. */
function rowAction(wrapper, word) {
  const action = wrapper
    .findAll('a')
    .find((link) => new RegExp(word, 'i').test(link.attributes('title') || ''))

  expect(action, `the row offers a ${word} action`).toBeTruthy()
  return action
}

describe('LeaveRequestsList - accepting and rejecting', () => {
  test('rejecting posts set_rejected for the row it was shown', async () => {
    const wrapper = await mountListView(LeaveRequestsList, { deep: true })
    await vi.waitFor(() => expect(wrapper.findAll('tbody tr')).toHaveLength(1))

    await rowAction(wrapper, 'reject').trigger('click')
    await confirm('reject-leave-modal')
    await vi.waitFor(() => expect(requestShapes(fakeHttp, { method: 'post' })).toHaveLength(1))

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([
      { method: 'post', path: '/api/company/user-leave-hours/admin/1/set_rejected/', query: {}, body: {} },
    ])
  })

  test('accepting posts set_accepted for the row it was shown', async () => {
    const wrapper = await mountListView(LeaveRequestsList, { deep: true })
    await vi.waitFor(() => expect(wrapper.findAll('tbody tr')).toHaveLength(1))

    await rowAction(wrapper, 'accept').trigger('click')
    await confirm('accept-leave-modal')
    await vi.waitFor(() => expect(requestShapes(fakeHttp, { method: 'post' })).toHaveLength(1))

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([
      { method: 'post', path: '/api/company/user-leave-hours/admin/1/set_accepted/', query: {}, body: {} },
    ])
  })
})
