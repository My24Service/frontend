import { beforeEach, describe, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'

// CustomerList, rewritten into the feature folder. These specs began as the
// characterisation of the legacy screen and now hold the rewrite to the same
// requests, row for row — with the declared exceptions called out inline and
// collected in the Slice README.
import { CustomerList } from '@/features/customer'
import { vPaginatedCustomerList } from '@/api/valibot.gen'

import { goldenTest, goldensFor } from '../../helpers/golden.js'
import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { toasts } from '../../support/form-harness.js'
import { openDelete, openSearch, rowTexts, serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { customerRoutes } from '../../support/customer-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * The customer list, characterised on the legacy component.
 *
 * What the screen does today:
 *
 *   - page, search term and (only when the URL carries them) sort_field/
 *     sort_dir live in the URL; the backend applies the sort —
 *     `SortingMixin.handle_sorting` (source/apps/core/views.py:677) — but the
 *     OpenAPI schema does not declare the two sort parameters, which is why
 *     every converted request below can be checked by the seam except the
 *     sorted mount: that one is pinned from the recorded requests, not
 *     against the schema.
 *   - the delete flow asks, deletes, and reloads the page you were on.
 *   - the download button exports the whole list as an Excel file, honouring
 *     the search term.
 */

const api = installApiSeam()
const goldens = goldensFor('customer-list')

const ITEM = itemSchemaOf(vPaginatedCustomerList)

function customerRow(overrides = {}) {
  return fixtureFor(ITEM, { id: 5, name: 'Acme BV', ...overrides })
}

/** A customer list page: one plain customer and one branch row. */
function customerPage() {
  return paginated([
    customerRow({ id: 5, name: 'Acme BV' }),
    customerRow({
      id: 6,
      name: 'Acme Holding BV',
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
  ], { count: 45 })
}

/** window.confirm, for the export prompt. Happy-dom has no implementation. */
function stubConfirm(answer) {
  vi.stubGlobal('confirm', vi.fn(() => answer))
}

/** Stub the blob download machinery the export flows through. */
function stubBlobDownload() {
  window.URL.createObjectURL = vi.fn(() => 'blob:fake')
  window.URL.revokeObjectURL = vi.fn()
}

beforeEach(() => {
  api.get('/api/customer/customer/', customerPage())
  api.delete('/api/customer/customer/{id}/', noContent)
})

async function mountList(query = {}) {
  const { mountListView } = await import('../../support/form-harness.js')
  const wrapper = await mountListView(CustomerList, {
    deep: true,
    routes: customerRoutes,
    query,
  })
  await settle()
  return wrapper
}

describe('CustomerList, loading', () => {
  // Recording hooks: a scenario the directory has no HAR for skips, naming
  // itself (see tests/unit/golden/README.md). The live assertions beside
  // each hook hold the converted screen to the requests characterised from
  // the legacy one.
  goldenTest(goldens, 'initial load', 'customer-list', async () => {
    await mountList()
    return api.requests()
  })

  goldenTest(goldens, 'page 2 and search term', 'customer-list', async () => {
    await mountList({ page: '2', q: 'acme' })
    return api.requests()
  })

  test('asks for page one with no other parameters', async () => {
    await mountList()

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/customer/customer/', query: { page: '1' }, body: undefined },
    ])
  })

  test('carries the URL page and search term to the backend', async () => {
    await mountList({ page: '2', q: 'acme' })

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/customer/customer/', query: { page: '2', q: 'acme' }, body: undefined },
    ])
  })

  test('the URL sort stays in the URL, and cannot ride the wire yet', async () => {
    // Declared exception (see the Slice README): sort_field/sort_dir are not
    // declared in the OpenAPI schema — the backend honours them
    // (source/apps/core/views.py:677, SortingMixin), but a schema that does
    // not say so cannot type them, and the generated client cannot send them.
    // The URL keeps carrying them, so the request is correct the moment the
    // schema gains the two parameters.
    await mountList({ sort_field: 'name', sort_dir: 'desc' })

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/customer/customer/', query: { page: '1' } },
    ])
  })

  test('a sort click puts the column and direction in the URL', async () => {
    const wrapper = await mountList()

    // The sortable header is the click target itself (b-table-sortable-column).
    // The columns start name-ascending (the screen's `sortBy` default), so the
    // first click on the sorted column asks for descending.
    await wrapper.get('#customer-table thead th').trigger('click')
    await settle()

    expect(wrapper.vm.$route.query).toMatchObject({ sort_field: 'name', sort_dir: 'desc' })
    // No request rode out for the click itself: with the sort parameters
    // unable to ride the wire (above), the list's query key cannot change on
    // a sort, and the rows it holds are the ones the backend sent.
    expect(api.requests()).toHaveLength(1)
  })

  test('shows a row for every customer the backend returned', async () => {
    const wrapper = await mountList()

    expect(rowTexts(wrapper)).toHaveLength(2)
    expect(rowTexts(wrapper)[0]).toContain('Acme BV')
  })

  test('renders branch rows from the branch view, marked as branches', async () => {
    const wrapper = await mountList()

    const branchRow = rowTexts(wrapper)[1]
    expect(branchRow).toContain('Acme Holding BV, Rotterdam, NL')
    expect(branchRow).toContain('Branch')
    expect(wrapper.findAll('tbody tr')[1].classes()).toContain('branch')
  })

  test('links rows to the customer detail page', async () => {
    const wrapper = await mountList()

    const hrefs = wrapper.findAll('tbody a').map((link) => link.attributes('href'))
    expect(hrefs).toContain('/customers/customers/5')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/customer/customer/', serverError)

    await mountList()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading customers')
  })
})

