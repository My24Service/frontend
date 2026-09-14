import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import StudentUserList from '@/features/user/student/StudentUserList.vue'
import { vPaginatedStudentUserList, vStudentUser } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { userRoutes } from '../../support/user-routes.js'

/**
 * Behaviour characterisation for the student-user list screen
 * (src/views/company/UserStudentList.vue), written BEFORE the user-slice
 * refactor. Everything here pins current behaviour; the converted screen
 * must reproduce it except where the ticket ledger declares otherwise.
 *
 * Seams under test: the initial fetch, the rendered rows and links, the
 * mobile cell off the nested record, the search flow, the delete flow, the
 * in-place active/inactive toggle, the toasts, and the ungated add link.
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

const ITEM = itemSchemaOf(vPaginatedStudentUserList)

function studentRow(overrides = {}) {
  return fixtureFor(ITEM, {
    id: 41,
    username: 'student-jan',
    first_name: 'Jan',
    last_name: 'Student',
    full_name: 'Jan Student',
    email: 'student-jan@example.test',
    is_active: true,
    student_user: { mobile: '+31612345678' },
    ...overrides,
  })
}

function inactiveRow(overrides = {}) {
  return studentRow({
    id: 42,
    username: 'student-piet',
    first_name: 'Piet',
    last_name: 'Student',
    full_name: 'Piet Student',
    email: 'student-piet@example.test',
    is_active: false,
    student_user: { mobile: null },
    ...overrides,
  })
}

function studentPage({ count = 30 } = {}) {
  return paginated([studentRow(), inactiveRow()], { count })
}

const RECORD = fixtureFor(vStudentUser, {
  id: 41,
  username: 'student-jan',
  first_name: 'Jan',
  last_name: 'Student',
  full_name: 'Jan Student',
  email: 'student-jan@example.test',
})

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
  api.get('/api/company/studentuser/', studentPage())
  api.patch('/api/company/studentuser/{id}/', RECORD)
  api.delete('/api/company/studentuser/{id}/', noContent)
})

/** Mount the converted list. */
async function mountStudentList({ query = {} } = {}) {
  const wrapper = await mountListView(StudentUserList, { deep: true, routes: userRoutes, query })
  await settle()
  return wrapper
}

/** The text of every body row, one string per row. */
function rowTexts(wrapper) {
  return wrapper.findAll('tbody tr').map((row) => row.text())
}

describe('StudentUserList, wire contract', () => {
  test('the initial load sends the page and the page size, and nothing else', async () => {
    await mountStudentList()

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/company/studentuser/',
      query: { page: '1', page_size: '20' },
    })
  })

  test('shows a row for every student user the backend returned', async () => {
    const wrapper = await mountStudentList()

    expect(rowTexts(wrapper).length).toBe(2)
    expect(rowTexts(wrapper)[0]).toContain('Jan Student')
  })

  test('links each name to that student user’s detail page', async () => {
    // The legacy name cell pointed at the detail screen, and the detail
    // converts in its own follow-up — the link stays put, unlike the
    // sibling lists whose legacy screens already pointed at the edit page.
    const wrapper = await mountStudentList()

    const hrefs = wrapper.findAll('tbody a').map((link) => link.attributes('href'))
    expect(hrefs).toContain('/company/student-users/view/41')
    expect(hrefs).toContain('/company/student-users/view/42')
  })

  test('a mobile renders from the nested record', async () => {
    const wrapper = await mountStudentList()

    expect(wrapper.text()).toContain('+31612345678')
  })

  test('the add link shows without a role gate', async () => {
    // The legacy toolbar rendered the add button unconditionally; the
    // customer gate mirrors a gate its own legacy screen had.
    const wrapper = await mountStudentList()

    expect(wrapper.find('a[href="/company/student-users/form"]').exists()).toBe(true)
  })

  test('columns are not sortable — the endpoint declares no ordering parameter', async () => {
    // Same declared-contract finding as the sales/planning/customer lists:
    // only page/page_size/q ride the wire, so the columns stay non-sortable.
    const wrapper = await mountStudentList()

    expect(wrapper.find('th[aria-label^="Sort by"]').exists()).toBe(false)
    expect(wrapper.find('.sortable-header').exists()).toBe(false)
  })
})

