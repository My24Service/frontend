import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { vActivity } from '@/api/valibot.gen'
import { ActivityList } from '@/features/company'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({ create: toastCreate }),
}))

const api = installApiSeam()
const endpoint = '/api/company/activity/'

function activity(overrides = {}) {
  return fixtureFor(vActivity, {
    id: 3,
    text: 'Order created by planner',
    created: '01-01-2026',
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)
const listRequests = () => api.requests().filter((request) => request.method === 'get' && request.path === endpoint)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => paginated([activity()], { count: 45 }))
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountActivity(options = {}) {
  return mountListView(ActivityList, {
    deep: true,
    ...options,
  })
}

describe('ActivityList', () => {
  test('loads page one and renders every column', async () => {
    const wrapper = await mountActivity()
    await settle()

    expect(listRequests()[0]).toMatchObject({ path: endpoint, query: { page: '1', page_size: '20' } })
    const body = wrapper.get('tbody').text()
    expect(body).toContain('Order created by planner')
    expect(body).toContain('01-01-2026')
    expect(wrapper.get('h3').text()).toContain('Activity')
  })

  test('a search term is debounced onto the wire', async () => {
    const wrapper = await mountActivity()
    await settle()

    await wrapper.get('input[aria-label="Search activity"]').setValue('planner')
    await new Promise((resolve) => setTimeout(resolve, 350))
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({ q: 'planner', page: '1' })
  })

  test('a sort click sorts the wire through the ordering allow-list', async () => {
    const wrapper = await mountActivity()
    await settle()

    await wrapper.get('th[aria-label="Sort by text"]').trigger('click')
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({ ordering: 'text' })
  })

  test('an empty list has an explicit empty state', async () => {
    api.get(endpoint, paginated([]))
    const wrapper = await mountActivity()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('No activity found')
  })

  test('a load failure tells the user', async () => {
    api.get(endpoint, serverError)
    await mountActivity()
    await settle()

    expect(bodies()).toContain('Error loading activity')
  })
})
