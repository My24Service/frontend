import { beforeEach, describe, expect, test, vi } from 'vitest'

import { MemberList } from '@/features/member'
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
 * MemberList — the members list, on the shared server-paged table kit.
 *
 * Everything this screen does is visible in exactly one place: the wire
 * query. Sorting, column filters, the search term and the page state are
 * all owned by `useServerPagedList` and folded into one `useQuery` key, so
 * every behaviour claim here is asserted against what the client actually
 * sent (`api.requests()`), never against component internals.
 *
 * This screen takes no column filters — the b-table screen it replaces
 * could not narrow on type either, and one lonely select under an otherwise
 * empty header row reads worse than no filter row at all. The kit's column
 * filtering is pinned by the Customer list suite instead.
 *
 * The regression this suite exists to pin: **rows-per-page that only worked
 * from page two.** The page size must be part of the wire query; from page
 * one the state change alone produced an identical request, so nothing
 * refetched.
 *
 * The search term commits on a 300 ms debounce; `pastDebounce` waits it
 * out.
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
        // Fields the mirrored composite and contract columns render.
        contract_text: 'Service contract 2026',
        country_code: 'NL',
        postal: `1234AB${index}`,
        email: `info-${index + 39}@acme.example`,
        is_public: index % 2 === 0,
        has_api_users: index === 0,
        has_branches: index === 1,
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

describe('MemberList, wire contract', () => {
  test('the initial load as a superuser sends the page, the page size and the variant filters', async () => {
    await mountList(MemberList, SUPERUSER)

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
    await mountList(MemberList, { props: { variant: 'deleted' }, ...SUPERUSER })

    expect(api.requests().at(-1).query).toEqual({
      page: '1',
      page_size: '20',
      is_deleted: 'true',
    })
  })

  test('shows a row for every member the backend returned', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    expect(rowTexts(wrapper).length).toBe(2)
    expect(rowTexts(wrapper)[0]).toContain('Acme BV')
    expect(rowTexts(wrapper)[1]).toContain('Umbrella NV')
  })
})

describe('MemberList, the mirrored columns', () => {
  test('the member_info cell is one link to that member\'s form', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    const hrefs = wrapper.findAll('tbody a').map((link) => link.attributes('href'))

    expect(hrefs).toEqual(['/members/member/39', '/members/member/40'])
  })

  test('the member_info cell mirrors the original composite', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)
    const [first, second] = rowTexts(wrapper)

    expect(first).toContain('Companycode: code-39')
    expect(first).toContain('Name: Acme BV')
    expect(first).toContain('NL-1234AB0 Rotterdam')
    expect(first).toContain('info-39@acme.example')
    expect(first).toContain('Has API users')
    expect(first).not.toContain('private')
    expect(second).toContain('(private)')
    expect(second).toContain('Has branches')
    expect(second).not.toContain('Has API users')
  })

  test('the contract column renders the derived contract text', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    expect(rowTexts(wrapper)[0]).toContain('Service contract 2026')
  })

  test('the screen renders no column filter row at all', async () => {
    // No column here takes a filter, so ServerDataTable drops the whole row
    // rather than rendering one that is empty but for a single select.
    const wrapper = await mountList(MemberList, SUPERUSER)

    expect(wrapper.find('tr.filter-row').exists()).toBe(false)
    expect(wrapper.find('select[aria-label="Filter member_type"]').exists()).toBe(false)
  })
})

describe('MemberList sorting', () => {
  test('clicking a header sorts ascending on the wire', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    await wrapper.get('th[aria-label="Sort by created"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ ordering: 'created' })
  })

  test('clicking the same header again flips to descending', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    await wrapper.get('th[aria-label="Sort by created"]').trigger('click')
    await settle()
    await wrapper.get('th[aria-label="Sort by created"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ ordering: '-created' })
  })
})

describe('MemberList pagination', () => {
  test('changing rows-per-page on page one refetches with the new page size', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    await wrapper.get('select[aria-label="Rows per page"]').setValue('10')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '1', page_size: '10' })
  })

  test('the next-page button asks for page two', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', page_size: '20' })
  })

  test('sorting after paging resets to page one', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    await wrapper.get('th[aria-label="Sort by created"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '1', ordering: 'created' })
  })

  test('disables the next-page button when everything fits on one page', async () => {
    api.get('/api/member/member/', memberPage(['Acme BV', 'Umbrella NV'], { count: 2 }))
    const wrapper = await mountList(MemberList, SUPERUSER)

    expect(wrapper.get('button[aria-label="Next page"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('.row-count').text()).toContain('2')
  })

  test('the control bar is centred, not stretched across the page', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    expect(wrapper.get('.server-table-pagination').classes()).toContain('d-inline-flex')
    expect(wrapper.get('.server-table-pagination').element.parentElement.classList).toContain('justify-content-center')
  })
})

describe('MemberList search', () => {
  test('the toolbar search commits the term to the wire', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    await wrapper.get('input[aria-label="Search name, companycode or city"]').setValue('demo')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ q: 'demo' })
  })

  test('a fresh search resets the page to one', async () => {
    const wrapper = await mountList(MemberList, SUPERUSER)

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    await wrapper.get('input[aria-label="Search name, companycode or city"]').setValue('demo')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ page: '1', q: 'demo' })
  })
})

describe('MemberList loading and empty states', () => {
  test('keeps the loading row up until the list arrives', async () => {
    let release
    api.get('/api/member/member/', () => new Promise((resolve) => { release = resolve }))

    const wrapper = await mountList(MemberList, SUPERUSER)

    expect(wrapper.find('.table-state-row .spinner-border').exists()).toBe(true)

    release(paginated([]))
    await settle()

    expect(wrapper.findAll('.table-state-row').length).toBe(1)
    expect(wrapper.findAll('tbody tr').length).toBe(1)
  })

  test('says so when the backend returned nothing', async () => {
    api.get('/api/member/member/', paginated([]))
    const wrapper = await mountList(MemberList, SUPERUSER)

    expect(wrapper.text()).toContain('No members found')
  })
})

describe('MemberList load errors', () => {
  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/member/member/', serverError)

    await mountList(MemberList, SUPERUSER)

    expect(toasts().map((toast) => toast.body)).toContain('Error loading members')
  })
})

describe('MemberList delete', () => {
  test('deletes through the confirmation modal and refetches', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = await mountList(MemberList, { ...SUPERUSER, queryClient })

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
    const wrapper = await mountList(MemberList, SUPERUSER)

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })
})
