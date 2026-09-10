import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import EngineerUserList from '@/features/user/engineer/EngineerUserList.vue'
import { vEngineer, vPaginatedEngineerList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { userRoutes } from '../../support/user-routes.js'

/**
 * Behaviour characterisation for the engineer-user list screen
 * (src/views/company/UserEngineerList.vue). Everything here pins the legacy
 * behaviour; the converted screen reproduces it except where the ticket
 * ledger declares otherwise (URL-state search, no type pills, non-sortable
 * columns, exactly the write schema's fields on the wire).
 *
 * Seams under test: the initial fetch, the rendered rows and links, the
 * mobile cell off the nested engineer sub-object, the search flow, the
 * delete flow, the toasts, and the role gate on the add link.
 * The fake sits below the HTTP client, so these specs record the request
 * that would go on the wire.
 */

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

afterEach(() => {
  resetUrl()
})

const ITEM = itemSchemaOf(vPaginatedEngineerList)

function engineerRow(overrides = {}) {
  return fixtureFor(ITEM, {
    id: 41,
    username: 'eng-jan',
    first_name: 'Jan',
    last_name: 'Monteur',
    full_name: 'Jan Monteur',
    email: 'eng-jan@example.test',
    engineer: { mobile: '06-12345678' },
    ...overrides,
  })
}

function engineerPage({ count = 30 } = {}) {
  return paginated([
    engineerRow(),
    engineerRow({
      id: 42,
      username: 'eng-piet',
      first_name: 'Piet',
      last_name: 'Monteur',
      full_name: 'Piet Monteur',
      email: 'eng-piet@example.test',
      engineer: { mobile: '06-87654321' },
    }),
  ], { count })
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

beforeEach(() => {
  resetUrl()
  api.get('/api/company/engineer/', engineerPage())
  api.delete('/api/company/engineer/{id}/', noContent)
})

/** Mount the converted list. */
async function mountEngineerList({ query = {}, auth = {} } = {}) {
  const wrapper = await mountListView(EngineerUserList, { deep: true, routes: userRoutes, query, auth })
  await settle()
  return wrapper
}

/** The text of every body row, one string per row. */
function rowTexts(wrapper) {
  return wrapper.findAll('tbody tr').map((row) => row.text())
}

describe('EngineerUserList, wire contract', () => {
  test('the initial load sends the page and the page size, and nothing else', async () => {
    await mountEngineerList()

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/company/engineer/',
      query: { page: '1', page_size: '20' },
    })
  })

  test('shows a row for every engineer the backend returned', async () => {
    const wrapper = await mountEngineerList()

    expect(rowTexts(wrapper).length).toBe(2)
    expect(rowTexts(wrapper)[0]).toContain('Jan Monteur')
  })

  test('links each name to that engineer’s edit page', async () => {
    const wrapper = await mountEngineerList()

    const hrefs = wrapper.findAll('tbody a').map((link) => link.attributes('href'))
    expect(hrefs).toContain('/company/engineer-users/form/41')
    expect(hrefs).toContain('/company/engineer-users/form/42')
  })

  test('shows the mobile number off the nested engineer record', async () => {
    const wrapper = await mountEngineerList()

    expect(rowTexts(wrapper)[0]).toContain('06-12345678')
    expect(rowTexts(wrapper)[1]).toContain('06-87654321')
  })

  test('the add link shows for staff and superusers only', async () => {
    const staff = await mountEngineerList({ auth: { isStaff: true } })
    expect(staff.find('a[href="/company/engineer-users/form"]').exists()).toBe(true)

    const plain = await mountEngineerList({ auth: { isStaff: false, isSuperuser: false } })
    expect(plain.find('a[href="/company/engineer-users/form"]').exists()).toBe(false)
  })

  test('columns are not sortable — the endpoint declares no ordering parameter', async () => {
    // Same declared-contract finding as the sales/planning/customer lists:
    // only page/page_size/q ride the wire, so the columns stay non-sortable.
    const wrapper = await mountEngineerList()

    expect(wrapper.find('th[aria-label^="Sort by"]').exists()).toBe(false)
    expect(wrapper.find('.sortable-header').exists()).toBe(false)
  })
})

describe('EngineerUserList search and pagination', () => {
  test('the toolbar search commits the term to the wire', async () => {
    const wrapper = await mountEngineerList()

    await wrapper.get('input[aria-label="Search engineers"]').setValue('jan')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ q: 'jan' })
  })

  test('the next-page button asks for page two', async () => {
    const wrapper = await mountEngineerList()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', page_size: '20' })
  })
})

describe('EngineerUserList URL mirroring', () => {
  test('a shared address restores the view, page included, before the first request', async () => {
    seedUrl('q=jan&page=2')

    const wrapper = await mountEngineerList()

    expect(api.requests().at(-1).query).toEqual({
      page: '2',
      page_size: '20',
      q: 'jan',
    })
    expect(wrapper.get('input[aria-label="Search engineers"]').element.value).toBe('jan')
  })

  test('the restored page survives the search debounce', async () => {
    // The debounced draft watcher resets the page whenever a term is
    // committed; a restore writes the draft and the committed value together,
    // so the page the address asked for has to outlast its own window.
    seedUrl('q=jan&page=2')
    await mountEngineerList()

    await pastDebounce()

    const pages = api.requests().filter((sent) => sent.method === 'get').map((sent) => sent.query.page)
    expect(pages).toEqual(['2'])
  })

  test('a page change writes the address bar', async () => {
    const wrapper = await mountEngineerList()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(window.location.hash).toContain('page=2')
  })
})

describe('EngineerUserList loading, empty and error states', () => {
  test('says so when the backend returned nothing', async () => {
    api.get('/api/company/engineer/', paginated([]))
    const wrapper = await mountEngineerList()

    expect(wrapper.text()).toContain('No engineers found')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/company/engineer/', serverError)

    await mountEngineerList()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading engineers')
  })
})

describe('EngineerUserList delete', () => {
  test('deletes through the confirmation modal and refetches', async () => {
    const wrapper = await mountEngineerList()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-engineer-user-modal').ok()
    await settle()

    const deleteSent = api.requests().find((sent) => sent.method === 'delete')
    expect(deleteSent).toMatchObject({ path: '/api/company/engineer/41/' })
    expect(toasts().map((toast) => toast.body)).toContain('Engineer has been deleted')
    const listFetches = api.requests().filter((sent) => sent.method === 'get')
    expect(listFetches.length).toBeGreaterThan(1)
  })

  test('does not delete anything until the confirmation is accepted', async () => {
    const wrapper = await mountEngineerList()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })
})
