import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { TripAvailability } from '@/features/field-service'

import { vTrip } from '@/api/valibot.gen'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountListView, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { fieldServiceRoutes } from '../../support/field-service-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * Characterisation of the trip-availability list, written against the LEGACY
 * screen before it moves into `src/features/field-service/trips/`.
 *
 * The screen imports the **Trip** model, not `TripAvailability.js`, so its
 * rows are trips read from `/api/mobile/trip/`. What it pins is that read,
 * the `trip` cell's three lines and the link into
 * `mobile-trip-availability-detail`, and the three counts beside it.
 */
const api = installApiSeam()
const endpoint = '/api/mobile/trip/'

function tripRow(overrides = {}) {
  return fixtureFor(vTrip, {
    id: 17,
    description: 'Kerstmarkt opbouw',
    required_users: 3,
    users_trip_set_as_available: 5,
    assigned_user_count: 2,
    trip_date: '16/11/2021 13:30 - 18/11/2021 17:45',
    ...overrides,
  })
}

/** The toolbar search commits on a 300 ms debounce. */
async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

const bodies = () => toasts().map((toast) => toast.body)
const listRequests = () => api.requests().filter((request) => request.method === 'get' && request.path === endpoint)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => paginated([tripRow()], { count: 45 }))
})

afterEach(() => window.history.replaceState(null, '', '/'))

async function mountAvailability() {
  const wrapper = await mountListView(TripAvailability, { deep: true, routes: fieldServiceRoutes })
  await settle()
  return wrapper
}

describe('TripAvailability', () => {
  test('reads the trip collection on page one', async () => {
    await mountAvailability()

    expect(listRequests()[0]).toMatchObject({ method: 'get', path: endpoint, query: { page: '1', page_size: '20' } })
  })

  test('draws the columns the legacy table declared', async () => {
    const wrapper = await mountAvailability()

    const headers = wrapper.findAll('thead th').map((th) => th.text())
    expect(headers).toContain('Trip')
    expect(headers).toContain('Required users')
    expect(headers).toContain('Available users')
    expect(headers).toContain('Assigned users')
  })

  test('the trip cell names the trip, its description, its date and links to its detail', async () => {
    const wrapper = await mountAvailability()

    const body = wrapper.get('tbody').text()
    expect(body).toContain('trip-17')
    expect(body).toContain('Kerstmarkt opbouw')
    expect(body).toContain('16/11/2021 13:30 - 18/11/2021 17:45')
    expect(wrapper.get('tbody a').attributes('href')).toBe('/mobile/trip-availability/17')
  })

  test('the three counts come from the row', async () => {
    const wrapper = await mountAvailability()

    const cells = wrapper.get('tbody tr').findAll('td').map((cell) => cell.text())
    expect(cells).toContain('3')
    expect(cells).toContain('5')
    expect(cells).toContain('2')
  })

  test('the toolbar search commits the term to the wire', async () => {
    const wrapper = await mountAvailability()

    // The legacy screen had no search at all; the shell's toolbar brings one,
    // and it rides the `q` parameter the endpoint already declares.
    await wrapper.get('input[aria-label="Search trips"]').setValue('kerst')
    await pastDebounce()

    expect(listRequests().at(-1).query).toMatchObject({ page: '1', q: 'kerst' })
  })

  test('an empty list has an explicit empty state', async () => {
    api.get(endpoint, paginated([]))
    const wrapper = await mountAvailability()

    expect(wrapper.get('tbody').text()).toContain('No trips found')
  })

  test('tells the user when the list cannot be loaded', async () => {
    // The legacy catch called `errorToast` without importing it
    // (`src/views/mobile/TripAvailability.vue:94`), so a failed load raised a
    // ReferenceError instead of a toast and the user saw nothing. Repaired,
    // not preserved.
    api.get(endpoint, serverError)
    await mountAvailability()

    expect(bodies()).toContain('Error loading trips')
  })
})
