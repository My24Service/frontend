import { beforeEach, describe, expect, test, vi } from 'vitest'

import PartnerRequestsSentForm from '@/views/company/PartnerRequestsSentForm.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

// Call-shape characterisation for the migrated SDK call in
// PartnerRequestsSentForm.vue.
//
// Pre-refactor (192a67d9) getMembers(query) called
// `memberModel.getForPartnerSelect(query)`, which was
// `this.axios.get('/member/member/get_for_partner_select/?q=${query}')` on the
// Member model (src/models/member/Member.js). The refactor replaced it with
// `memberMemberGetForPartnerSelectList({ query: { q: query }, throwOnError: true })`
// from @/api/sdk.gen, whose url is '/api/member/member/get_for_partner_select/'
// and whose query is serialized the same way (`q=<query>`). Same path (modulo
// the /api prefix), same query - behavior preserved.
//
// The form also submits through partnerRequestsSentModel.insert() (BaseModel
// CRUD), which the refactor did not touch and this spec does not pin.

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

/** Mount and wait for created()'s initial member search to land. */
async function ready() {
  const wrapper = mountForm(PartnerRequestsSentForm)
  await vi.waitFor(() =>
    expect(fakeHttp.get).toHaveBeenCalledWith(
      expect.stringContaining('/get_for_partner_select/'),
    ),
  )
  return wrapper
}

beforeEach(() => {
  resetFakeHttp(fakeHttp)
})

describe('PartnerRequestsSentForm - member search (call shape)', () => {
  test('created() searches GET /api/member/member/get_for_partner_select/ with an empty q', async () => {
    await ready()

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      {
        method: 'get',
        path: '/api/member/member/get_for_partner_select/',
        query: { q: '' },
        body: undefined,
      },
    ])
  })

  test('getMembers forwards the query as the q query parameter', async () => {
    const wrapper = await ready()

    await wrapper.vm.getMembers('acme')

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      {
        method: 'get',
        path: '/api/member/member/get_for_partner_select/',
        query: { q: '' },
        body: undefined,
      },
      {
        method: 'get',
        path: '/api/member/member/get_for_partner_select/',
        query: { q: 'acme' },
        body: undefined,
      },
    ])
  })
})
