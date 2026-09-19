import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  vBudget,
  vBudgetCostsResponse,
  vBudgetExpectedCostsResponse,
} from '@/api/valibot.gen'
import BudgetView from '@/features/company/budget/BudgetView.vue'
import PieChart from '@/features/shared/charts/PieChart.vue'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: spy } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: spy }) }
})

const api = installApiSeam()

const BUDGET = fixtureFor(vBudget, {
  id: 4,
  year: 2026,
  amount: '5000.00',
  amount_currency: 'EUR',
  created: '01-01-2026',
  modified: '02-01-2026',
})

const COSTS = fixtureFor(vBudgetCostsResponse, {
  total: 3125.0,
  invoices_partners: { demo: 1000.0 },
  purchase_invoices: 2125.0,
})

const EXPECTED = fixtureFor(vBudgetExpectedCostsResponse, {
  total: 2249.0,
  own_maintenance_contracts: {},
  partner_maintenance_contracts: { demo: 1500.0 },
  equipment_replacements: 749.0,
})

const bodies = () => toasts().map((toast) => toast.body)

beforeEach(() => {
  api.get('/api/company/budget/{id}/', BUDGET)
  api.get('/api/company/budget/{id}/costs/', COSTS)
  api.get('/api/company/budget/{id}/expected_costs/', EXPECTED)
})

function mountBudget(options = {}) {
  return mountForm(BudgetView, {
    deep: true,
    props: { pk: 4 },
    main: { getDefaultCurrency: 'EUR' },
    stubs: { PieChart: { props: ['chartData', 'options'], template: '<div class="pie-chart-stub" />' } },
    ...options,
  })
}

describe('BudgetView', () => {
  test('renders the header with the European budget size', async () => {
    const wrapper = mountBudget()
    await settle()

    // 5000.00 renders the tenant's way, not the wire's.
    expect(wrapper.get('h3').text()).toContain('2026')
    expect(wrapper.text()).toContain('€5.000,00')
  })

  test('renders the costs against the budget', async () => {
    const wrapper = mountBudget()
    await settle()

    expect(wrapper.text()).toContain('€3.125,00')
    // The breakdown labels ride the pie's chart-data, not the DOM.
    const costsPie = wrapper.findAllComponents(PieChart)[0].props('chartData')
    expect(costsPie.labels).toEqual([
      'Purchase invoices (€2.125,00)',
      'Invoices partners - demo (€1.000,00)',
    ])
    expect(costsPie.datasets[0].data).toEqual(['68.00', '32.00'])
  })

  test('renders the expected costs', async () => {
    const wrapper = mountBudget()
    await settle()

    expect(wrapper.text()).toContain('€2.249,00')
    const expectedPie = wrapper.findAllComponents(PieChart)[1].props('chartData')
    expect(expectedPie.labels).toEqual([
      'Equipment replacements (€749,00)',
      'Maintenance contracts partners - demo (€1.500,00)',
    ])
  })

  test('the three reads fire as parallel queries', async () => {
    mountBudget()
    await settle()

    const paths = api.requests()
      .filter((request) => request.method === 'get')
      .map((request) => request.path)
    expect(paths).toContain('/api/company/budget/4/')
    expect(paths).toContain('/api/company/budget/4/costs/')
    expect(paths).toContain('/api/company/budget/4/expected_costs/')
  })

  test('a failed read tells the user instead of spinning forever', async () => {
    api.get('/api/company/budget/{id}/costs/', serverError)
    mountBudget()
    await settle()

    // The legacy screen had no catch on any of the three reads: one failure
    // left the spinner up forever.
    expect(bodies()).toContain('Error fetching budget costs')
  })
})
