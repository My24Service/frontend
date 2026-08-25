import { beforeEach, describe, expect, test, vi } from 'vitest'

import MemberList from '@/views/member/MemberList.vue'
import { vPaginatedMemberList } from '@/api/valibot.gen'

import { goldenTest, goldensFor } from '../../helpers/golden.js'
import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { toasts } from '../../support/form-harness.js'
import {
  goToPage,
  mountList,
  openDelete,
  openSearch,
  rowTexts,
  serverError,
} from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * MemberList as it behaves today, before the Slice rewrites it (#319).
 *
 * Requests are asserted against `tests/unit/golden/member-list.json`, recorded
 * from the running application against a development tenant; see
 * tests/unit/golden/README.md.
 *
 * This screen is three screens. One component serves `member-list`,
 * `member-deleted-list` and `member-requested-list`, and what separates them is
 * a pair of props that decide which `is_deleted`/`is_requested` filter goes on
 * the wire — plus `isSuperuser`, which decides whether the default variant
 * filters at all. Getting one of those wrong shows a staff user the wrong set
 * of members and looks like nothing at all in the UI, so each variant is
 * recorded separately.
 *
 * `MemberService` is constructed per component here rather than being a shared
 * singleton, so unlike the other three lists there is no cross-test state to
 * reset.
 */

const api = installApiSeam()
const goldens = goldensFor('member-list')

const ITEM = itemSchemaOf(vPaginatedMemberList)

function memberPage(names = ['Acme BV', 'Umbrella NV']) {
  return paginated(
    names.map((name, index) =>
      // Ids 39 and 40 because the recorded delete golden names
      // /api/member/member/39/ - the row the capture deleted was the first one.
      fixtureFor(ITEM, { id: index + 39, name, companycode: `code-${index + 39}` }),
    ),
    { count: 45 },
  )
}

/** The variant a staff superuser sees at `member-list`. */
const SUPERUSER = { auth: { isSuperuser: true } }

beforeEach(() => {
  api.get('/api/member/member/', memberPage())
  api.delete('/api/member/member/{id}/', noContent)
})

describe('MemberList, loading', () => {
  goldenTest(goldens, 'initial load as superuser', 'member-list', async () => {
    await mountList(MemberList, SUPERUSER)
    return api.requests()
  })

  test('shows a row for every member the backend returned', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    expect(rowTexts(wrapper).length).toBe(2)
    expect(rowTexts(wrapper)[0]).toContain('Acme BV')
    expect(rowTexts(wrapper)[1]).toContain('Umbrella NV')
  })

  test('links each row to that member', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    expect(wrapper.findAll('tbody a').map((link) => link.attributes('href'))).toContain(
      '/members/member/39',
    )
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/member/member/', serverError)

    await mountList(MemberList, SUPERUSER)

    expect(toasts().map((toast) => toast.body)).toContain('Error loading members')
  })
})

// One component, three routes. Each asks the backend a different question, and
// the difference is invisible on screen — which is exactly why it is recorded.
describe('MemberList route variants', () => {
  goldenTest(goldens, 'deleted members', 'member-list', async () => {
    await mountList(MemberList, { props: { deleted: true }, ...SUPERUSER })
    return api.requests()
  })

  goldenTest(goldens, 'requested members', 'member-list', async () => {
    await mountList(MemberList, { props: { requested: true }, ...SUPERUSER })
    return api.requests()
  })

  goldenTest(goldens, 'initial load as staff', 'member-list', async () => {
    await mountList(MemberList)
    return api.requests()
  })

  test('offers Add member only to a superuser on the plain list', async () => {
    const asSuperuser = await mountList(MemberList, SUPERUSER)
    const asStaff = await mountList(MemberList)

    expect(asSuperuser.text()).toContain('Add member')
    expect(asStaff.text()).not.toContain('Add member')
  })

  test('offers Request new member on the requested list', async () => {
    const wrapper = await mountList(MemberList, { props: { requested: true }, ...SUPERUSER })

    expect(wrapper.text()).toContain('Request new member')
  })
})

