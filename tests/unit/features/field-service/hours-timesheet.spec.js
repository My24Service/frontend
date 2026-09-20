import { beforeEach, describe, expect, test, vi } from 'vitest'
import { nextTick } from 'vue'
import moment from 'moment/min/moment-with-locales'

import TimeSheet from '@/features/field-service/hours/TimeSheet.vue'
import TimeSheetDetail from '@/features/field-service/hours/TimeSheetDetail.vue'
import UserHoursData from '@/features/field-service/hours/UserHoursData.vue'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { createTestQueryClient, mountListView, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

/**
 * The Timesheet console: the week grid over the mobile workforce, and the
 * materials table under it.
 *
 * Both Timesheet screens read `GET /api/mobile/assignedorder/list_timesheet_totals/`
 * with a query the endpoint declares: the list sends `start_date`, the detail
 * sends `user_id` and `start_date`. The operation carries all three as
 * declared parameters now, so these screens sit on the strict seam like every
 * other converted one — `installApiSeam` refuses a query parameter the schema
 * does not declare, and validates the stubbed response against the operation's
 * own component, which is what pins the wire here.
 */
const api = installApiSeam()

const ENDPOINT = '/api/mobile/assignedorder/list_timesheet_totals/'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

// The recipe the screens link to and navigate through.
const routes = [
  { name: 'mobile-timesheet', path: '/mobile/timesheet', component: { template: '<div />' } },
  { name: 'mobile-timesheet-detail', path: '/mobile/timesheet/:user_id', component: { template: '<div />' } },
]

function payload(overrides = {}) {
  return {
    day_fields: ['work_total', 'break_total'],
    day_field_types: ['duration', 'duration'],
    date_list: ['2026-01-05', '2026-01-06'],
    result: [
      {
        full_name: 'Jan Jansen',
        user_id: 5,
        day_totals: [[3600, 0], [7200, 1800]],
        week_totals: [10800, 1800],
      },
    ],
    materials: [
      { material_name: 'Bout', material_identifier: 'M8-20', amount: '3.00' },
    ],
    full_name: null,
    ...overrides,
  }
}

function listRequests() {
  return api.requests().filter(
    (request) => request.method === 'get' && request.path === ENDPOINT,
  )
}

/**
 * The Monday the screen starts on when the address carries no date, as the
 * legacy expression `moment().weekday(monday)` computes it: index 1 in an
 * English (Sunday-first) locale, index 0 in every other one. Written the same
 * way here on purpose - the value is locale-dependent on a Sunday, and the
 * conversion preserves it rather than "fixing" it silently.
 */
function currentWeekStart(language) {
  moment.locale(language)
  return moment().weekday(language === 'en' ? 1 : 0).format('YYYY-MM-DD')
}

async function mountTimesheet(options = {}) {
  const wrapper = await mountListView(TimeSheet, {
    deep: true,
    routes,
    language: 'en',
    query: { date: '2026-01-05' },
    ...options,
  })
  await settle()
  return wrapper
}

beforeEach(() => {
  moment.locale('en')
  api.get(ENDPOINT, () => payload())
})

describe('TimeSheet - the wire', () => {
  test('asks the timesheet totals endpoint for the week in the address', async () => {
    await mountTimesheet()

    const requests = listRequests()
    expect(requests).toHaveLength(1)
    expect(requests[0].query.start_date).toBe('2026-01-05')
  })

  test('the list asks for nobody in particular', async () => {
    await mountTimesheet()

    expect(listRequests()[0].query).not.toHaveProperty('user_id')
  })

  test('a date in the address is used verbatim, not snapped to a week', async () => {
    await mountTimesheet({ query: { date: '2026-01-08' } })

    expect(listRequests()[0].query.start_date).toBe('2026-01-08')
  })

  test('without a date in the address it loads the week it is in', async () => {
    await mountTimesheet({ query: {} })

    expect(listRequests()[0].query.start_date).toBe(currentWeekStart('en'))
  })

  test('the week depends on the language, as the legacy screen did', async () => {
    await mountTimesheet({ query: {}, language: 'nl' })

    expect(listRequests()[0].query.start_date).toBe(currentWeekStart('nl'))
  })

  test('asks for the week and nothing else', async () => {
    // The legacy model sent the week *and* `page=1`, because BaseModel puts its
    // current page into every list URL. This action is unpaginated and ignores
    // the parameter, so the converted screen asks for what it reads - and the
    // seam is what holds it to that: an undeclared parameter is a failure.
    await mountTimesheet()

    expect(listRequests()[0].query).toEqual({ start_date: '2026-01-05' })
  })
})

describe('TimeSheet - the week arrows', () => {
  test('a week forward reloads the grid, for the week now in the address', async () => {
    const wrapper = await mountTimesheet()

    await wrapper.get('a[title="Next week"]').trigger('click')
    await settle()

    expect(wrapper.vm.$route.query.date).toBe('2026-01-12')
    expect(wrapper.text()).toContain('week 3/2026')
    const requests = listRequests()
    expect(requests).toHaveLength(2)
    expect(requests[1].query).toEqual({ start_date: '2026-01-12' })
  })

  test('a week back reloads the grid too', async () => {
    const wrapper = await mountTimesheet()

    await wrapper.get('a[title="Week back"]').trigger('click')
    await settle()

    expect(wrapper.vm.$route.query.date).toBe('2025-12-29')
    expect(listRequests()[1].query).toEqual({ start_date: '2025-12-29' })
  })
})

describe('TimeSheet and TimeSheetDetail - one query each', () => {
  test('the list keeps its own week after the detail screen has mounted', async () => {
    // Both screens used to write their parameters into one module-level model
    // (`timeSheetModel.setListArgs(...)`), so the detail screen's `user_id`
    // overwrote the list screen's arguments and the next load of the list asked
    // for a single user. Each screen now owns a vue-query query keyed on its own
    // parameters, which is what this asserts: the list can be refetched on its
    // own after the detail has been on screen, and the request it sends is still
    // the list's.
    const queryClient = createTestQueryClient()
    // Both screens read the same endpoint, so the list's own requests are the
    // ones that name no user.
    const listOnly = () => listRequests().filter((request) => !('user_id' in request.query))

    await mountTimesheet({ queryClient })
    expect(listOnly()).toHaveLength(1)

    await mountListView(TimeSheetDetail, {
      deep: true,
      routes,
      language: 'en',
      query: { date: '2026-01-05' },
      props: { user_id: 5 },
      queryClient,
    })
    await settle()
    expect(listRequests()).toHaveLength(2)
    expect(listRequests()[1].query.user_id).toBe('5')

    queryClient.invalidateQueries()
    await settle()

    expect(listOnly()).toHaveLength(2)
    expect(listOnly()[1].query).toEqual({ start_date: '2026-01-05' })
  })
})

describe('TimeSheet - the grid', () => {
  test('renders a row per user with a column per day and a total', async () => {
    const wrapper = await mountTimesheet()

    expect(wrapper.find('#user-hours-table').exists()).toBe(true)
    const headers = wrapper.findAll('#user-hours-table thead th').map((th) => th.text())
    expect(headers).toEqual(['User', 'Mon 05', 'Tue 06', 'Total'])

    const row = wrapper.get('#user-hours-table tbody tr')
    expect(row.text()).toContain('Jan Jansen')
    expect(row.text()).toContain('1:00')
    expect(row.text()).toContain('2:00')
    expect(row.text()).toContain('3:00')
  })

  test('names the day fields the payload carries above the grid', async () => {
    const wrapper = await mountTimesheet()

    expect(wrapper.text()).toContain('Work total / Breaks total')
  })

  test('links each user to the detail screen for the week on screen', async () => {
    const wrapper = await mountTimesheet()

    expect(wrapper.get('#user-hours-table tbody a').attributes('href'))
      .toBe('/mobile/timesheet/5?date=2026-01-05')
  })
})

describe('TimeSheet - the materials table', () => {
  test('renders the materials the payload carries', async () => {
    const wrapper = await mountTimesheet()

    expect(wrapper.find('#timesheet-material-table').exists()).toBe(true)
    expect(wrapper.get('#timesheet-material-table thead').text())
      .toContain('Material')
    expect(wrapper.get('#timesheet-material-table tbody').text()).toContain('Bout')
    expect(wrapper.get('#timesheet-material-table tbody').text()).toContain('M8-20')
    expect(wrapper.get('#timesheet-material-table tbody').text()).toContain('3.00')
  })
})

describe('TimeSheet - failure', () => {
  test('tells the user when the totals cannot be loaded', async () => {
    api.get(ENDPOINT, serverError)

    await mountTimesheet()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading orders')
  })

  test('the grid and the table survive a missing child handle', async () => {
    // The parent hands the payload to the child through an imperative handle and
    // guards the call: a stub (or an unmounted) child must not throw.
    const wrapper = await mountTimesheet({ deep: false })

    expect(listRequests()).toHaveLength(1)
    expect(wrapper.find('header').exists()).toBe(true)
  })
})

describe('UserHoursData - the processData handle', () => {
  // The parent always passes the route name down; mounting the child bare
  // leaves `detail_route_name` undefined and its link resolves to nowhere.
  async function mountChild() {
    const wrapper = await mountListView(UserHoursData, {
      deep: true,
      routes,
      language: 'en',
      query: { date: '2026-01-05' },
      props: { detail_route_name: 'mobile-timesheet-detail' },
    })
    await settle()
    return wrapper
  }

  test('renders what it is handed, and nothing before that', async () => {
    const wrapper = await mountChild()

    expect(wrapper.findAll('#user-hours-table tbody tr')).toHaveLength(0)

    wrapper.vm.processData(payload())
    await nextTick()

    expect(wrapper.get('#user-hours-table tbody').text()).toContain('Jan Jansen')
    expect(wrapper.get('#user-hours-table tbody').text()).toContain('3:00')
  })

  test('skips an empty day and keeps the ones with values', async () => {
    const wrapper = await mountChild()

    wrapper.vm.processData(payload({
      date_list: ['2026-01-05', '2026-01-06'],
      result: [{
        full_name: 'Jan Jansen',
        user_id: 5,
        day_totals: [[0, 0], [0, 0]],
        week_totals: [0, 0],
      }],
    }))
    await nextTick()

    const cells = wrapper.findAll('#user-hours-table tbody tr td')
    expect(cells.map((cell) => cell.text())).toEqual(['Jan Jansen', '', '', ''])
  })

  test('takes a second payload, replacing the first', async () => {
    const wrapper = await mountChild()

    wrapper.vm.processData(payload())
    await nextTick()
    wrapper.vm.processData(payload({
      result: [{
        full_name: 'Piet Pietersen',
        user_id: 9,
        day_totals: [[1800, 1800], [0, 0]],
        week_totals: [3600, 1800],
      }],
    }))
    await nextTick()

    const rows = wrapper.findAll('#user-hours-table tbody tr')
    expect(rows).toHaveLength(1)
    expect(rows[0].text()).toContain('Piet Pietersen')
    expect(wrapper.get('#user-hours-table tbody a').attributes('href'))
      .toBe('/mobile/timesheet/9?date=2026-01-05')
  })
})
