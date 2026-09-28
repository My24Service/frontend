import { describe, expect, test } from 'vitest'

import SubNav from '@/components/SubNav.vue'

import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountForm } from '../support/form-harness.js'

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

const api = installApiSeam()


describe('SubNav (members section)', () => {
  test('fetches the requested-members count on load', async () => {
    api.get('/api/member/member/requested_count/', { count: 5 })

    const wrapper = mountForm(SubNav, {
      props: { section: 'members' },
      auth: { isAdmin: true, isSuperuser: true },
    })
    await settle()

    expect(api.requests().filter((request) => request.method === 'get')).toEqual([
      { method: 'get', path: '/api/member/member/requested_count/', query: {}, body: undefined },
    ])
    expect(wrapper.vm.requestedCount).toBe(5)
  })
})
