import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { CustomerList } from '@/features/customer'
import { vPaginatedCustomerList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { customerRoutes } from '../../support/customer-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * CustomerList — the customers list, on the shared server-paged table kit.
 *
 * Everything this screen does is visible in exactly one place: the wire
 * query. The search term, the column filters and the page state are owned by
 * `useServerPagedList` and folded into one `useQuery` key, so every
 * behaviour claim here is asserted against what the client actually sent
 * (`api.requests()`), never against component internals.
 *
 * Column filters ride the wire under the shared bare-name grammar — the
 * param is the column's own id, no `__icontains` suffix; the backend's
 * filter kind decides the lookup. The number column takes an exact value or
 * a range spelled `18...80` (inclusive) / `18..80` (exclusive), mirrored
 * verbatim in the URL.
 *
 * With `urlSync` the URL bar is a second view of the wire query: a commit
 * writes the address (defaults omitted), a seeded address restores the view
 * before the first request, and a hashchange — the browser's back and
 * forward buttons — applies the address to the state.
 *
 * Sorting rides the wire as the engine's `ordering` list — the backend's
 * OrderingMixin (the viewset also carries the legacy `sort_field`/`sort_dir`
 * mixin; `ordering` wins if a request ever carried both). The rows-per-page
 * pin from the Member list applies here unchanged: the page size must reach the
 * wire from page one, where the state change alone would otherwise produce
 * an identical request and nothing would refetch.
 *
 * The search term and column filters commit on a 300 ms debounce;
 * `pastDebounce` waits it out.
 */

const api = installApiSeam()

const ITEM = itemSchemaOf(vPaginatedCustomerList)

/** Give the address bar a hash; the harness's memory router never touches it. */
function seedUrl(queryString) {
  window.history.replaceState(null, '', `/#/?${queryString}`)
}

function resetUrl() {
  window.history.replaceState(null, '', '/')
}

function customerRow(overrides = {}) {
  return fixtureFor(ITEM, {
    id: 5,
    name: 'Acme BV',
    customer_id: '5013',
    city: 'Rotterdam',
    num_orders: 7,
    remarks: 'Fast payer',
    maintenance_contract: '',
    standard_hours_txt: '0:00',
    ...overrides,
  })
}

function customerPage({ count = 45 } = {}) {
  return paginated(
    [
      customerRow({
        id: 5,
        name: 'Acme BV',
        contact: 'Jan de Vries',
        maintenance_contract: 'Goud',
        standard_hours_txt: '2:00',
      }),
      customerRow({
        id: 6,
        name: 'Acme Holding BV',
        num_orders: 0,
        remarks: null,
        branch_view: {
          id: 60,
          name: 'Acme Holding BV',
          city: 'Rotterdam',
          country_code: 'NL',
          postal: '3011AA',
          address: 'Coolsingel 1',
          contact: 'Jan de Vries',
          email: 'holding@acme.example',
          tel: '010 1234567',
          mobile: '06 12345678',
        },
      }),
    ],
    { count },
  )
}

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

async function mountTable() {
  const { mountListView } = await import('../../support/form-harness.js')
  const wrapper = await mountListView(CustomerList, {
    deep: true,
    routes: customerRoutes,
  })
  await settle()
  return wrapper
}

beforeEach(() => {
  resetUrl()
  api.get('/api/customer/customer/', customerPage())
  api.delete('/api/customer/customer/{id}/', noContent)
})

afterEach(() => {
  // A screen with urlSync writes the address bar; a stale hash would restore
  // itself into the next test's first request.
  resetUrl()
})

describe('CustomerList, wire contract', () => {
  test('the initial load sends the page and the page size, and nothing else', async () => {
    await mountTable()

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/customer/customer/',
      query: { page: '1', page_size: '20' },
    })
  })

  test('shows a row for every customer the backend returned', async () => {
    const wrapper = await mountTable()

    const rows = wrapper.findAll('tbody tr').filter((row) => row.text().includes('BV'))
    expect(rows.length).toBe(2)
    expect(rows[0].text()).toContain('Acme BV')
  })

  test('links each name to that customer\'s detail page', async () => {
    const wrapper = await mountTable()

    const hrefs = wrapper.findAll('tbody a').map((link) => link.attributes('href'))

    expect(hrefs).toContain('/customers/customers/5')
    expect(hrefs).toContain('/customers/customers/6')
  })

  test('renders the branch row as the composite listing item, marked as a branch', async () => {
    const wrapper = await mountTable()

    const rows = wrapper.findAll('tbody tr')
    const branchRow = rows[1]

    expect(branchRow.classes()).toContain('branch')
    expect(branchRow.text()).toContain('Acme Holding BV, Rotterdam, NL')
    expect(branchRow.text()).toContain('Branch')
    expect(branchRow.text()).toContain('Coolsingel 1')
    expect(branchRow.text()).toContain('NL-3011AA')
    expect(branchRow.text()).toContain('holding@acme.example')
  })

  test('renders the contract cell — a multi-part cell, so a single vnode, not a bare array', async () => {
    // flexRender wraps a returned object in `h(...)`: a bare array of vnodes
    // lands there as the component type — "missing template or render
    // function: []" — and the cell renders nothing. The cell returns one
    // wrapper vnode; this pin keeps it that way.
    const wrapper = await mountTable()

    const firstRow = wrapper.findAll('tbody tr')[0]

    expect(firstRow.text()).toContain('Goud')
    expect(firstRow.text()).toContain('Maintenance contract')
    expect(firstRow.text()).toContain('2:00')
    expect(firstRow.text()).toContain('Standard hours')
  })

  test('renders the contact column the legacy table had', async () => {
    const wrapper = await mountTable()

    const headers = wrapper.findAll('thead th').map((th) => th.text())
    expect(headers).toContain('Contact')

    const firstRow = wrapper.findAll('tbody tr')[0]
    expect(firstRow.text()).toContain('Jan de Vries')
  })
})

