import { beforeEach, describe, expect, test, vi } from 'vitest'

import UnconfirmedSickLeaveList from '@/views/company/time-registration/UnconfirmedSickLeaveList.vue'

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

// Call-shape characterisation for the single migrated call in
// UnconfirmedSickLeaveList. doConfirm() used to call
// SickLeavesService.setAsConfirmed(pk), which POSTed
// `/company/user-sick-leave/admin/{pk}/set_confirmed/` with
// `this.preUpdate({})` as the body (an empty object); it now calls the
// generated companyUserSickLeaveAdminSetConfirmedCreate with
// `path: { id: Number(pk) }` and NO body. The list read
// (getUnconfirmedSickLeaves -> BaseModel.list) was not migrated and is out of
// scope.

beforeEach(() => {
  resetFakeHttp(fakeHttp, {
    // created() -> loadData() -> getUnconfirmedSickLeaves() BaseModel list,
    // and the same list reloaded after the action.
    '/company/user-sick-leave/admin/all_unconfirmed/': { results: [{ id: 1 }], count: 1 },
  })
})

// What the list fetch puts on the wire, pinned by mounting the view rather
// than by calling the service - which is what catches a setup() that no longer
// resolves. The shape is the contract a later useListQuery conversion has to
// reproduce.
describe('UnconfirmedSickLeaveList - list fetch', () => {
  test('fetches page one by default', async () => {
    await mountListView(UnconfirmedSickLeaveList)
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/company/user-sick-leave/admin/all_unconfirmed/', query: { page: '1' }, body: undefined },
    ])
  })

})
