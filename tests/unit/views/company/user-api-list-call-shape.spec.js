import { beforeEach, describe, expect, test, vi } from 'vitest'

import UserApiList from '@/views/company/UserApiList.vue'

import { mountListView, resetFakeHttp, toastCreate } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Call-shape characterisation for UserApiList's migrated revoke call site.
 *
 * Pre-refactor (192a67d9) doRevoke() went through ApiUserService.revoke()
 * (src/models/company/UserApi.js), which posted to
 * `/company/apiuser/${pk}/revoke/`. The refactor replaced it with the generated
 * companyApiuserRevokeCreate op (POST /api/company/apiuser/{id}/revoke/), with
 * the row id coerced to a Number by the view.
 *
 * Path, method and id are unchanged. The one wire difference: the old
 * hand-written method always sent an empty JSON body (`axios.post(url, {},
 * headers)`) while the generated op sends no body at all (body: undefined).
 * The Django revoke action reads no payload, so this should be wire-equivalent,
 * but the spec pins the NEW behaviour exactly.
 */

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

beforeEach(() => {
  // The view also does BaseModel CRUD (apiUserService.list() in created() and
  // after each revoke), so the CSRF-token default GET must be served.
  resetFakeHttp(fakeHttp)
  toastCreate.mockClear()
})

// What the list fetch puts on the wire, pinned by mounting the view rather
// than by calling the service - which is what catches a setup() that no longer
// resolves. The shape is the contract a later useListQuery conversion has to
// reproduce.
describe('UserApiList - list fetch', () => {
  test('fetches page one by default', async () => {
    await mountListView(UserApiList)
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/company/apiuser/', query: { page: '1' }, body: undefined },
    ])
  })

})
