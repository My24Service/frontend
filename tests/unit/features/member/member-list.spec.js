import { beforeEach, describe, expect, test, vi } from 'vitest'

import { MemberList } from '@/features/member'
import { vPaginatedMemberList } from '@/api/valibot.gen'

import { goldenTest, goldensFor } from '../../helpers/golden.js'
import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { createTestQueryClient, toasts } from '../../support/form-harness.js'
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
 * MemberList, rewritten into the feature folder (#324).
 *
 * One component serves three variants of the same list — active, deleted and
 * requested Members — through a single `variant` prop where the legacy screen
 * took two independent booleans. Two booleans encoded four states, one
 * meaningless; the router could express something the domain cannot. That
 * collapse is the ticket's declared behaviour change, recorded on #324.
 *
 * **A second declared exception on #324: boolean casing.** The recordings
 * spell these query parameters Django-style — `False`/`True`, because the
 * legacy screen hand-built its URLs — while the generated client validates
 * its query against the request schema and sends real booleans, which
 * serialise lowercase. Same parameters, and the backend's boolean field reads
 * both spellings; only the casing on the wire differs. Recorded scenarios are
 * compared through `normalizeBooleans` on both sides, so the recordings stay
 * untouched and everything else about them still binds exactly.
 *
 * Each variant folds its own filter into the query key — distinct cache
 * entries, so switching variants can never show a stale or foreign set — and
 * keeps the characterised asymmetry on the active variant: a superuser asks
 * for "no deleted, no requested" explicitly, while a plain staff user sends
 * no filter at all (`MemberViewset` applies its filterset only when a
 * parameter is present — source/apps/member/views.py:143-149), so staff see
 * soft-deleted rows there.
 */

const api = installApiSeam()
const goldens = goldensFor('member-list')

function normalizeBooleans(requests) {
  return requests.map((sent) => ({
    ...sent,
    query: Object.fromEntries(
      Object.entries(sent.query ?? {}).map(([key, value]) => [
        key,
        value === 'True' ? 'true' : value === 'False' ? 'false' : value,
      ]),
    ),
  }))
}

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
  }, normalizeBooleans)

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

  test('keeps the loading spinner up until the list arrives', async () => {
    let release
    api.get('/api/member/member/', () => new Promise((resolve) => { release = resolve }))

    const wrapper = await mountList(MemberList, SUPERUSER)

    expect(wrapper.find('#member-table .spinner-border').exists()).toBe(true)
    expect(rowTexts(wrapper)).toEqual(['Loading...'])

    release(paginated([]))
    await settle()

    expect(wrapper.find('#member-table .spinner-border').exists()).toBe(false)
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/member/member/', serverError)

    await mountList(MemberList, SUPERUSER)

    expect(toasts().map((toast) => toast.body)).toContain('Error loading members')
  })
})

// One component, three variants. Each asks the backend a different question,
// and the difference is invisible on screen — which is exactly why each is
// recorded.
describe('MemberList variants', () => {
  goldenTest(goldens, 'deleted members', 'member-list', async () => {
    await mountList(MemberList, { props: { variant: 'deleted' }, ...SUPERUSER })
    return api.requests()
  }, normalizeBooleans)

  goldenTest(goldens, 'requested members', 'member-list', async () => {
    await mountList(MemberList, { props: { variant: 'requested' }, ...SUPERUSER })
    return api.requests()
  }, normalizeBooleans)

  // Blocked: needs a staff login that is not a superuser, which the demo
  // tenant has no account for (golden/blocked.json). The staff view's visible
  // consequence is pinned live below instead.
  goldenTest(goldens, 'initial load as staff', 'member-list', async () => {
    await mountList(MemberList)
    return api.requests()
  })

  test('offers Add member only to a superuser on the active list', async () => {
    const asSuperuser = await mountList(MemberList, SUPERUSER)
    const asStaff = await mountList(MemberList)

    expect(asSuperuser.text()).toContain('Add member')
    expect(asStaff.text()).not.toContain('Add member')
  })

  test('offers Request new member on the requested list', async () => {
    const wrapper = await mountList(MemberList, { props: { variant: 'requested' }, ...SUPERUSER })

    expect(wrapper.text()).toContain('Request new member')
  })

  test('labels the pagination after the variant', async () => {
    const requested = await mountList(MemberList, { props: { variant: 'requested' }, ...SUPERUSER })
    const deleted = await mountList(MemberList, { props: { variant: 'deleted' }, ...SUPERUSER })
    const active = await mountList(MemberList, SUPERUSER)

    expect(requested.text()).toContain('Requested member')
    expect(deleted.text()).toContain('Deleted member')
    expect(active.text()).toContain('Member')
  })
})

describe('MemberList variant URLs', () => {
  // The route definitions changed shape - two booleans became one variant -
  // but these are bookmarkable staff pages, so the URLs must not move.
  test('the three variants live where they always did', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)
    const resolve = (name) => wrapper.vm.$router.resolve({name}).path

    expect(resolve('member-list')).toBe('/members/members')
    expect(resolve('member-deleted-list')).toBe('/members/deleted-members')
    expect(resolve('member-requested-list')).toBe('/members/requested-members')
  })
})

