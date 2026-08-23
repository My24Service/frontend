import { beforeEach, describe, expect, test, vi } from 'vitest'

import MemberForm from '@/views/member/MemberForm.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Call-shape characterisation for MemberForm.checkCompanyCode(), which reaches
 * the backend through MemberService.companycodeExists().
 *
 * On this branch that is the hand-written call: a GET to
 * `/member/companycode-exists/?companycode=<value>` through `@/services/api`,
 * whose `available` field is the resolved value. `requestShapes` canonicalizes
 * the `/api` prefix and parses the query string, so the recorded shape is the
 * same one a generated `memberCompanycodeExistsRetrieve` op would produce -
 * which is the point of characterising it here.
 *
 * The created() contract list (BaseModel CRUD, unchanged by the refactor) is
 * seeded so the mount settles; only the SDK shape is asserted.
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

const ROUTES = {
  // created() reads this.list() and then assigns member.contract from the
  // first result, so at least one contract is required for the mount to settle.
  '/member/contract/': { results: [{ id: 1, name: 'Contract A' }] },
  // Keyed on the path the legacy client actually calls (no `/api` prefix -
  // that lives in its baseURL), not on the normalized path `requestShapes`
  // reports back.
  '/member/companycode-exists/': { available: true },
}

const MAIN = { getCountries: [] }

async function flushPromises() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, ROUTES)
})

describe('MemberForm.checkCompanyCode', () => {
  test('checks company-code uniqueness through companycode-exists', async () => {
    const wrapper = mountForm(MemberForm, { main: MAIN })
    await flushPromises()
    fakeHttp.get.mockClear()

    await expect(wrapper.vm.checkCompanyCode('acme')).resolves.toBe(true)

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      {
        method: 'get',
        path: '/api/member/companycode-exists/',
        query: { companycode: 'acme' },
        body: undefined,
      },
    ])
  })
})
