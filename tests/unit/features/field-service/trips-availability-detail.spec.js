import { beforeEach, describe, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'

import TripAvailabilityDetail from '@/features/field-service/trips/TripAvailabilityDetail.vue'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { fieldServiceRoutes } from '../../support/field-service-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * Characterisation of the trip-availability detail, written against the LEGACY
 * screen before it moves into `src/features/field-service/trips/`.
 *
 * The endpoint's generated response component is a `Trip`, but the action
 * answers with a bundle - `{trip, available_users, assigned_users}` (my24service
 * `apps/mobile/views.py:915+`, where `result` is spelled out). A stubbed bundle
 * therefore has to go out as an explicit `HttpResponse`: the seam's response
 * check would reject the only shape the backend ever sends.
 */
const api = installApiSeam()
const endpoint = '/api/mobile/trip/{id}/trip_availability_detail/'
const detailPath = '/api/mobile/trip/17/trip_availability_detail/'
const assignEndpoint = '/api/mobile/assign-user-trip/{id}/'
const unassignEndpoint = '/api/mobile/unassign-user-trip/{id}/'

const TRIP = {
  id: 17,
  description: 'Kerstmarkt opbouw',
  required_users: 2,
  trip_date: '16/11/2021 13:30 - 18/11/2021 17:45',
}

const JAN = { id: 269, full_name: 'Jan Jansen', address: 'Bla 1a, 1234AX, Test', rating_avg: 4.5 }
const PIET = { id: 270, full_name: 'Piet Pietersen', address: 'Kerkstraat 2, 1234AA, Test', rating_avg: null }

function availability({ available = [JAN], assigned = [PIET] } = {}) {
  return new HttpResponse(JSON.stringify({ trip: TRIP, available_users: available, assigned_users: assigned }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

const bodies = () => toasts().map((toast) => toast.body)
const titles = () => toasts().map((toast) => toast.title)
const detailReads = () => api.requests().filter((request) => request.method === 'get' && request.path === detailPath)

beforeEach(() => {
  api.get(endpoint, () => availability())
  api.post(assignEndpoint, { result: 1 })
  api.post(unassignEndpoint, { result: 1 })
})

async function mountDetail(props = { pk: '17' }) {
  const wrapper = mountForm(TripAvailabilityDetail, { deep: true, props, routes: fieldServiceRoutes })
  await settle()
  return wrapper
}

describe('TripAvailabilityDetail', () => {
  test('reads the trip\'s availability bundle', async () => {
    await mountDetail()

    expect(detailReads()[0]).toMatchObject({ method: 'get', path: detailPath })
  })

  test('shows the trip\'s own facts', async () => {
    const wrapper = await mountDetail()

    const text = wrapper.get('.app-detail').text()
    expect(text).toContain('Kerstmarkt opbouw')
    expect(text).toContain('16/11/2021 13:30 - 18/11/2021 17:45')
    expect(text).toContain('2')
  })

  test('lists the available users, and who is already assigned', async () => {
    const wrapper = await mountDetail()

    const available = wrapper.get('#available-users-table').text()
    expect(available).toContain('Name')
    expect(available).toContain('Address')
    expect(available).toContain('Rating')
    expect(available).toContain('Jan Jansen')
    expect(available).toContain('Bla 1a, 1234AX, Test')
    expect(available).toContain('4.5')

    const assigned = wrapper.get('#assigned-users-table').text()
    expect(assigned).toContain('Piet Pietersen')
    expect(assigned).not.toContain('Jan Jansen')
  })

  test('clicking the assign icon asks the question before writing', async () => {
    const wrapper = await mountDetail()

    await wrapper.get('#available-users-table a[title="Assign"]').trigger('click')
    await settle()

    expect(wrapper.text()).toContain('Assign to Jan Jansen?')
    expect(api.requests().filter((request) => request.method === 'post')).toHaveLength(0)

    const cancel = wrapper.findAll('button').find((button) => button.text() === 'Cancel')
    await cancel.trigger('click')

    expect(wrapper.text()).not.toContain('Assign to Jan Jansen?')
  })

  test('confirming the assign posts the user and the trip, then redraws', async () => {
    const wrapper = await mountDetail()

    await wrapper.get('#available-users-table a[title="Assign"]').trigger('click')
    await settle()
    await wrapper.findAll('button').find((button) => button.text() === 'Assign').trigger('click')
    await settle()

    expect(api.requests().find((request) => request.method === 'post')).toMatchObject({
      path: assignEndpoint.replace('{id}', '269'),
      body: { trip_ids: '17', set_unavailable: true },
    })
    expect(titles()).toContain('Assigned')
    expect(bodies()).toContain('Trip assigned')
    expect(detailReads()).toHaveLength(2)
  })

  test('confirming the unassign posts the trip pk, then redraws', async () => {
    const wrapper = await mountDetail()

    await wrapper.get('#assigned-users-table a[title="Unassign"]').trigger('click')
    await settle()
    await wrapper.findAll('button').find((button) => button.text() === 'Unassign').trigger('click')
    await settle()

    expect(api.requests().find((request) => request.method === 'post')).toMatchObject({
      path: unassignEndpoint.replace('{id}', '270'),
      body: { trip_pk: 17, set_available: true },
    })
    expect(titles()).toContain('Unassigned')
    expect(bodies()).toContain('Student unassigned')
    expect(detailReads()).toHaveLength(2)
  })

  test('a failed assign tells the user and leaves the offer up', async () => {
    api.post(assignEndpoint, serverError())
    const wrapper = await mountDetail()

    await wrapper.get('#available-users-table a[title="Assign"]').trigger('click')
    await settle()
    await wrapper.findAll('button').find((button) => button.text() === 'Assign').trigger('click')
    await settle()

    expect(bodies()).toContain('Error assigning trip')
    expect(detailReads()).toHaveLength(1)
  })

  test('a failed unassign tells the user', async () => {
    api.post(unassignEndpoint, serverError())
    const wrapper = await mountDetail()

    await wrapper.get('#assigned-users-table a[title="Unassign"]').trigger('click')
    await settle()
    await wrapper.findAll('button').find((button) => button.text() === 'Unassign').trigger('click')
    await settle()

    expect(bodies()).toContain('Error unassigning trip')
  })

  test('the Back button goes back', async () => {
    const wrapper = await mountDetail()

    await wrapper.findAll('button').find((button) => button.text() === 'Back').trigger('click')

    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('tells the user when the availability cannot be loaded', async () => {
    api.get(endpoint, serverError)
    await mountDetail()

    expect(bodies()).toContain('Error fetching trip availability')
  })
})