describe('MemberList pagination', () => {
  test('asks the router for page two when page two is clicked', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    await goToPage(wrapper, 2)

    expect(wrapper.vm.$route.query).toMatchObject({ page: '2' })
  })

  goldenTest(goldens, 'page 2', 'member-list', async () => {
    await mountList(MemberList, { query: { page: '2' }, ...SUPERUSER })
    return api.requests()
  })
})

describe('MemberList search', () => {
  goldenTest(goldens, 'search', 'member-list', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    await openSearch(wrapper)
    modal('search-modal').type('demo')
    modal('search-modal').ok()
    await settle()

    return api.requests()
  })

  test('shows what the search came back with', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)
    api.get('/api/member/member/', memberPage(['Acme BV']))

    await openSearch(wrapper)
    modal('search-modal').type('demo')
    modal('search-modal').ok()
    await settle()

    expect(rowTexts(wrapper).length).toBe(1)
    expect(rowTexts(wrapper)[0]).toContain('Acme BV')
  })

  // Searched for "a" rather than "demo" because that is what this capture
  // typed - the plain search scenario above was recorded in a different
  // session. A golden is the request that was made, so each scenario drives
  // what its own capture drove.
  goldenTest(goldens, 'search then a page change', 'member-list', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    await openSearch(wrapper)
    modal('search-modal').type('a')
    modal('search-modal').ok()
    await settle()

    await goToPage(wrapper, 2)
    await mountList(MemberList, { query: wrapper.vm.$route.query, ...SUPERUSER })

    return api.requests()
  })

  // #313, on the screen it was reported against.
  //
  // The other three lists survive a page change because their model is a
  // module-level singleton that still holds `searchQuery`. MemberList builds
  // `new MemberService()` per component, and a page change **is** a remount
  // (`:key="$route.fullPath"` on the router-view), so the new instance starts
  // with no search term. `created()` therefore has to seed it from the route,
  // the way it already seeds `currentPage` — otherwise the URL says `q=acme`,
  // SearchModal goes on showing the term, and the results behind it are
  // unfiltered.
  test('keeps the search term across a page change', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    await openSearch(wrapper)
    modal('search-modal').type('demo')
    modal('search-modal').ok()
    await settle()

    await goToPage(wrapper, 2)

    // The URL keeps it...
    expect(wrapper.vm.$route.query).toMatchObject({ page: '2', q: 'demo' })

    await mountList(MemberList, { query: wrapper.vm.$route.query, ...SUPERUSER })

    // ...and so does the request.
    expect(api.requests().at(-1).query).toEqual({
      page: '2',
      q: 'demo',
      is_deleted: 'False',
      is_requested: 'False',
    })
  })

  test('goes on showing the search term in the search box', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    await openSearch(wrapper)
    modal('search-modal').type('demo')
    modal('search-modal').ok()
    await settle()

    await goToPage(wrapper, 2)
    const reloaded = await mountList(MemberList, { query: wrapper.vm.$route.query, ...SUPERUSER })

    await openSearch(reloaded)

    expect(document.querySelector('#search-modal input[type="text"]').value).toBe('demo')
  })
})

describe('MemberList delete', () => {
  goldenTest(goldens, 'delete', 'member-list', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    await openDelete(wrapper)
    modal('delete-member-modal').ok()
    await settle()

    return api.requests()
  })

  test('confirms the deletion to the user', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    await openDelete(wrapper)
    modal('delete-member-modal').ok()
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Member has been deleted')
  })

  test('does not delete anything until the confirmation is accepted', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    await openDelete(wrapper)
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })

  test('tells the user when the delete fails', async () => {
    api.delete('/api/member/member/{id}/', serverError)
    const wrapper = await mountList(MemberList, SUPERUSER)

    await openDelete(wrapper)
    modal('delete-member-modal').ok()
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Error deleting member')
  })
})
