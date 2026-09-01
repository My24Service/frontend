import { beforeEach, describe, expect, test, vi } from 'vitest'

import NavItems from '@/components/NavItems.vue'
import NavItemsBranch from '@/components/NavItemsBranch.vue'
import NavItemsSettings from '@/components/NavItemsSettings.vue'

import { mountForm, resetFakeHttp } from '../support/form-harness.js'
import { requestShapes } from '../support/request-recorder.js'

// Call-shape characterisation for the migrated count badge call shared by the
// three nav components.
//
// Each created() hook used to call MemberService.getRequestedCount()
// (src/models/member/Member.js), which GETed `/member/member/requested_count/`
// (baseURL '/api'). It now calls the generated memberMemberRequestedCountRetrieve,
// whose URL is the same `/api/member/member/requested_count/`. No query, no
// body. The `showMembers` (isAdmin) guard around the call predates the
// refactor and is pinned too.

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

const STAFF = {
  userInfo: { user: { pk: 1, is_staff: true, is_superuser: false, username: 'staff' }, submodel: 'staff' },
}

const NON_ADMIN = {
  userInfo: { user: { pk: 2, is_staff: false, is_superuser: false, username: 'plain' }, submodel: 'staff' },
}

// hasAccessToModule() reads the member contract; seed one that admits every
// module the templates ask about so mounting never throws.
const MAIN = {
  getMemberHasBranches: false,
  memberContract: {
    orders: [],
    invoices: [],
    equipment: [],
    customers: [],
    inventory: [],
    mobile: [],
    quotations: [],
    members: [],
    '3d': [],
    webshop: [],
  },
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, {
    '/member/member/requested_count/': { count: 3 },
  })
})

describe.each([
  ['NavItems', NavItems],
  ['NavItemsBranch', NavItemsBranch],
  ['NavItemsSettings', NavItemsSettings],
])('%s', (name, component) => {
  test('fetches the requested member count from the requested_count action', async () => {
    mountForm(component, { main: MAIN, auth: STAFF })
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalledTimes(1))

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      {
        method: 'get',
        path: '/api/member/member/requested_count/',
        query: {},
        body: undefined,
      },
    ])
  })

  test('skips the count request when the user is not an admin', async () => {
    mountForm(component, { main: MAIN, auth: NON_ADMIN })

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([])
  })
})
