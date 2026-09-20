import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import moment from 'moment'
import { HttpResponse } from 'msw'
import TimeRegistration from '@/features/workforce/hours/TimeRegistration.vue'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { workforceRoutes } from '../../support/workforce-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({ create: toastCreate }),
}))

const api = installApiSeam()
const endpoint = '/api/company/time-registration/'
const TENANT = {memberInfo: {companycode: 'acme'}}

// The screen localises moment to the tenant language as it sets up (nl under
// this harness) and anchors the week on `weekday(0)` in that locale - the
// Sunday of the current week. Computed the same way here, because a frozen
// literal would pin the day the spec was written.
moment.locale('nl')
const WEEK_START = moment().weekday(0)
const ANCHOR = WEEK_START.format('YYYY-MM-DD')
const DATES = Array.from({length: 7}, (_, index) => WEEK_START.clone().add(index, 'days').format('YYYY-MM-DD'))

/**
 * The endpoint answers a hand-built dict, not the paginated envelope
 * `openapi/schema.yaml` declares for it (`PaginatedTimeRegistrationListList`,
 * derived from the viewset's `serializer_class`). The view overrides `list()`
 * and returns `{totals_fields, date_list, intervals, totals, ...}`
 * (apps/workforce/views.py), so a fixture the schema would accept is a fixture
 * the backend never sends. Sent as an explicit HttpResponse, the seam's
 * documented opt-out.
 */
function jsonResponse(payload) {
  return new HttpResponse(JSON.stringify(payload), {
    status: 200,
    headers: {'Content-Type': 'application/json'},
  })
}

function listPayload(overrides = {}) {
  return {
    full_name: null,
    totals_fields: ['work_total'],
    date_list: DATES,
    intervals: [1, 2, 3, 4, 5, 6, 7],
    totals: DATES.map((date, index) => ({
      bucket: `${date}T00:00:00Z`,
      full_name: 'Jan Jansen',
      user_id: 7,
      contract_hours_week: 40,
      user_work_total: '56:00',
      user_interval_work_total: '8:00',
      interval: index + 1,
      work_total: {total: '56:00', interval_total: '8:00'},
    })),
    ...overrides,
  }
}

function detailPayload(overrides = {}) {
  return {
    full_name: 'Jan Jansen',
    totals_fields: ['work_total'],
    date_list: DATES,
    intervals: [1, 2, 3, 4, 5, 6, 7],
    totals: [
      {
        bucket: `${DATES[0]}T00:00:00Z`,
        full_name: 'Jan Jansen',
        user_id: 42,
        contract_hours_week: 40,
        user_work_total: '8:00',
        user_interval_work_total: '8:00',
        interval: 1,
        work_total: {total: '8:00', interval_total: '8:00'},
      },
    ],
    workhour_data: [
      {
        id: 12,
        source: 'company',
        date: '02-02-2026',
        work_start: '08:00',
        work_end: '16:00',
        work_correction: '00:00',
        travel_to: '00:00:00',
        travel_back: '00:00:00',
        distance_to: 0,
        distance_back: 0,
        project: 'Project X',
        description: '#123',
      },
    ],
    leave_data: [],
    ...overrides,
  }
}

const bodies = () => toasts().map((toast) => toast.body)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => jsonResponse(listPayload()))
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountTime(options = {}) {
  return mountListView(TimeRegistration, { deep: true, routes: workforceRoutes, main: TENANT, ...options })
}

describe('TimeRegistration', () => {
  test('reads the week window and renders the pivot rows', async () => {
    const wrapper = await mountTime()
    await settle()

    // No `page`: the endpoint answers a hand-built dict with no envelope, so
    // the page the legacy request carried did nothing.
    expect(api.requests().filter((request) => request.path === endpoint)).toEqual([
      {method: 'get', path: endpoint, query: {mode: 'week', start_date: ANCHOR}},
    ])

    const table = wrapper.get('#time-registration-table')
    expect(table.get('tbody').text()).toContain('Jan Jansen')
    expect(table.get('tbody').text()).toContain('56:00')
    // User, one column per day, Total.
    expect(table.findAll('thead th')).toHaveLength(9)
  })

  test('the user cell links to the detail window for that day', async () => {
    const wrapper = await mountTime()
    await settle()

    expect(wrapper.get('#time-registration-table tbody a').attributes('href'))
      .toBe(`/company/time-registration/detail/7?date=${ANCHOR}&mode=week`)
  })

  test('a window in the route is what the screen asks for', async () => {
    await mountTime({query: {date: '2026-02-04', mode: 'week'}})
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({mode: 'week', start_date: '2026-02-04'})
  })

  test('a detail mount asks for that user and renders the day tables', async () => {
    api.get(endpoint, () => jsonResponse(detailPayload()))
    const wrapper = await mountTime({props: {user_id: 42}})
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({mode: 'week', start_date: ANCHOR, user: '42'})
    expect(wrapper.text()).toContain('Jan Jansen')
    expect(wrapper.text()).toContain('Week totals')
    expect(wrapper.get('#time-registration-detail-table tbody').text()).toContain('Work total')
    expect(wrapper.get('#workhours-table tbody').text()).toContain('Project X')
    expect(wrapper.get('#workhours-table tbody').text()).toContain('#123')
  })

  test('a load failure tells the user', async () => {
    api.get(endpoint, serverError)
    await mountTime()
    await settle()

    expect(bodies()).toContain('Error loading time data')
  })
})