describe('CustomerList, search', () => {
  test('the modal puts the term in the URL, where a reload refetches with it', async () => {
    const wrapper = await mountList()

    await openSearch(wrapper)
    modal('search-modal').type('acme')
    modal('search-modal').ok()
    await settle()

    expect(wrapper.vm.$route.query).toMatchObject({ q: 'acme' })
  })
})

describe('CustomerList, delete', () => {
  test('asks, deletes, and reloads the page you were on', async () => {
    const wrapper = await mountList({ page: '2', q: 'acme' })

    await openDelete(wrapper)
    expect(modal('delete-customer-modal').isOpen()).toBe(true)

    modal('delete-customer-modal').ok()
    await settle()

    expect(api.requests().slice(1)).toEqual([
      { method: 'delete', path: '/api/customer/customer/5/', query: {} },
      { method: 'get', path: '/api/customer/customer/', query: { page: '2', q: 'acme' }, body: undefined },
    ])
    expect(toasts().map((toast) => toast.title)).toContain('Deleted')
  })

  test('says so when the delete fails, and keeps the row', async () => {
    api.delete('/api/customer/customer/{id}/', serverError)

    const wrapper = await mountList()

    await openDelete(wrapper)
    modal('delete-customer-modal').ok()
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Error deleting customer')
    expect(rowTexts(wrapper)).toHaveLength(2)
  })
})

describe('CustomerList, export', () => {
  test('downloads the Excel export, honouring the search term, after asking', async () => {
    stubConfirm(true)
    stubBlobDownload()
    api.get('/api/customer/export/', new HttpResponse(new ArrayBuffer(4), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    }))

    const wrapper = await mountList({ q: 'acme' })
    await wrapper.get('button[title="Download"]').trigger('click')
    await settle()

    expect(confirm).toHaveBeenCalledWith('Are you sure you want to export all customers?')
    expect(api.requests().slice(1)).toEqual([
      { method: 'get', path: '/api/customer/export/', query: { q: 'acme' } },
    ])
    // `q` is not declared in the OpenAPI schema — the export view documents no
    // parameters — but the backend reads it
    // (source/apps/customer/views.py:46-51, ExportXlsCustomersView.get_queryset).
    // Same schema gap as the list's sort parameters; the only tolerated
    // reports are exactly this one.
    const drained = api.takeViolations()
    expect(drained.filter((violation) => !violation.includes("the query parameter 'q'")))
      .toEqual([])
    expect(drained).toHaveLength(1)
  })

  test('exports nothing when the user declines', async () => {
    stubConfirm(false)

    const wrapper = await mountList()
    await wrapper.get('button[title="Download"]').trigger('click')
    await settle()

    expect(api.requests()).toHaveLength(1)
  })
})
