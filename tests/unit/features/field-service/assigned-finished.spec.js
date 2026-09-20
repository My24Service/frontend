import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import AssignedFinished from '@/views/mobile/AssignedFinished.vue'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { vAssignedOrderView, vEngineerMinimal } from '@/api/valibot.gen'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts, toastCreate } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({create: toastCreate}),
}))

/**
 * Characterisation of the assigned-finished list, written against the LEGACY
 * screen before it moves into `src/features/field-service/dispatch/`.
 *
 * The wire here has one trap: the first load asks for page one and nothing
 * else, while the month arrows add `month`/`year` — parameters the endpoint
 * demonstrably reads (my24service `apps/mobile/views.py:251-252`) and
 * openapi/schema.yaml does not declare. The seam refuses an undeclared query
 * parameter, so the month window is pinned in
 * `assigned-finished-month.spec.js` against the older harness instead, and
 * this file pins what the seam can judge.
 */
const api = installApiSeam()

const ENDPOINT = '/api/mobile/assignedorder/finished_list/'

function row(overrides = {}) {
  return fixtureFor(vAssignedOrderView, {
    id: 501,
    order: {id: 12, order_id: '2026-0012', order_name: 'Acme', order_city: 'Utrecht'},
    engineer: fixtureFor(vEngineerMinimal, {
      id: 3,
      user: {first_name: 'Jan', last_name: 'Jansen'},
    }),
    started: '2026-09-14T08:00:00Z',
    ended: '2026-09-14T12:00:00Z',
    ...overrides,
  })
}

beforeEach(() => {
  vi.useFakeTimers({toFake: ['Date']})
  vi.setSystemTime(new Date(2026, 8, 16, 9, 0, 0))
  api.get(ENDPOINT, () => paginated([row()], {count: 1}))
})

afterEach(() => {
  vi.useRealTimers()
})

async function mountList(options = {}) {
  const wrapper = mountForm(AssignedFinished, {
    deep: true,
    main: {getCurrentLanguage: 'nl', getOrderListMustIncludeReference: false},
    ...options,
  })
  await settle()
  return wrapper
}

const reads = () => api.requests().filter((request) => request.path === ENDPOINT)

describe('AssignedFinished', () => {
  test('opens on page one of the current month', async () => {
    const wrapper = await mountList()

    expect(reads()[0]).toMatchObject({method: 'get', path: ENDPOINT, query: {page: '1'}})
    expect(wrapper.get('#assigned-finished-table').text()).toContain('Acme')
    expect(wrapper.text()).toContain('Assigned finished')
  })

  test('draws the order and the engineer of each finished assignment', async () => {
    const wrapper = await mountList()

    const body = wrapper.get('#assigned-finished-table tbody').text()
    expect(body).toContain('Acme')
    expect(body).toContain('Utrecht')
    expect(body).toContain('Jan Jansen')
  })

  test('a row links to its order', async () => {
    const wrapper = await mountList()

    expect(wrapper.get('#assigned-finished-table tbody a').attributes('href')).toBe('/orders/12')
  })

  test('an empty month has an explicit empty table', async () => {
    api.get(ENDPOINT, () => paginated([], {count: 0}))
    const wrapper = await mountList()

    expect(wrapper.get('#assigned-finished-table tbody').text().trim()).toBe('')
  })

  test('a load failure tells the user', async () => {
    api.get(ENDPOINT, serverError)
    await mountList()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading orders')
  })
})