describe('MemberList variant cache isolation', () => {
  /**
   * Switching variants must never show another variant's rows. Each variant
   * folds its own filter into the query key, so they are distinct cache
   * entries; mounting twice onto one shared client proves it the way
   * navigation meets it: back to a just-visited variant inside the stale
   * window serves that variant's own cached rows instantly, while a variant
   * never visited still asks the backend.
   */
  test('returning to a variant serves its own cached rows, not another’s', async () => {
    const queryClient = createTestQueryClient()

    api.get('/api/member/member/', ({ query }) =>
      query.is_requested === 'true'
        ? paginated([fixtureFor(ITEM, {id: 60, name: 'Waiting BV'})])
        : paginated([fixtureFor(ITEM, {id: 39, name: 'Acme BV'})]),
    )

    const activeFirst = await mountList(MemberList, {...SUPERUSER, queryClient})
    expect(rowTexts(activeFirst)[0]).toContain('Acme BV')

    const requested = await mountList(MemberList, {props: {variant: 'requested'}, ...SUPERUSER, queryClient})
    expect(rowTexts(requested)[0]).toContain('Waiting BV')

    const activeAgain = await mountList(MemberList, {...SUPERUSER, queryClient})

    // Served from the active variant's own cache entry - no second request
    // for this key, and certainly nobody else's rows.
    expect(api.requests().filter((sent) => sent.query.is_requested === 'false')).toHaveLength(1)
    expect(rowTexts(activeAgain)[0]).toContain('Acme BV')
  })
})

/**
 * What a staff user who is not a superuser sees, which is not what a superuser
 * sees - and not because the backend decided so.
 *
 * The active variant sets `is_requested=False&is_deleted=False` only when
 * `isSuperuser`. A staff user therefore asks for the list with no filter at
 * all, and the backend hands back everything: `MemberViewset` is
 * `permission_classes = (IsAdminUser,)` over an unscoped
 * `queryset = Member.objects.all()`, with
 * `filterset_fields = ('is_deleted', 'is_requested')` applied only when those
 * parameters are present - source/apps/member/views.py:143-149. Deleting a
 * member is a soft delete for anything with a tenant (`destroy`, same file,
 * :174-183), so the rows are certainly there to be handed back.
 */
describe('MemberList, seen by a staff user who is not a superuser', () => {
  const ACTIVE = fixtureFor(ITEM, {
    id: 39,
    name: 'Acme BV',
    is_deleted: false,
    is_requested: false,
  })
  const SOFT_DELETED = fixtureFor(ITEM, {
    id: 41,
    name: 'Gone BV',
    is_deleted: true,
    is_requested: false,
  })

  /** The backend's filterset: each filter applies only when its parameter is sent. */
  function asBackendFilters(rows) {
    return ({ query }) =>
      paginated(
        rows.filter((row) => {
          for (const field of ['is_deleted', 'is_requested']) {
            if (query[field] === undefined) continue
            if (String(row[field]) !== String(query[field]).toLowerCase()) return false
          }
          return true
        }),
      )
  }

  beforeEach(() => {
    api.get('/api/member/member/', asBackendFilters([ACTIVE, SOFT_DELETED]))
  })

  test('a superuser is not shown members that were deleted', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    expect(rowTexts(wrapper).map((row) => row.includes('Gone BV'))).toEqual([false])
  })

  test('a staff user is', async () => {
    const wrapper = await mountList(MemberList)

    expect(rowTexts(wrapper).some((row) => row.includes('Gone BV'))).toBe(true)
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
  }, normalizeBooleans)

  test('fetches page two when page two is clicked', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    await goToPage(wrapper, 2)

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/member/member/',
      query: { page: '2' },
    })
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
  }, normalizeBooleans)

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
    await settle()

    return api.requests()
  }, normalizeBooleans)

  // #313, on the screen it was reported against.
  test('keeps the search term across a page change', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    await openSearch(wrapper)
    modal('search-modal').type('demo')
    modal('search-modal').ok()
    await settle()

    await goToPage(wrapper, 2)

    // The URL keeps it...
    expect(wrapper.vm.$route.query).toMatchObject({ page: '2', q: 'demo' })

    // ...and so does the request. Booleans go out lowercase - the declared
    // casing exception at the top of this file.
    expect(api.requests().at(-1).query).toEqual({
      page: '2',
      q: 'demo',
      is_deleted: 'false',
      is_requested: 'false',
    })
  })

  // These are bookmarkable pages: the URL carries both the term and the page,
  // so opening it cold has to land on the filtered page, not the defaults.
  test('a fresh load at a shared URL asks for both the term and the page', async () => {
    await mountList(MemberList, { query: { page: '2', q: 'demo' }, ...SUPERUSER })

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/member/member/',
      query: {page: '2', q: 'demo'},
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

  test('drops the search term when the user searches for nothing', async () => {
    const wrapper = await mountList(MemberList, { query: { q: 'demo' }, ...SUPERUSER })

    await openSearch(wrapper)
    modal('search-modal').type('')
    modal('search-modal').ok()
    await settle()

    expect(wrapper.vm.$route.query).toEqual({})
    expect(api.requests().at(-1).query).toMatchObject({ page: '1' })
    expect(api.requests().at(-1).query.q).toBeUndefined()
  })
})

describe('MemberList delete', () => {
  goldenTest(goldens, 'delete', 'member-list', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    await openDelete(wrapper)
    modal('delete-member-modal').ok()
    await settle()

    return api.requests()
  }, normalizeBooleans)

  test('re-fetches the page the user is on after deleting', async () => {
    const wrapper = await mountList(MemberList, { query: { page: '3' }, ...SUPERUSER })

    await openDelete(wrapper)
    modal('delete-member-modal').ok()
    await settle()

    expect(api.requests().at(-1)).toMatchObject({
      method: 'get',
      path: '/api/member/member/',
      query: { page: '3' },
    })
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
