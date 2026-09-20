import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import moment from 'moment'
import { vTimeRegistrationListResponse } from '@/api/valibot.gen'
import TimeRegistration from '@/features/workforce/hours/TimeRegistration.vue'
import { fixtureFor } from '../../helpers/schema-fixture.js'
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
const YEAR_DATES = Array.from({length: 12}, (_, index) => `2025-${String(index + 1).padStart(2, '0')}-01`)

/**
 * The endpoint's answer, built from the response component the operation
 * declares (`TimeRegistrationListResponse`), so the seam checks it like any
 * other stub. Rows carry more than this screen draws - a workhour row also has
 * `username`, `source_id` and `customer_name` - so each is completed from its
 * own component and the spec overrides only what it asserts on. The times are
 * the endpoint's own `HH:mm:ss`.
 */
function totalsRow(userId, interval, intervalTotal, total) {
  return {
    bucket: `${DATES[0]}T00:00:00Z`,
    full_name: 'Jan Jansen',
    user_id: userId,
    contract_hours_week: 40,
    interval,
    work_total: {total, interval_total: intervalTotal},
  }
}

function listPayload(overrides = {}) {
  return fixtureFor(vTimeRegistrationListResponse, {
    full_name: null,
    totals_fields: ['work_total'],
    date_list: DATES,
    intervals: [1, 2, 3, 4, 5, 6, 7],
    totals: DATES.map((_, index) => totalsRow(7, index + 1, '8:00', '56:00')),
    ...overrides,
  })
}

/** A year window: twelve month columns, one interval each. */
function yearPayload() {
  return listPayload({
    date_list: YEAR_DATES,
    intervals: YEAR_DATES.map((_, index) => index + 1),
    totals: YEAR_DATES.map((_, index) => totalsRow(7, index + 1, '56:00', '672:00')),
  })
}

function detailPayload(overrides = {}) {
  return listPayload({
    full_name: 'Jan Jansen',
    totals: [{
      bucket: `${DATES[0]}T00:00:00Z`,
      full_name: 'Jan Jansen',
      user_id: 42,
      contract_hours_week: 40,
      interval: 1,
      work_total: {total: '8:00', interval_total: '8:00'},
    }],
    workhour_data: [
      {
        id: 12,
        source: 'company',
        date: '02-02-2026',
        work_start: '08:00:00',
        work_end: '16:00:00',
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
  })
}

const bodies = () => toasts().map((toast) => toast.body)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => listPayload())
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountTime(options = {}) {
  return mountListView(TimeRegistration, { deep: true, routes: workforceRoutes, main: TENANT, ...options })
}

describe('TimeRegistration', () => {
  test('reads the week window and renders the pivot rows', async () => {
    const wrapper = await mountTime()
    await settle()

    // No `page`: the endpoint answers one object, not a page of records.
    expect(api.requests().filter((request) => request.path === endpoint)).toEqual([
      {method: 'get', path: endpoint, query: {mode: 'week', start_date: ANCHOR}},
    ])

    const table = wrapper.get('#time-registration-table')
    expect(table.get('tbody').text()).toContain('Jan Jansen')
    expect(table.get('tbody').text()).toContain('56:00')
    // User, one column per day, Total.
    expect(table.findAll('thead th')).toHaveLength(9)
  })

  // The year window was the one path no spec could cover while `year` was
  // undeclared: the seam refuses a query parameter the schema does not declare,
  // and the year window cannot be asked for without it.
  test('the year window sends the year and renders a column per month', async () => {
    api.get(endpoint, () => yearPayload())
    const wrapper = await mountTime({query: {mode: 'year', date: '2025-06-15'}})
    await settle()

    expect(api.requests().at(-1)).toEqual({
      method: 'get',
      path: endpoint,
      query: {mode: 'year', start_date: '2025-06-15', year: '2025'},
    })

    const table = wrapper.get('#time-registration-table')
    // User, one column per month of the browsed year, Total.
    expect(table.findAll('thead th')).toHaveLength(14)
    expect(table.get('thead').text()).toContain('01')
    expect(table.get('tbody').text()).toContain('672:00')
    // The heading names the year the request asked for.
    expect(wrapper.text()).toContain('Work total - 2025')
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
    api.get(endpoint, () => detailPayload())
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
