import { beforeEach, describe, expect, test, vi } from 'vitest'

import LeaveRequestsList from '@/views/company/time-registration/LeaveRequestsList.vue'

import { mountListView, resetFakeHttp } from '../../support/form-harness.js'
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

// Call-shape characterisation for the two migrated calls in
// LeaveRequestsList. doAccept() used to call
// UserLeaveHoursService.acceptLeave(pk), doReject() used to call
// UserLeaveHoursService.rejectLeave(pk); both POSTed
// `/company/user-leave-hours/admin/{pk}/set_accepted|rejected/` with
// `this.preUpdate({})` as the body (an empty object). They now call the
// generated companyUserLeaveHoursAdminSetAcceptedCreate /
// companyUserLeaveHoursAdminSetRejectedCreate with `path: { id: Number(pk) }`
// and NO body. The list read (getLeaveRequests -> BaseModel.list) was not
// migrated and is out of scope.

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