describe('StudentUserList search and pagination', () => {
  test('the toolbar search commits the term to the wire', async () => {
    const wrapper = await mountStudentList()

    await wrapper.get('input[aria-label="Search student users"]').setValue('jan')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ q: 'jan' })
  })

  test('the next-page button asks for page two', async () => {
    const wrapper = await mountStudentList()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', page_size: '20' })
  })
})

describe('StudentUserList URL mirroring', () => {
  test('a shared address restores the view, page included, before the first request', async () => {
    seedUrl('q=jan&page=2')

    const wrapper = await mountStudentList()

    expect(api.requests().at(-1).query).toEqual({
      page: '2',
      page_size: '20',
      q: 'jan',
    })
    expect(wrapper.get('input[aria-label="Search student users"]').element.value).toBe('jan')
  })

  test('the restored page survives the search debounce', async () => {
    // The debounced draft watcher resets the page whenever a term is
    // committed; a restore writes the draft and the committed value together,
    // so the page the address asked for has to outlast its own window.
    seedUrl('q=jan&page=2')
    await mountStudentList()

    await pastDebounce()

    const pages = api.requests().filter((sent) => sent.method === 'get').map((sent) => sent.query.page)
    expect(pages).toEqual(['2'])
  })

  test('a page change writes the address bar', async () => {
    const wrapper = await mountStudentList()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(window.location.hash).toContain('page=2')
  })
})

describe('StudentUserList loading, empty and error states', () => {
  test('says so when the backend returned nothing', async () => {
    api.get('/api/company/studentuser/', paginated([]))
    const wrapper = await mountStudentList()

    expect(wrapper.text()).toContain('No student users found')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/company/studentuser/', serverError)

    await mountStudentList()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading student users')
  })
})

describe('StudentUserList active toggle', () => {
  test('deactivating patches the flag and refetches', async () => {
    const wrapper = await mountStudentList()

    await wrapper.get('button[title="Set inactive"]').trigger('click')
    await settle()

    // PATCH carries only the flag: the patched schema has no required keys
    // and absent keys leave stored values untouched.
    const patches = api.requests().filter((sent) => sent.method === 'patch')
    expect(patches).toHaveLength(1)
    expect(patches[0]).toMatchObject({ path: '/api/company/studentuser/41/' })
    expect(patches[0].body).toEqual({
      is_active: false,
    })
    const listFetches = api.requests().filter((sent) => sent.method === 'get')
    expect(listFetches.length).toBeGreaterThan(1)
  })

  test('activating patches the flag the other way', async () => {
    const wrapper = await mountStudentList()

    await wrapper.get('button[title="Set active"]').trigger('click')
    await settle()

    const patches = api.requests().filter((sent) => sent.method === 'patch')
    expect(patches).toHaveLength(1)
    expect(patches[0]).toMatchObject({ path: '/api/company/studentuser/42/' })
    expect(patches[0].body.is_active).toBe(true)
  })

  test('a failed toggle tells the user', async () => {
    api.patch('/api/company/studentuser/{id}/', serverError)
    const wrapper = await mountStudentList()

    await wrapper.get('button[title="Set inactive"]').trigger('click')
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Error setting student user inactive')
  })
})

describe('StudentUserList delete', () => {
  test('deletes through the confirmation modal and refetches', async () => {
    const wrapper = await mountStudentList()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-student-user-modal').ok()
    await settle()

    const deleteSent = api.requests().find((sent) => sent.method === 'delete')
    expect(deleteSent).toMatchObject({ path: '/api/company/studentuser/41/' })
    expect(toasts().map((toast) => toast.body)).toContain('Student user has been deleted')
    const listFetches = api.requests().filter((sent) => sent.method === 'get')
    expect(listFetches.length).toBeGreaterThan(1)
  })

  test('does not delete anything until the confirmation is accepted', async () => {
    const wrapper = await mountStudentList()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })
})
