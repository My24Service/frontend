import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { TripList } from '@/features/field-service'

import { vTrip } from '@/api/valibot.gen'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { fieldServiceRoutes } from '../../support/field-service-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * Characterisation of the trips planning list, written against the LEGACY
 * screen before it moves into `src/features/field-service/trips/`.
 *
 * What it pins is the part a refactor can silently break: the request the
 * screen makes, the columns and the cells it draws, the row links into the
 * `mobile-trips-add` / `mobile-trips-edit` route family, the delete
 * confirmation, and the states a user sees while the list loads, comes back
 * empty, or fails.
 */
const api = installApiSeam()
const endpoint = '/api/mobile/trip/'

function tripRow(overrides = {}) {
  return fixtureFor(vTrip, {
    id: 17,
    description: 'Kerstmarkt opbouw',
    last_status: 'Planned',
    required_users: 3,
    num_orders: 2,
    trip_date: '16/11/2021 13:30 - 18/11/2021 17:45',
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)
const titles = () => toasts().map((toast) => toast.title)
const listRequests = () => api.requests().filter((request) => request.method === 'get' && request.path === endpoint)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => paginated([tripRow()], { count: 45 }))
  api.delete(endpoint + '{id}/', noContent)
})

afterEach(() => window.history.replaceState(null, '', '/'))

/** The toolbar search commits on a 300 ms debounce. */
async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

/**
 * Mount the list, with `hash` seeded for the tests that read a shared address:
 * the kit mirrors the page and the search term into the URL's hash, which is
 * where a bookmarked view comes back from (`url-query-sync.ts`).
 */
async function mountTrips(query = {}, hash = '') {
  window.history.replaceState(null, '', hash ? `/#/?${hash}` : '/')
  const wrapper = await mountListView(TripList, { deep: true, routes: fieldServiceRoutes, query })
  await settle()
  return wrapper
}

describe('TripList', () => {
  test('the initial load asks for page one', async () => {
    await mountTrips()

    expect(listRequests()[0]).toEqual({ method: 'get', path: endpoint, query: { page: '1', page_size: '20' } })
  })

  test('draws the columns the legacy table declared', async () => {
    const wrapper = await mountTrips()

    const headers = wrapper.findAll('thead th').map((th) => th.text())
    expect(headers).toContain('Date')
    expect(headers).toContain('Status')
    expect(headers).toContain('Description')
    expect(headers).toContain('Required users')
    expect(headers).toContain('# orders')
  })

  test('a row shows the trip the backend returned', async () => {
    const wrapper = await mountTrips()

    const body = wrapper.get('tbody').text()
    expect(body).toContain('16/11/2021 13:30 - 18/11/2021 17:45')
    expect(body).toContain('Planned')
    expect(body).toContain('Kerstmarkt opbouw')
    expect(body).toContain('3')
    expect(body).toContain('2')
  })

  test('asks for no ordering, because the endpoint declares none', async () => {
    await mountTrips()

    expect(listRequests()[0].query).not.toHaveProperty('ordering')
    expect(listRequests()[0].query).not.toHaveProperty('sort_field')
  })

  test('the new-trip button links into the add route', async () => {
    const wrapper = await mountTrips()

    expect(wrapper.find('a[href="/mobile/trips/form"]').exists()).toBe(true)
  })

  test('a row links into the edit route with the row\'s own pk', async () => {
    const wrapper = await mountTrips()

    expect(wrapper.find('a[href="/mobile/trips/form/17"]').exists()).toBe(true)
  })

  test('the search term goes on the wire and resets the page', async () => {
    const wrapper = await mountTrips()
    expect(listRequests()).toHaveLength(1)

    // The shell's toolbar search replaced the legacy SearchModal: same claim
    // (the term is committed and the page resets), different control.
    await wrapper.get('input[aria-label="Search trips"]').setValue('kerst')
    await pastDebounce()

    expect(listRequests()).toHaveLength(2)
    expect(listRequests()[1].query).toMatchObject({ page: '1', q: 'kerst' })
  })

  test('offers no sortable headers, because the endpoint declares no ordering', async () => {
    // The legacy b-table's five sortable headers sorted the rows it already
    // held and never reached the backend. The kit's sort is a wire parameter,
    // and this endpoint declares none, so the headers are inert.
    const wrapper = await mountTrips()

    expect(wrapper.findAll('th.sortable-header')).toHaveLength(0)
  })

  test('a shared address is the page it loads', async () => {
    await mountTrips({}, 'page=2')

    expect(listRequests().at(-1).query).toMatchObject({ page: '2' })
  })

  test('an empty list has an explicit empty state', async () => {
    api.get(endpoint, paginated([]))
    const wrapper = await mountTrips()

    expect(wrapper.get('tbody').text()).toContain('No trips found')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get(endpoint, serverError)
    await mountTrips()

    expect(bodies()).toContain('Error loading trips')
    expect(titles()).toContain('Error')
  })
})

describe('TripList delete', () => {
  test('confirms, deletes the row and reloads the list', async () => {
    const wrapper = await mountTrips()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)

    modal('delete-trip-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'delete')).toMatchObject({
      path: endpoint + '17/',
    })
    expect(listRequests()).toHaveLength(2)
    expect(titles()).toContain('Deleted')
    expect(bodies()).toContain('Trip has been deleted')
  })

  test('a failed delete keeps the row and reports it', async () => {
    api.delete(endpoint + '{id}/', serverError)
    const wrapper = await mountTrips()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-trip-modal').ok()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('Kerstmarkt opbouw')
    expect(bodies()).toContain('Error deleting trip')
    expect(listRequests()).toHaveLength(1)
  })
})
