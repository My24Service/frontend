import { beforeEach, describe, expect, test, vi } from 'vitest'
import { nextTick } from 'vue'
import moment from 'moment/min/moment-with-locales'

import TimeSheetDetail from '@/features/field-service/timesheets/TimeSheetDetail.vue'
import UserHoursDataDetail from '@/features/field-service/timesheets/UserHoursDataDetail.vue'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountListView, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

/**
 * One engineer's week: the totals the Timesheet grid shows for a row, broken
 * out per day field.
 *
 * Same endpoint and same seam as `hours-timesheet.spec.js`: the detail sends
 * `user_id` **and** `start_date`, and both are declared parameters of
 * `list_timesheet_totals` — `user_id` as the integer the screen now converts
 * its route param to. The seam refuses a query the schema does not declare and
 * validates the stubbed response, so this file pins the wire and the payload.
 */
const api = installApiSeam()

const ENDPOINT = '/api/mobile/assignedorder/list_timesheet_totals/'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

const routes = [
  { name: 'mobile-timesheet', path: '/mobile/timesheet', component: { template: '<div />' } },
  { name: 'mobile-timesheet-detail', path: '/mobile/timesheet/:user_id', component: { template: '<div />' } },
]

function payload(overrides = {}) {
  return {
    day_fields: ['work_total', 'distance_total'],
    day_field_types: ['duration', 'number'],
    date_list: ['2026-01-05', '2026-01-06'],
    result: [
      {
        full_name: 'Jan Jansen',
        user_id: 5,
        day_totals: [[3600, '12.50'], [0, '3.00']],
        week_totals: [3600, '15.50'],
      },
    ],
    materials: [
      { material_name: 'Bout', material_identifier: 'M8-20', amount: '3.00' },
    ],
    full_name: 'Jan Jansen',
    ...overrides,
  }
}

function listRequests() {
  return api.requests().filter(
    (request) => request.method === 'get' && request.path === ENDPOINT,
  )
}

async function mountDetail(options = {}) {
  const wrapper = await mountListView(TimeSheetDetail, {
    deep: true,
    routes,
    language: 'en',
    query: { date: '2026-01-05' },
    props: { user_id: 5 },
    ...options,
  })
  await settle()
  return wrapper
}

beforeEach(() => {
  moment.locale('en')
  api.get(ENDPOINT, () => payload())
})

describe('TimeSheetDetail - the wire', () => {
  test('asks for one user and one week', async () => {
    await mountDetail()

    const requests = listRequests()
    expect(requests).toHaveLength(1)
    expect(requests[0].query.user_id).toBe('5')
    expect(requests[0].query.start_date).toBe('2026-01-05')
  })

  test('the user it asks for is the one the route carries', async () => {
    await mountDetail({ props: { user_id: 47 } })

    expect(listRequests()[0].query.user_id).toBe('47')
  })

  test('a route param that arrives as text is sent as the declared integer', async () => {
    // The router hands `:user_id` over as a string. The endpoint declares
    // `user_id` an integer and the generated client validates the request
    // before it builds the URL, so the raw route text would never reach the
    // wire - a converted id or no request at all.
    await mountDetail({ props: { user_id: '47' } })

    expect(listRequests()).toHaveLength(1)
    expect(listRequests()[0].query.user_id).toBe('47')
  })
})

