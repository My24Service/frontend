import { beforeEach, describe, expect, test } from 'vitest'

import NavItems from '@/components/NavItems.vue'

import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountForm } from '../support/form-harness.js'

// Call-shape characterisation for the migrated count badge call of the
// collapsed nav component (one NavItems with a mode prop replaced the three
// per-shell nav components).
//
// Each created() hook used to call MemberService.getRequestedCount()
// (src/models/member/Member.js), which GETed `/member/member/requested_count/`
// (baseURL '/api'). It now calls the generated memberMemberRequestedCountRetrieve,
// whose URL is the same `/api/member/member/requested_count/`. No query, no
// body. The `showMembers` (isAdmin) guard around the call predates the
// refactor and is pinned too.

const api = installApiSeam()

const STAFF = {
  userInfo: { user: { pk: 1, is_staff: true, is_superuser: false, username: 'staff' }, submodel: 'staff' },
}

const NON_ADMIN = {
  userInfo: { user: { pk: 2, is_staff: false, is_superuser: false, username: 'plain' }, submodel: 'staff' },
}

// hasAccessToModule() reads the profile's modules; seed every module the
// templates ask about so mounting never throws.
const MODULES = [
  'orders', 'invoices', 'equipment', 'customers', 'inventory', 'mobile',
  'quotations', 'members', '3d', 'webshop',
]
const MAIN = {
  getMemberHasBranches: false,
  getModules: MODULES,
  getModuleParts: Object.fromEntries(MODULES.map((m) => [m, []])),
}

beforeEach(() => {
  api.get('/api/member/member/requested_count/', { count: 3 })
})

const gets = () => api.requests().filter((request) => request.method === 'get')

describe.each([
  ['default', 'default'],
  ['branch', 'branch'],
  ['settings', 'settings'],
])('NavItems (%s mode)', (name, mode) => {
  test('fetches the requested member count from the requested_count action', async () => {
    mountForm(NavItems, { main: MAIN, auth: STAFF, props: { mode } })
    await settle()

    expect(gets()).toEqual([
      {
        method: 'get',
        path: '/api/member/member/requested_count/',
        query: {},
        body: undefined,
      },
    ])
  })

  test('skips the count request when the user is not an admin', async () => {
    mountForm(NavItems, { main: MAIN, auth: NON_ADMIN, props: { mode } })
    await settle()

    expect(gets()).toEqual([])
  })
})
