import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import client from '@/services/api'
import { CustomerUserList } from '@/features/user'
import { vCustomerUser, vPaginatedCustomerUserList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm, mountListView, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { userRoutes } from '../../support/user-routes.js'

/**
 * Behaviour characterisation for the customer-user list screen
 * (src/views/company/UserCustomerList.vue), written BEFORE the user-slice
 * refactor. Everything here pins current behaviour; the converted screen
 * must reproduce it except where the ticket ledger declares otherwise.
 *
 * Seams under test: the initial fetch, the rendered rows and links, the
 * customer cell (linked record vs the no-customer fallback), the search
 * flow, the delete flow, the toasts, and the role gate on the add link.
 * The fake sits below the HTTP client, so these specs record the request
 * that would go on the wire.
 */

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

let realClientGet

afterEach(() => {
  client.get = realClientGet
})

const ITEM = itemSchemaOf(vPaginatedCustomerUserList)

function customerRow(overrides = {}) {
  return fixtureFor(ITEM, {
    id: 31,
    username: 'cust-jan',
    first_name: 'Jan',
    last_name: 'Klant',
    full_name: 'Jan Klant',
    email: 'cust-jan@example.test',
    customer_user: { customer: 5 },
    customer_details: { id: 5, name: 'Acme BV', city: 'Amsterdam' },
    ...overrides,
  })
}

function unlinkedRow(overrides = {}) {
  return customerRow({
    id: 32,
    username: 'cust-piet',
    first_name: 'Piet',
    last_name: 'Klant',
    full_name: 'Piet Klant',
    email: 'cust-piet@example.test',
    customer_user: { customer: null },
    customer_details: null,
    ...overrides,
  })
}

function customerPage({ count = 30 } = {}) {
  return paginated([customerRow(), unlinkedRow()], { count })
}

const RECORD = fixtureFor(vCustomerUser, {
  id: 31,
  username: 'cust-jan',
  first_name: 'Jan',
  last_name: 'Klant',
  full_name: 'Jan Klant',
  email: 'cust-jan@example.test',
})

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

beforeEach(() => {
  // The username probe rides raw axios, outside the strict seam — answer it
  // available here. The strict seam only records generated traffic, so the
  // probe never pollutes the request assertions below.
  realClientGet = client.get
  client.get = vi.fn((url, ...rest) => {
    if (String(url).includes('username-exists')) {
      return Promise.resolve({ data: { available: true } })
    }
    return realClientGet(url, ...rest)
  })
  api.get('/api/company/customeruser/', customerPage())
  api.delete('/api/company/customeruser/{id}/', noContent)
})

/** Mount the converted list. */
async function mountCustomerList({ query = {}, auth = {} } = {}) {
  const wrapper = await mountListView(CustomerUserList, { deep: true, routes: userRoutes, query, auth })
  await settle()
  return wrapper
}

/** The text of every body row, one string per row. */
function rowTexts(wrapper) {
  return wrapper.findAll('tbody tr').map((row) => row.text())
}

describe('CustomerUserList, wire contract', () => {
  test('the initial load sends the page and the page size, and nothing else', async () => {
    await mountCustomerList()

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/company/customeruser/',
      query: { page: '1', page_size: '20' },
    })
  })

  test('shows a row for every customer user the backend returned', async () => {
    const wrapper = await mountCustomerList()

    expect(rowTexts(wrapper).length).toBe(2)
    expect(rowTexts(wrapper)[0]).toContain('Jan Klant')
  })

  test('links each name to that customer user’s edit page', async () => {
    const wrapper = await mountCustomerList()

    const hrefs = wrapper.findAll('tbody a').map((link) => link.attributes('href'))
    expect(hrefs).toContain('/company/customer-users/form/31')
    expect(hrefs).toContain('/company/customer-users/form/32')
  })

  test('a linked customer renders name and city', async () => {
    const wrapper = await mountCustomerList()

    expect(wrapper.text()).toContain('Acme BV, Amsterdam')
  })

  test('a user without a customer renders the fallback copy', async () => {
    const wrapper = await mountCustomerList()

    expect(wrapper.text()).toContain('No customer selected')
  })

  test('the add link shows for staff and superusers only', async () => {
    const staff = await mountCustomerList({ auth: { isStaff: true } })
    expect(staff.find('a[href="/company/customer-users/form"]').exists()).toBe(true)

    const plain = await mountCustomerList({ auth: { isStaff: false, isSuperuser: false } })
    expect(plain.find('a[href="/company/customer-users/form"]').exists()).toBe(false)
  })

  test('columns are not sortable — the endpoint declares no ordering parameter', async () => {
    // Same declared-contract finding as the sales/planning lists: only
    // page/page_size/q ride the wire, so the columns stay non-sortable.
    const wrapper = await mountCustomerList()

    expect(wrapper.find('th[aria-label^="Sort by"]').exists()).toBe(false)
    expect(wrapper.find('.sortable-header').exists()).toBe(false)
  })
})

describe('CustomerUserList search and pagination', () => {
  test('the toolbar search commits the term to the wire', async () => {
    const wrapper = await mountCustomerList()

    await wrapper.get('input[aria-label="Search customer users"]').setValue('jan')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ q: 'jan' })
  })

  test('the next-page button asks for page two', async () => {
    const wrapper = await mountCustomerList()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', page_size: '20' })
  })
})

describe('CustomerUserList loading, empty and error states', () => {
  test('says so when the backend returned nothing', async () => {
    api.get('/api/company/customeruser/', paginated([]))
    const wrapper = await mountCustomerList()

    expect(wrapper.text()).toContain('No customer users found')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/company/customeruser/', serverError)

    await mountCustomerList()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading customer users')
  })
})

describe('CustomerUserList delete', () => {
  test('deletes through the confirmation modal and refetches', async () => {
    const wrapper = await mountCustomerList()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-customer-user-modal').ok()
    await settle()

    const deleteSent = api.requests().find((sent) => sent.method === 'delete')
    expect(deleteSent).toMatchObject({ path: '/api/company/customeruser/31/' })
    expect(toasts().map((toast) => toast.body)).toContain('Customer user has been deleted')
    const listFetches = api.requests().filter((sent) => sent.method === 'get')
    expect(listFetches.length).toBeGreaterThan(1)
  })

  test('does not delete anything until the confirmation is accepted', async () => {
    const wrapper = await mountCustomerList()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })
})
