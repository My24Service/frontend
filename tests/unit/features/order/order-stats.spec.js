import { beforeEach, describe, expect, test, vi } from 'vitest'

import { MonthStats, YearStats } from '@/features/order'
import { monthCharts, seriesColor, yearCharts } from '@/features/order/stats/chart-data'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'
import { orderRoutes } from '../../support/order-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const STATUSCODES = [
  { id: 1, statuscode: 'planned', color: '#00ff00', code_type: 'order' },
  { id: 2, statuscode: 'done', color: '0000ff', code_type: 'order' },
]

const YEAR = () => ({
  year_data: {
    total: 3,
    items: { '01': { count: 2, perc: '66.67' }, '03': { count: 1, perc: '33.33' } },
    statuses: {},
    order_types: {},
  },
  statuses_data: {
    '01': { items: { planned: { count: 1, perc: '50.00' }, done: { count: 1, perc: '50.00' } }, total: 2 },
  },
})

const MONTH = () => ({
  month_data: { total: 2, items: { 37: { count: 2, perc: '100.00' } } },
  statuses_data: { 37: { items: { planned: { count: 2, perc: 100 } }, total: 2 } },
  assigned_orders_data: {
    37: { items: { 1: { count: 1, perc: 50 }, 2: { count: 1, perc: 50 } }, total: 2 },
    38: { items: {}, total: 0 },
  },
})

const chartStubs = {
  BarChart: { props: ['chartData', 'options', 'id'], template: '<div class="bar-stub">{{ chartData.datasets[0].label }}</div>' },
  PieChart: { props: ['chartData', 'options', 'id'], template: '<div class="pie-stub" />' },
}

async function mountPage(component) {
  const wrapper = mountForm(component, {
    deep: true,
    routes: orderRoutes,
    main: { getOrderTypes: ['Maintenance', 'Repair'], getStatuscodes: STATUSCODES, getCurrentLanguage: 'nl' },
    stubs: chartStubs,
  })
  await settle()
  return wrapper
}

beforeEach(() => {
  api.get('/api/order/order/year_list/', YEAR())
  api.get('/api/order/order/month_list/', MONTH())
})

describe('chart-data', () => {
  test('yearCharts lays out twelve months, zero where the year has none, statuses in their codes\' colours', () => {
    const charts = yearCharts(YEAR(), 'all', ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'], STATUSCODES)

    expect(charts.year.bar.datasets[0].data).toEqual([2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(charts.year.pie.datasets[0].data[1]).toBe('0.00')
    expect(charts.year.bar.datasets[0].label).toBe('Total orders for order type: all (Total: 3)')
    expect(charts.months['01'].bar.datasets[0].backgroundColor).toEqual(['#00ff00', '#0000ff'])
    expect(charts.months['01'].pie.labels).toEqual(['planned', 'done'])
  })

  test('monthCharts labels the weeks, colours series deterministically and skips empty assignment weeks', () => {
    const charts = monthCharts(MONTH(), 'Repair', (week) => `week ${week}`, STATUSCODES)

    expect(charts.month.bar.labels).toEqual(['week 37'])
    expect(charts.month.bar.datasets[0].backgroundColor).toEqual([seriesColor(0)])
    expect(charts.weeks['37'].bar.datasets[0].backgroundColor).toEqual(['#00ff00'])
    expect(Object.keys(charts.assigned)).toEqual(['37'])
    expect(charts.assigned['37'].bar.labels).toEqual(['1 x', '2 x'])
  })

  test('seriesColor is stable and distinct for neighbours', () => {
    expect(seriesColor(3)).toBe(seriesColor(3))
    expect(seriesColor(0)).not.toBe(seriesColor(1))
  })
})

describe('YearStats', () => {
  test('reads this year for all order types, and steps the year', async () => {
    const wrapper = await mountPage(YearStats)
    const thisYear = new Date().getFullYear()

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/order/order/year_list/', query: { order_type: 'all', year: String(thisYear) }, body: undefined },
    ])
    expect(wrapper.text()).toContain(`Total orders in ${thisYear}`)

    await wrapper.get(`a[title="Year back"]`).trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toEqual({ order_type: 'all', year: String(thisYear - 1) })
  })

  test('changing the order type re-reads with it', async () => {
    const wrapper = await mountPage(YearStats)

    await wrapper.get('#order-stats-type').setValue('Repair')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ order_type: 'Repair' })
    expect(wrapper.text()).toContain('Total orders for order type: Repair (Total: 3)')
  })
})

describe('MonthStats', () => {
  test('reads this month, and stepping past December rolls the year', async () => {
    const wrapper = await mountPage(MonthStats)
    const today = new Date()

    expect(api.requests()).toEqual([
      {
        method: 'get',
        path: '/api/order/order/month_list/',
        query: { order_type: 'all', year: String(today.getFullYear()), month: String(today.getMonth() + 1) },
        body: undefined,
      },
    ])

    for (let i = 0; i < 12; i++) {
      await wrapper.get(`a[title="Next month"]`).trigger('click')
    }
    await settle()

    expect(api.requests().at(-1).query).toEqual({
      order_type: 'all',
      year: String(today.getFullYear() + 1),
      month: String(today.getMonth() + 1),
    })
  })
})
