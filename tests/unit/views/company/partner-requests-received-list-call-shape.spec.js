import { beforeEach, describe, expect, test, vi } from 'vitest'

import PartnerRequestsReceivedList from '@/views/company/PartnerRequestsReceivedList.vue'

import { mountListView, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

// Call-shape characterisation for the list fetch in
// PartnerRequestsReceivedList.vue.
//
// The accept/reject call sites are deliberately not pinned here. The specs
// replayed from the horizontal branch asserted the generated ops' shape - a
// PUT with no body and no CSRF handshake - where this branch's
// PartnerRequestsReceived model still PUTs an explicit `{}` with a CSRF token.
// That is a real wire-level difference, so those specs were dropped rather
// than reinterpreted (#315).

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
  resetFakeHttp(fakeHttp)
  // resetFakeHttp does not touch `put`; the model uses it for accept/reject, so
  // reset it here or call history leaks across tests.
  fakeHttp.put.mockReset()
  fakeHttp.put.mockResolvedValue({ data: {} })
})

// What the list fetch puts on the wire, pinned by mounting the view rather
// than by calling the service - which is what catches a setup() that no longer
// resolves. The shape is the contract a later useListQuery conversion has to
// reproduce.
describe('PartnerRequestsReceivedList - list fetch', () => {
  test('fetches page one by default', async () => {
    await mountListView(PartnerRequestsReceivedList)
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/company/partner-request/received/', query: { page: '1' }, body: undefined },
    ])
  })

})
