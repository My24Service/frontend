import { beforeEach, describe, expect, test, vi } from 'vitest'

import SubNav from '@/components/SubNav.vue'

import { mountForm, resetFakeHttp } from '../support/form-harness.js'
import { requestShapes } from '../support/request-recorder.js'

/**
 * Call-shape characterisation for the members SubNav's created() fetch, whose
 * hand-written MemberService.getRequestedCount() call moved to the generated
 * memberMemberRequestedCountRetrieve. The old members subnav collapsed into
 * the config-driven SubNav (section "members"), which keeps the unconditional
 * fetch for the Requested badge.
 *
 * Golden shape, derived from 192a67d9 (pre-refactor): the old method GETed
 * `/member/member/requested_count/`; the new op GETs
 * `/api/member/member/requested_count/`. Identical path, no query, no body.
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
  const { apiClientMock } = await import('../support/api-client-mock.js')
  return apiClientMock(fakeHttp)
})

async function flushPromises() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

beforeEach(() => {
  resetFakeHttp(fakeHttp)
})

describe('SubNav (members section)', () => {
  test('fetches the requested-members count on load', async () => {
    fakeHttp.get.mockResolvedValue({ data: { count: 5 } })

    const wrapper = mountForm(SubNav, {
      props: { section: 'members' },
      auth: { isAdmin: true, isSuperuser: true },
    })
    await flushPromises()

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/member/member/requested_count/', query: {}, body: undefined },
    ])
    expect(wrapper.vm.requestedCount).toBe(5)
  })
})
