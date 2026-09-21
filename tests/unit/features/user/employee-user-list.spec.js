import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { EmployeeUserList } from '@/features/user'
import { vPaginatedEmployeeUserList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { userRoutes } from '../../support/user-routes.js'

/**
 * Behaviour characterisation for the employee-user list screen
 * (src/views/company/UserEmployeeList.vue), written BEFORE the user-slice
 * refactor. Everything here pins current behaviour; the converted screen
 * must reproduce it except where the ticket ledger declares otherwise.
 *
 * Seams under test: the initial fetch, the rendered rows and links, the
 * search flow, the delete flow, the toasts, and the settings/company link
 * variants. The fake sits below the HTTP client, so these specs record the
 * request that would go on the wire.
 */

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

beforeEach(() => {
  resetUrl()
  api.get('/api/company/employeeuser/', employeePage())
  api.delete('/api/company/employeeuser/{id}/', noContent)
})

afterEach(() => {
  resetUrl()
})

const ITEM = itemSchemaOf(vPaginatedEmployeeUserList)

function employeeRow(overrides = {}) {
  return fixtureFor(ITEM, {
    id: 31,
    username: 'emp-jan',
    first_name: 'Jan',
    last_name: 'Employee',
    full_name: 'Jan Employee',
    email: 'emp-jan@example.test',
    ...overrides,
  })
}

function employeePage({ count = 30 } = {}) {
  return paginated(
    [
      employeeRow({ id: 31 }),
      employeeRow({ id: 32, username: 'emp-piet', first_name: 'Piet', last_name: 'Employee', full_name: 'Piet Employee', email: 'emp-piet@example.test' }),
    ],
    { count },
  )
}

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

/** Point the browser's address at a shared view of the list. */
function seedUrl(queryString) {
  window.history.replaceState(null, '', `/#/?${queryString}`)
}

/**
 * Hand the address back before the next test.
 *
 * urlSync writes the address, so without this a page change in one test is
 * restored by the next mount - on both sides of every test, not just after.
 */
function resetUrl() {
  window.history.replaceState(null, '', '/')
}

/** Mount the converted list, optionally down the settings tree. */
async function mountEmployeeList({ query = {}, auth = {}, props = {} } = {}) {
  const wrapper = await mountListView(EmployeeUserList, { deep: true, routes: userRoutes, query, auth, props })
  await settle()
  return wrapper
}

/** The text of every body row, one string per row. */
function rowTexts(wrapper) {
  return wrapper.findAll('tbody tr').map((row) => row.text())
}

describe('EmployeeUserList, wire contract', () => {
  test('the initial load sends the page and the page size, and nothing else', async () => {
    await mountEmployeeList()

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/company/employeeuser/',
      query: { page: '1', page_size: '20' },
    })
  })

  test('shows a row for every employee user the backend returned', async () => {
    const wrapper = await mountEmployeeList()

    expect(rowTexts(wrapper).length).toBe(2)
    expect(rowTexts(wrapper)[0]).toContain('Jan Employee')
  })

  test('links each name to that employee’s edit page', async () => {
    const wrapper = await mountEmployeeList()

    const hrefs = wrapper.findAll('tbody a').map((link) => link.attributes('href'))
    expect(hrefs).toContain('/company/employee-users/form/31')
    expect(hrefs).toContain('/company/employee-users/form/32')
  })

  test('from_settings links the names to the settings edit pages', async () => {
    const wrapper = await mountEmployeeList({ props: { fromSettings: true } })

    const hrefs = wrapper.findAll('tbody a').map((link) => link.attributes('href'))
    expect(hrefs).toContain('/settings/employee-users/form/31')
  })

  test('the add link follows from_settings too', async () => {
    const company = await mountEmployeeList()
    expect(company.find('a[href="/company/employee-users/form"]').exists()).toBe(true)

    const settings = await mountEmployeeList({ props: { fromSettings: true } })
    expect(settings.find('a[href="/settings/employee-users/form"]').exists()).toBe(true)
  })

  test('columns are not sortable — the endpoint declares no ordering parameter', async () => {
    // Same declared-contract finding as the sales list: only page/page_size/q
    // ride the wire, so the columns stay non-sortable.
    const wrapper = await mountEmployeeList()

    expect(wrapper.find('th[aria-label^="Sort by"]').exists()).toBe(false)
    expect(wrapper.find('.sortable-header').exists()).toBe(false)
  })
})

describe('EmployeeUserList search and pagination', () => {
  test('the toolbar search commits the term to the wire', async () => {
    const wrapper = await mountEmployeeList()

    await wrapper.get('input[aria-label="Search employees"]').setValue('jan')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ q: 'jan' })
  })

  test('the next-page button asks for page two', async () => {
    const wrapper = await mountEmployeeList()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', page_size: '20' })
  })
})

describe('EmployeeUserList URL mirroring', () => {
  test('a shared address restores the view, page included, before the first request', async () => {
    seedUrl('q=jan&page=2')

    const wrapper = await mountEmployeeList()

    expect(api.requests().at(-1).query).toEqual({
      page: '2',
      page_size: '20',
      q: 'jan',
    })
    expect(wrapper.get('input[aria-label="Search employees"]').element.value).toBe('jan')
  })

  test('the restored page survives the search debounce', async () => {
    // The debounced draft watcher resets the page whenever a term is
    // committed; a restore writes the draft and the committed value together,
    // so the page the address asked for has to outlast its own window.
    seedUrl('q=jan&page=2')
    await mountEmployeeList()

    await pastDebounce()

    const pages = api.requests().filter((sent) => sent.method === 'get').map((sent) => sent.query.page)
    expect(pages).toEqual(['2'])
  })

  test('the settings mount restores the same address shape', async () => {
    // The screen mounts twice; fromSettings is a prop, not a query parameter,
    // so both trees carry the same keys the kit owns.
    seedUrl('q=jan&page=2')

    await mountEmployeeList({ props: { fromSettings: true } })

    expect(api.requests().at(-1).query).toEqual({
      page: '2',
      page_size: '20',
      q: 'jan',
    })
  })

  test('a page change writes the address bar', async () => {
    const wrapper = await mountEmployeeList()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(window.location.hash).toContain('page=2')
  })
})

describe('EmployeeUserList loading, empty and error states', () => {
  test('says so when the backend returned nothing', async () => {
    api.get('/api/company/employeeuser/', paginated([]))
    const wrapper = await mountEmployeeList()

    expect(wrapper.text()).toContain('No employees found')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/company/employeeuser/', serverError)

    await mountEmployeeList()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading employees')
  })
})

describe('EmployeeUserList delete', () => {
  test('deletes through the confirmation modal and refetches', async () => {
    const wrapper = await mountEmployeeList()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-employee-user-modal').ok()
    await settle()

    const deleteSent = api.requests().find((sent) => sent.method === 'delete')
    expect(deleteSent).toMatchObject({ path: '/api/company/employeeuser/31/' })
    expect(toasts().map((toast) => toast.body)).toContain('Employee has been deleted')
    const listFetches = api.requests().filter((sent) => sent.method === 'get')
    expect(listFetches.length).toBeGreaterThan(1)
  })

  test('does not delete anything until the confirmation is accepted', async () => {
    const wrapper = await mountEmployeeList()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })
})