describe('CustomerList sorting', () => {
  test('a sort click sorts the wire with the ordering list', async () => {
    const wrapper = await mountTable()

    await wrapper.get('th[aria-label="Sort by name"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toEqual({
      page: '1',
      page_size: '20',
      ordering: 'name',
    })
  })

  test('clicking the same header again flips to descending on the wire', async () => {
    const wrapper = await mountTable()

    await wrapper.get('th[aria-label="Sort by name"]').trigger('click')
    await settle()
    await wrapper.get('th[aria-label="Sort by name"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ ordering: '-name' })
  })

  test('sorting after paging refetches page one with the sort', async () => {
    const wrapper = await mountTable()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    await wrapper.get('th[aria-label="Sort by name"]').trigger('click')
    await settle()

    // A sort changes the wire key, so this is a real request: page one,
    // sorted. The page reset is real state, not a cache hit.
    expect(api.requests().at(-1).query).toEqual({
      page: '1',
      page_size: '20',
      ordering: 'name',
    })
  })
})

describe('CustomerList column filters', () => {
  test('typing in the name filter narrows on the wire under its bare name', async () => {
    const wrapper = await mountTable()

    await wrapper.get('input[aria-label="Filter name"]').setValue('acme')
    await pastDebounce()

    // No `__icontains` suffix: the backend's filter kind decides the lookup.
    expect(api.requests().at(-1).query).toMatchObject({ name: 'acme' })
  })

  test('typing in the contact filter narrows on the wire under its bare name', async () => {
    const wrapper = await mountTable()

    await wrapper.get('input[aria-label="Filter contact"]').setValue('jan')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ contact: 'jan' })
  })

  test('an exact number narrows on the wire', async () => {
    const wrapper = await mountTable()

    await wrapper.get('input[aria-label="Filter num_orders"]').setValue('25')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ num_orders: '25' })
  })

  test('a range rides the wire in the shared grammar, and a new spelling replaces it', async () => {
    const wrapper = await mountTable()
    const filter = () => wrapper.get('input[aria-label="Filter num_orders"]')

    await filter().setValue('18...80')
    await pastDebounce()
    expect(api.requests().at(-1).query).toMatchObject({ num_orders: '18...80' })

    await filter().setValue('18..80')
    await pastDebounce()
    expect(api.requests().at(-1).query).toMatchObject({ num_orders: '18..80' })
  })

  test('a new filter resets the page to one', async () => {
    const wrapper = await mountTable()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    await wrapper.get('input[aria-label="Filter city"]').setValue('ams')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ page: '1', city: 'ams' })
  })
})

