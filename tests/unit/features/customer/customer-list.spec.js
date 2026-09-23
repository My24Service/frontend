import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { CustomerList } from '@/features/customer'
import { vPaginatedCustomerList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { captureDownloads, xlsxResponse } from '../../support/downloads.js'
import { customerRoutes } from '../../support/customer-routes.js'
import { addFilter, chip, chipTexts, closeEditor, editorInput, pickMode } from '../../support/column-filters.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const ITEM = itemSchemaOf(vPaginatedCustomerList)

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
          mobile: '+31612345678',
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
    // The column filters open in a popover whose close rides the real
    // transition — see support/column-filters.js.
    stubs: { transition: false },
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

    expect(api.requests().at(-1).query).toEqual({
      page: '1',
      page_size: '20',
      ordering: 'name',
    })
  })
})

describe('CustomerList column filters', () => {
  test('the bar offers the five filterable columns, the nameless city column by its own label', async () => {
    const wrapper = await mountTable()

    expect(wrapper.find('tr.filter-row').exists()).toBe(false)
    await wrapper.get('.column-filter-menu .dropdown-toggle').trigger('click')
    expect(wrapper.findAll('.column-filter-menu .dropdown-item').map((item) => item.text()))
      .toEqual(['Company', 'City', 'Orders', 'Remarks', 'Contact'])
  })

  test('typing in the name filter narrows on the wire under its bare name', async () => {
    const wrapper = await mountTable()

    await addFilter(wrapper, 'Company')
    await editorInput(wrapper, 'name').setValue('acme')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ name: 'acme' })
    expect(chipTexts(wrapper)).toEqual(['Company: acme'])
  })

  test('typing in the contact filter narrows on the wire under its bare name', async () => {
    const wrapper = await mountTable()

    await addFilter(wrapper, 'Contact')
    await editorInput(wrapper, 'contact').setValue('jan')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ contact: 'jan' })
  })

  test('an exact number narrows on the wire', async () => {
    const wrapper = await mountTable()

    await addFilter(wrapper, 'Orders')
    await editorInput(wrapper, 'num_orders').setValue('25')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ num_orders: '25' })
  })

  test('a range rides the wire in the shared grammar, and the endpoint switch respells it', async () => {
    const wrapper = await mountTable()

    await addFilter(wrapper, 'Orders')
    await pickMode(wrapper, 'Between')
    await editorInput(wrapper, 'num_orders', 'from').setValue('18')
    await editorInput(wrapper, 'num_orders', 'to').setValue('80')
    await pastDebounce()
    expect(api.requests().at(-1).query).toMatchObject({ num_orders: '18...80' })

    await wrapper.get('.column-filter-popover .filter-number-exclusive input').setValue(true)
    await pastDebounce()
    expect(api.requests().at(-1).query).toMatchObject({ num_orders: '18..80' })
    expect(chipTexts(wrapper)).toEqual(['Orders: 18 – 80 (excl.)'])
  })

  test('a new filter resets the page to one', async () => {
    const wrapper = await mountTable()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    await addFilter(wrapper, 'City')
    await editorInput(wrapper, 'city').setValue('ams')
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

    await addFilter(wrapper, 'City')
    await editorInput(wrapper, 'city').setValue('ams')
    await pastDebounce()

    expect(window.location.hash).toContain('city=ams')
  })

  test('removing a chip removes the param from the address bar', async () => {
    const wrapper = await mountTable()

    await addFilter(wrapper, 'City')
    await editorInput(wrapper, 'city').setValue('ams')
    await pastDebounce()
    expect(window.location.hash).toContain('city=ams')

    await closeEditor(wrapper)
    await chip(wrapper, 'City').remove()
    await pastDebounce()
    expect(window.location.hash).not.toContain('city=')
    expect(chipTexts(wrapper)).toEqual([])
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
    const wrapper = await mountTable()
    const ordersSort = () => wrapper.get('th[aria-label="Sort by num_orders"]')

    await addFilter(wrapper, 'Orders')
    await pickMode(wrapper, 'Between')
    await editorInput(wrapper, 'num_orders', 'from').setValue('2')
    await editorInput(wrapper, 'num_orders', 'to').setValue('8')
    await wrapper.get('.column-filter-popover .filter-number-exclusive input').setValue(true)
    await closeEditor(wrapper)
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

  test('a restored URL never snaps the page back to one', async () => {
    seedUrl('city=ams&num_orders=18...80&q=acme&page=2')
    await mountTable()

    await pastDebounce()

    const pages = api.requests().filter((sent) => sent.method === 'get').map((sent) => sent.query.page)
    expect(pages).toEqual(['2'])
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

describe('CustomerList manual engine contract', () => {
  test('the pagination buttons are inert while their direction is impossible', async () => {
    // The kit runs manualPagination: the engine answers can-previous/can-next
    // from the server page count, not from cached rows. On page one of three
    // (45 rows at 20 per page) there is nowhere back to go.
    const wrapper = await mountTable()

    expect(wrapper.get('button[aria-label="Previous page"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[aria-label="First page"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[aria-label="Next page"]').attributes('disabled')).toBeUndefined()
  })

  test('a filter change refetches from page one rather than filtering cached rows', async () => {
    const wrapper = await mountTable()
    const loads = () => api.requests().filter((sent) => sent.method === 'get').length
    const before = loads()

    await wrapper.get('input[aria-label="Search customers"]').setValue('acme')
    await pastDebounce()

    expect(loads()).toBeGreaterThan(before)
    expect(api.requests().at(-1).query).toMatchObject({ page: '1', q: 'acme' })
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
    const listFetches = api.requests().filter((sent) => sent.method === 'get')
    expect(listFetches.length).toBeGreaterThan(1)
  })

  test('does not delete anything until the confirmation is accepted', async () => {
    const wrapper = await mountTable()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })

  test('closing the confirmation without accepting deletes nothing', async () => {
    // The pending guard is only half the contract: cancelling the modal must
    // also leave the record alone. The modal helper drives the real Cancel
    // button in the teleported b-modal, not the component's internals.
    const wrapper = await mountTable()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-customer-modal').cancel()
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
    expect(wrapper.text()).toContain('Acme BV')
  })

  test('a double confirmation while the delete is pending sends one request', async () => {
    // The isPending half of the doDelete guard: OK-ing twice before the
    // first DELETE answers must not fire a second request.
    const wrapper = await mountTable()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-customer-modal').ok()
    modal('delete-customer-modal').ok()
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toHaveLength(1)
  })

  test('a failed delete tells the user and keeps the list', async () => {
    api.delete('/api/customer/customer/{id}/', serverError)
    const wrapper = await mountTable()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-customer-modal').ok()
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Error deleting customer')
    expect(wrapper.text()).toContain('Acme BV')
  })
})

describe('CustomerList export', () => {
  /**
   * The export goes through the generated `customerExportRetrieve`, which the
   * schema now declares as a file with its `q` filter, so the strict seam
   * checks the request and the saved file is the spreadsheet it answered.
   */
  let saved

  beforeEach(() => {
    saved = captureDownloads()
    api.get('/api/customer/export/', xlsxResponse)
    // happy-dom has no `window.confirm` at all, so the stub replaces nothing.
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const exports = () => api.requests().filter((request) => request.path === '/api/customer/export/')

  test('exports with the search term and saves the spreadsheet', async () => {
    const wrapper = await mountTable()
    await wrapper.get('input[aria-label="Search customers"]').setValue('Acme & Co')
    await pastDebounce()

    await wrapper.get('button[title="Download"]').trigger('click')
    await settle()

    expect(exports().map((request) => request.query)).toEqual([{ q: 'Acme & Co' }])
    expect(saved).toEqual(['customers.xlsx'])
  })

  test('commits the search draft before exporting, so the term exported is the term on screen', async () => {
    const wrapper = await mountTable()
    await wrapper.get('input[aria-label="Search customers"]').setValue('Acme & Co')
    // Deliberately no debounce wait: the export reads the committed value, and
    // a term typed and exported at once must not export the previous one.
    await wrapper.get('button[title="Download"]').trigger('click')
    await settle()

    expect(exports().map((request) => request.query)).toEqual([{ q: 'Acme & Co' }])
  })

  test('a bare list exports the whole customer set', async () => {
    const wrapper = await mountTable()
    await wrapper.get('button[title="Download"]').trigger('click')
    await settle()

    expect(exports().map((request) => request.query)).toEqual([{}])
    expect(saved).toEqual(['customers.xlsx'])
  })

  test('a failed export says so and saves nothing', async () => {
    api.get('/api/customer/export/', serverError)
    const wrapper = await mountTable()
    await wrapper.get('button[title="Download"]').trigger('click')
    await settle()

    expect(saved).toEqual([])
    expect(toasts().map((toast) => toast.body)).toContain('Error downloading file')
  })
})

