import { beforeEach, describe, expect, test, vi } from 'vitest'

import SubNavMembers from '@/components/SubNavMembers.vue'

import { mountForm, resetFakeHttp } from '../support/form-harness.js'
import { requestShapes } from '../support/request-recorder.js'

/**
 * Call-shape characterisation for SubNavMembers.created(), whose hand-written
 * MemberService.getRequestedCount() call moved to the generated
 * memberMemberRequestedCountRetrieve.
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

describe('SubNavMembers', () => {
  test('fetches the requested-members count on load', async () => {
    fakeHttp.get.mockResolvedValue({ data: { count: 5 } })

    const wrapper = mountForm(SubNavMembers, { auth: { isAdmin: true, isSuperuser: true } })
    await flushPromises()

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/member/member/requested_count/', query: {}, body: undefined },
    ])
    expect(wrapper.vm.requestedCount).toBe(5)
  })
})