describe('CustomerList URL mirroring', () => {
  test('a bare view keeps a bare URL — defaults are omitted', async () => {
    await mountTable()

    expect(window.location.hash).not.toContain('page=')
    expect(window.location.hash).not.toContain('page_size=')
  })

  test('a committed filter writes the address bar', async () => {
    const wrapper = await mountTable()

    await wrapper.get('input[aria-label="Filter city"]').setValue('ams')
    await pastDebounce()

    expect(window.location.hash).toContain('city=ams')
  })

  test('clearing a filter removes the param from the address bar', async () => {
    const wrapper = await mountTable()
    const filter = () => wrapper.get('input[aria-label="Filter city"]')

    await filter().setValue('ams')
    await pastDebounce()
    expect(window.location.hash).toContain('city=ams')

    await filter().setValue('')
    await pastDebounce()
    expect(window.location.hash).not.toContain('city=')
  })

  test('a page change writes the address bar', async () => {
    const wrapper = await mountTable()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(window.location.hash).toContain('page=2')
  })

  test('a sort click writes the chosen sort into the address bar', async () => {
    const wrapper = await mountTable()

    await wrapper.get('th[aria-label="Sort by name"]').trigger('click')
    await settle()

    expect(window.location.hash).toContain('ordering=name')
  })

  test('sorting after filtering replaces the sort in the address bar, filter intact', async () => {
    // The reported sequence: filter num_orders, then sort that column. The
    // number column toggles descending first (TanStack's numeric default).
    const wrapper = await mountTable()
    const ordersSort = () => wrapper.get('th[aria-label="Sort by num_orders"]')

    await wrapper.get('input[aria-label="Filter num_orders"]').setValue('2..8')
    await pastDebounce()
    expect(window.location.hash).toContain('num_orders=2..8')
    expect(window.location.hash).not.toContain('ordering')

    await ordersSort().trigger('click')
    await settle()
    expect(window.location.hash).toContain('num_orders=2..8')
    expect(window.location.hash).toContain('ordering=-num_orders')

    await ordersSort().trigger('click')
    await settle()
    expect(window.location.hash).toContain('ordering=num_orders')
    expect(window.location.hash).not.toContain('-num_orders')
  })

  test('a shared URL restores the view before the first request', async () => {
    seedUrl('city=ams&num_orders=18...80&q=acme&page=2')

    const wrapper = await mountTable()

    expect(api.requests().at(-1).query).toEqual({
      page: '2',
      page_size: '20',
      q: 'acme',
      city: 'ams',
      num_orders: '18...80',
    })
    expect(wrapper.get('input[aria-label="Search customers"]').element.value).toBe('acme')
  })

  test('a hashchange — the browser going back — applies the address to the state', async () => {
    seedUrl('city=ams')
    await mountTable()
    expect(api.requests().at(-1).query).toMatchObject({ city: 'ams' })

    seedUrl('city=rot')
    window.dispatchEvent(new Event('hashchange'))
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ city: 'rot' })
  })
})

describe('CustomerList search', () => {
  test('the toolbar search commits the term to the wire', async () => {
    const wrapper = await mountTable()

    await wrapper.get('input[aria-label="Search customers"]').setValue('acme')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ q: 'acme' })
  })

  test('a fresh search resets the page to one', async () => {
    const wrapper = await mountTable()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    await wrapper.get('input[aria-label="Search customers"]').setValue('acme')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ page: '1', q: 'acme' })
  })
})

describe('CustomerList pagination', () => {
  test('changing rows-per-page on page one refetches with the new page size', async () => {
    const wrapper = await mountTable()

    await wrapper.get('select[aria-label="Rows per page"]').setValue('10')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '1', page_size: '10' })
  })

  test('the next-page button asks for page two', async () => {
    const wrapper = await mountTable()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', page_size: '20' })
  })

  test('disables the next-page button when everything fits on one page', async () => {
    api.get('/api/customer/customer/', customerPage({ count: 2 }))
    const wrapper = await mountTable()

    expect(wrapper.get('button[aria-label="Next page"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('.row-count').text()).toContain('2')
  })
})

describe('CustomerList loading, empty and error states', () => {
  test('keeps the loading row up until the list arrives', async () => {
    let release
    api.get('/api/customer/customer/', () => new Promise((resolve) => { release = resolve }))

    const wrapper = await mountTable()

    expect(wrapper.find('.table-state-row .spinner-border').exists()).toBe(true)

    release(paginated([]))
    await settle()

    expect(wrapper.text()).toContain('No customers found')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/customer/customer/', serverError)

    await mountTable()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading customers')
  })
})

describe('CustomerList delete', () => {
  test('deletes through the confirmation modal and refetches', async () => {
    const wrapper = await mountTable()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-customer-modal').ok()
    await settle()

    const deleteSent = api.requests().find((sent) => sent.method === 'delete')
    expect(deleteSent).toMatchObject({ path: '/api/customer/customer/5/' })
    expect(toasts().map((toast) => toast.body)).toContain('Customer has been deleted')
    // The invalidation reaches the list query through the shared client.
    const listFetches = api.requests().filter((sent) => sent.method === 'get')
    expect(listFetches.length).toBeGreaterThan(1)
  })

  test('does not delete anything until the confirmation is accepted', async () => {
    const wrapper = await mountTable()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })
})
