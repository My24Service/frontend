import { beforeEach, describe, expect, test, vi } from 'vitest'

import { MemberListTable } from '@/features/member'
import { vPaginatedMemberList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { createTestQueryClient, toasts } from '../../support/form-harness.js'
import { mountList, rowTexts, serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * MemberListTable — the TanStack Table prototype screen.
 *
 * Everything this screen does is visible in exactly one place: the wire
 * query. Sorting, column filters, the search term and the page state are
 * all owned by `useServerPagedList` and folded into one `useQuery` key, so
 * every behaviour claim here is asserted against what the client actually
 * sent (`api.requests()`), never against component internals.
 *
 * Two regressions this suite exists to pin, both of which shipped silently:
 *
 * - **Column filters that filter nothing.** The table's column-filter state
 *   is controlled, so a keystroke in a filter input reaches the screen only
 *   through `onColumnFiltersChange`. Without that handler the update has
 *   nowhere to land — no error, no warning, just a wire query that never
 *   gains `city__icontains`.
 * - **Rows-per-page that only worked from page two.** The page size must be
 *   part of the wire query; from page one the state change alone produced an
 *   identical request, so nothing refetched.
 *
 * Column-filter and search terms commit on a 300 ms debounce; `pastDebounce`
 * waits it out.
 */

const api = installApiSeam()

const ITEM = itemSchemaOf(vPaginatedMemberList)

/** The variant a staff superuser sees on the active list. */
const SUPERUSER = { auth: { isSuperuser: true } }

function memberPage(names = ['Acme BV', 'Umbrella NV'], { count = 45 } = {}) {
  return paginated(
    names.map((name, index) =>
      fixtureFor(ITEM, {
        id: index + 39,
        name,
        companycode: `code-${index + 39}`,
        city: 'Rotterdam',
        member_type: index % 2 === 0 ? 'temps' : 'maintenance',
      }),
    ),
    { count },
  )
}

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

beforeEach(() => {
  api.get('/api/member/member/', memberPage())
  api.delete('/api/member/member/{id}/', noContent)
})

describe('MemberListTable, wire contract', () => {
  test('the initial load as a superuser sends the page, the page size and the variant filters', async () => {
    await mountList(MemberListTable, SUPERUSER)

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/member/member/',
      query: {
        page: '1',
        page_size: '20',
        is_deleted: 'false',
        is_requested: 'false',
      },
    })
  })

  test('the deleted variant asks for deleted members only', async () => {
    await mountList(MemberListTable, { props: { variant: 'deleted' }, ...SUPERUSER })

    expect(api.requests().at(-1).query).toEqual({
      page: '1',
      page_size: '20',
      is_deleted: 'true',
    })
  })

  test('shows a row for every member the backend returned', async () => {
    const wrapper = await mountList(MemberListTable, SUPERUSER)

    expect(rowTexts(wrapper).length).toBe(2)
    expect(rowTexts(wrapper)[0]).toContain('Acme BV')
    expect(rowTexts(wrapper)[1]).toContain('Umbrella NV')
  })

  test('links each companycode to that member\'s form', async () => {
    const wrapper = await mountList(MemberListTable, SUPERUSER)

    const hrefs = wrapper.findAll('tbody a').map((link) => link.attributes('href'))

    expect(hrefs).toContain('/members/member/39')
    expect(hrefs).toContain('/members/member/40')
  })
})

describe('MemberListTable sorting', () => {
  test('clicking a header sorts ascending on the wire', async () => {
    const wrapper = await mountList(MemberListTable, SUPERUSER)

    await wrapper.get('th[aria-label="Sort by city"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ ordering: 'city' })
  })

  test('clicking the same header again flips to descending', async () => {
    const wrapper = await mountList(MemberListTable, SUPERUSER)

    await wrapper.get('th[aria-label="Sort by city"]').trigger('click')
    await settle()
    await wrapper.get('th[aria-label="Sort by city"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ ordering: '-city' })
  })
})

describe('MemberListTable column filters', () => {
  test('typing in the city filter narrows on the wire', async () => {
    const wrapper = await mountList(MemberListTable, SUPERUSER)

    await wrapper.get('input[aria-label="Filter city"]').setValue('ams')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ city__icontains: 'ams' })
  })

  test('typing in the companycode filter narrows on the wire', async () => {
    const wrapper = await mountList(MemberListTable, SUPERUSER)

    await wrapper.get('input[aria-label="Filter companycode"]').setValue('code-39')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ companycode__icontains: 'code-39' })
  })

  test('choosing a member type narrows on the wire', async () => {
    const wrapper = await mountList(MemberListTable, SUPERUSER)

    await wrapper.get('select[aria-label="Filter member_type"]').setValue('temps')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ member_type: 'temps' })
  })

  test('changing a filter replaces its parameter', async () => {
    const wrapper = await mountList(MemberListTable, SUPERUSER)

    await wrapper.get('input[aria-label="Filter city"]').setValue('ams')
    await pastDebounce()

    await wrapper.get('input[aria-label="Filter city"]').setValue('rot')
    await pastDebounce()

    // Clearing entirely would land back on the initial query — a cache hit,
    // not a request — so the pin here is a change to another uncached value.
    expect(api.requests().at(-1).query).toMatchObject({ city__icontains: 'rot' })
  })

  test('a new filter resets the page to one', async () => {
    const wrapper = await mountList(MemberListTable, SUPERUSER)

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    await wrapper.get('input[aria-label="Filter city"]').setValue('ams')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ page: '1', city__icontains: 'ams' })
  })
})

