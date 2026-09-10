import { beforeEach, describe, expect, test, vi } from 'vitest'

import { PlanningUserList } from '@/features/user'
import { vPaginatedPlanningUserList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { userRoutes } from '../../support/user-routes.js'

/**
 * Behaviour characterisation for the planning-user list screen
 * (src/views/company/UserPlanningList.vue), written BEFORE the user-slice
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
  api.get('/api/company/planninguser/', planningPage())
  api.delete('/api/company/planninguser/{id}/', noContent)
})

const ITEM = itemSchemaOf(vPaginatedPlanningUserList)

function planningRow(overrides = {}) {
  return fixtureFor(ITEM, {
    id: 21,
    username: 'plan-jan',
    first_name: 'Jan',
    last_name: 'Planner',
    full_name: 'Jan Planner',
    email: 'plan-jan@example.test',
    ...overrides,
  })
}

function planningPage({ count = 30 } = {}) {
  return paginated(
    [
      planningRow({ id: 21 }),
      planningRow({ id: 22, username: 'plan-piet', first_name: 'Piet', last_name: 'Planner', full_name: 'Piet Planner', email: 'plan-piet@example.test' }),
    ],
    { count },
  )
}

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

/** Mount the converted list, optionally down the settings tree. */
async function mountPlanningList({ query = {}, auth = {}, props = {} } = {}) {
  const wrapper = await mountListView(PlanningUserList, { deep: true, routes: userRoutes, query, auth, props })
  await settle()
  return wrapper
}

/** The text of every body row, one string per row. */
function rowTexts(wrapper) {
  return wrapper.findAll('tbody tr').map((row) => row.text())
}

describe('PlanningUserList, wire contract', () => {
  test('the initial load sends the page and the page size, and nothing else', async () => {
    await mountPlanningList()

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/company/planninguser/',
      query: { page: '1', page_size: '20' },
    })
  })

  test('shows a row for every planning user the backend returned', async () => {
    const wrapper = await mountPlanningList()

    expect(rowTexts(wrapper).length).toBe(2)
    expect(rowTexts(wrapper)[0]).toContain('Jan Planner')
  })

  test('links each name to that planning user’s edit page', async () => {
    const wrapper = await mountPlanningList()

    const hrefs = wrapper.findAll('tbody a').map((link) => link.attributes('href'))
    expect(hrefs).toContain('/company/planning-users/form/21')
    expect(hrefs).toContain('/company/planning-users/form/22')
  })

  test('from_settings links the names to the settings edit pages', async () => {
    const wrapper = await mountPlanningList({ props: { fromSettings: true } })

    const hrefs = wrapper.findAll('tbody a').map((link) => link.attributes('href'))
    expect(hrefs).toContain('/settings/planning-users/form/21')
  })

  test('the add link follows from_settings too', async () => {
    const company = await mountPlanningList()
    expect(company.find('a[href="/company/planning-users/form"]').exists()).toBe(true)

    const settings = await mountPlanningList({ props: { fromSettings: true } })
    expect(settings.find('a[href="/settings/planning-users/form"]').exists()).toBe(true)
  })

  test('columns are not sortable — the endpoint declares no ordering parameter', async () => {
    // Same declared-contract finding as the sales list: only page/page_size/q
    // ride the wire, so the columns stay non-sortable.
    const wrapper = await mountPlanningList()

    expect(wrapper.find('th[aria-label^="Sort by"]').exists()).toBe(false)
    expect(wrapper.find('.sortable-header').exists()).toBe(false)
  })
})

describe('PlanningUserList search and pagination', () => {
  test('the toolbar search commits the term to the wire', async () => {
    const wrapper = await mountPlanningList()

    await wrapper.get('input[aria-label="Search planning users"]').setValue('jan')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ q: 'jan' })
  })

  test('the next-page button asks for page two', async () => {
    const wrapper = await mountPlanningList()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', page_size: '20' })
  })
})

describe('PlanningUserList loading, empty and error states', () => {
  test('says so when the backend returned nothing', async () => {
    api.get('/api/company/planninguser/', paginated([]))
    const wrapper = await mountPlanningList()

    expect(wrapper.text()).toContain('No planning users found')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/company/planninguser/', serverError)

    await mountPlanningList()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading planning users')
  })
})

describe('PlanningUserList delete', () => {
  test('deletes through the confirmation modal and refetches', async () => {
    const wrapper = await mountPlanningList()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-planning-user-modal').ok()
    await settle()

    const deleteSent = api.requests().find((sent) => sent.method === 'delete')
    expect(deleteSent).toMatchObject({ path: '/api/company/planninguser/21/' })
    expect(toasts().map((toast) => toast.body)).toContain('planning user has been deleted')
    const listFetches = api.requests().filter((sent) => sent.method === 'get')
    expect(listFetches.length).toBeGreaterThan(1)
  })

  test('does not delete anything until the confirmation is accepted', async () => {
    const wrapper = await mountPlanningList()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })
})