describe('TimeSheetDetail - the breakdown', () => {
  test('renders one row per day field, for the days of the week', async () => {
    const wrapper = await mountDetail()

    expect(wrapper.find('#user-hours-detail-table').exists()).toBe(true)
    const headers = wrapper.findAll('#user-hours-detail-table thead th').map((th) => th.text())
    expect(headers).toEqual(['Field', 'Mon 05', 'Tue 06', 'Total'])

    const rows = wrapper.findAll('#user-hours-detail-table tbody tr')
    expect(rows.map((row) => row.text())).toEqual([
      'Work total1:000:001:00',
      'Distance total12.503.0015.50',
    ])
  })

  test('says whose week it is showing', async () => {
    const wrapper = await mountDetail()

    expect(wrapper.text()).toContain('Totals in week 2/2026 for Jan Jansen')
  })

  test('links back to the week it details, through the route names it was given', async () => {
    const wrapper = await mountDetail()

    expect(wrapper.get('.breadcrumb').text()).toContain('Timesheet detail')
    expect(wrapper.get('.breadcrumb a').attributes('href')).toBe('/mobile/timesheet?date=2026-01-05')
  })

  test('only the first row of the payload is broken out', async () => {
    api.get(ENDPOINT, () => payload({
      result: [
        {
          full_name: 'Jan Jansen',
          user_id: 5,
          day_totals: [[3600, '12.50'], [0, '3.00']],
          week_totals: [3600, '15.50'],
        },
        {
          full_name: 'Piet Pietersen',
          user_id: 9,
          day_totals: [[60, '1.00'], [60, '1.00']],
          week_totals: [120, '2.00'],
        },
      ],
    }))

    const wrapper = await mountDetail()

    expect(wrapper.findAll('#user-hours-detail-table tbody tr')).toHaveLength(2)
    expect(wrapper.get('#user-hours-detail-table tbody').text()).toContain('12.50')
    expect(wrapper.get('#user-hours-detail-table tbody').text()).not.toContain('1.00')
  })

  test('an empty result leaves the table without rows, and still names the week', async () => {
    api.get(ENDPOINT, () => payload({ result: [] }))

    const wrapper = await mountDetail()

    expect(wrapper.findAll('#user-hours-detail-table tbody tr')).toHaveLength(0)
    expect(wrapper.text()).toContain('Totals in week 2/2026')
  })
})

describe('TimeSheetDetail - the week arrows', () => {
  test('a week forward reloads the breakdown, the header and the breadcrumb', async () => {
    const wrapper = await mountDetail()

    await wrapper.get('a[title="Next week"]').trigger('click')
    await settle()

    expect(wrapper.vm.$route.query.date).toBe('2026-01-12')
    expect(wrapper.text()).toContain('week 3/2026')
    expect(wrapper.get('.breadcrumb a').attributes('href')).toBe('/mobile/timesheet?date=2026-01-12')

    const requests = listRequests()
    expect(requests).toHaveLength(2)
    expect(requests[1].query).toEqual({ user_id: '5', start_date: '2026-01-12' })
  })
})

describe('TimeSheetDetail - the materials table', () => {
  test('renders the materials the payload carries', async () => {
    const wrapper = await mountDetail()

    expect(wrapper.find('#timesheet-detail-material-table').exists()).toBe(true)
    const body = wrapper.get('#timesheet-detail-material-table tbody').text()
    expect(body).toContain('Bout')
    expect(body).toContain('M8-20')
    expect(body).toContain('3.00')
  })
})

describe('TimeSheetDetail - failure', () => {
  test('tells the user when the details cannot be loaded', async () => {
    api.get(ENDPOINT, serverError)

    await mountDetail()

    expect(toasts().map((toast) => toast.body)).toContain('Error fetching timesheet details')
  })
})

describe('UserHoursDataDetail - the processData handle', () => {
  async function mountChild() {
    const wrapper = await mountListView(UserHoursDataDetail, {
      deep: true,
      routes,
      language: 'en',
      query: { date: '2026-01-05' },
      props: {
        main_grid_router_name: 'mobile-timesheet',
        breadcrumb_main_grid_title: 'Timesheet',
        breadcrumb_grid_title: 'Timesheet detail',
      },
    })
    await settle()
    return wrapper
  }

  test('renders what it is handed, and nothing before that', async () => {
    const wrapper = await mountChild()

    expect(wrapper.findAll('#user-hours-detail-table tbody tr')).toHaveLength(0)

    wrapper.vm.processData(payload())
    await nextTick()

    expect(wrapper.get('#user-hours-detail-table tbody').text()).toContain('Work total')
    expect(wrapper.get('#user-hours-detail-table tbody').text()).toContain('1:00')
    expect(wrapper.text()).toContain('for Jan Jansen')
  })

  test('takes a second payload, replacing the first', async () => {
    const wrapper = await mountChild()

    wrapper.vm.processData(payload())
    await nextTick()
    wrapper.vm.processData(payload({
      full_name: 'Piet Pietersen',
      day_fields: ['break_total'],
      day_field_types: ['duration'],
      result: [{
        full_name: 'Piet Pietersen',
        user_id: 9,
        day_totals: [[1800], [1800]],
        week_totals: [3600],
      }],
    }))
    await nextTick()

    const rows = wrapper.findAll('#user-hours-detail-table tbody tr')
    expect(rows).toHaveLength(1)
    expect(rows[0].text()).toBe('Breaks total0:300:301:00')
    expect(wrapper.text()).toContain('for Piet Pietersen')
  })
})