describe('MemberListTable pagination', () => {
  test('changing rows-per-page on page one refetches with the new page size', async () => {
    const wrapper = await mountList(MemberListTable, SUPERUSER)

    await wrapper.get('select[aria-label="Rows per page"]').setValue('10')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '1', page_size: '10' })
  })

  test('the next-page button asks for page two', async () => {
    const wrapper = await mountList(MemberListTable, SUPERUSER)

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', page_size: '20' })
  })

  test('sorting after paging resets to page one', async () => {
    const wrapper = await mountList(MemberListTable, SUPERUSER)

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    await wrapper.get('th[aria-label="Sort by city"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '1', ordering: 'city' })
  })

  test('disables the next-page button when everything fits on one page', async () => {
    api.get('/api/member/member/', memberPage(['Acme BV', 'Umbrella NV'], { count: 2 }))
    const wrapper = await mountList(MemberListTable, SUPERUSER)

    expect(wrapper.get('button[aria-label="Next page"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('.row-count').text()).toContain('2')
  })

  test('the control bar is centred, not stretched across the page', async () => {
    const wrapper = await mountList(MemberListTable, SUPERUSER)

    expect(wrapper.get('.server-table-pagination').classes()).toContain('d-inline-flex')
    expect(wrapper.get('.server-table-pagination').element.parentElement.classList).toContain('justify-content-center')
  })
})

describe('MemberListTable search', () => {
  test('the toolbar search commits the term to the wire', async () => {
    const wrapper = await mountList(MemberListTable, SUPERUSER)

    await wrapper.get('input[aria-label="Search name, companycode or city"]').setValue('demo')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ q: 'demo' })
  })

  test('a fresh search resets the page to one', async () => {
    const wrapper = await mountList(MemberListTable, SUPERUSER)

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    await wrapper.get('input[aria-label="Search name, companycode or city"]').setValue('demo')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ page: '1', q: 'demo' })
  })
})

describe('MemberListTable loading and empty states', () => {
  test('keeps the loading row up until the list arrives', async () => {
    let release
    api.get('/api/member/member/', () => new Promise((resolve) => { release = resolve }))

    const wrapper = await mountList(MemberListTable, SUPERUSER)

    expect(wrapper.find('.table-state-row .spinner-border').exists()).toBe(true)

    release(paginated([]))
    await settle()

    expect(wrapper.findAll('.table-state-row').length).toBe(1)
    expect(wrapper.findAll('tbody tr').length).toBe(1)
  })

  test('says so when the backend returned nothing', async () => {
    api.get('/api/member/member/', paginated([]))
    const wrapper = await mountList(MemberListTable, SUPERUSER)

    expect(wrapper.text()).toContain('No members found')
  })
})

describe('MemberListTable load errors', () => {
  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/member/member/', serverError)

    await mountList(MemberListTable, SUPERUSER)

    expect(toasts().map((toast) => toast.body)).toContain('Error loading members')
  })
})

describe('MemberListTable delete', () => {
  test('deletes through the confirmation modal and refetches', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = await mountList(MemberListTable, { ...SUPERUSER, queryClient })

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-member-modal').ok()
    await settle()

    const deleteSent = api.requests().find((sent) => sent.method === 'delete')
    expect(deleteSent).toMatchObject({ path: '/api/member/member/39/' })
    expect(toasts().map((toast) => toast.body)).toContain('Member has been deleted')
    // The invalidation reaches the list query through the shared client.
    const listFetches = api.requests().filter((sent) => sent.method === 'get')
    expect(listFetches.length).toBeGreaterThan(1)
  })

  test('does not delete anything until the confirmation is accepted', async () => {
    const wrapper = await mountList(MemberListTable, SUPERUSER)

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })
})
