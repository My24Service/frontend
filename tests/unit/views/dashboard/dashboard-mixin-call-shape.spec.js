import { beforeEach, describe, expect, test } from 'vitest'

import dashboardMixin from '@/views/dashboard/dashboard_view/dashboardMixin'
import CompanyDashboard from '@/views/company/CompanyDashboard.vue'
import {
  vBranch,
  vEquipmentDocument,
  vMember,
  vOrderOrderCountsYearOrderTypeStatsRetrieveResponse,
  vOrderOrderOrderCountsStatsRetrieveResponse,
  vOrderOrderOrderTypesMonthStatsRetrieveResponse,
  vOrderOrderOrderTypesStatsRetrieveResponse,
} from '@/api/valibot.gen'

import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'

// The requests the two dashboard views put on the wire.
//
// dashboardMixin.loadData() (shared by the dashboard views) reads me/, then -
// depending on the role - the user's own branch or the first branch, then that
// branch's technical and facility documents and the year's monthly purchase
// totals. CompanyDashboard reads the year's dashboard and the four unfiltered
// order stats.
//
// On the network seam, so a query parameter the schema does not declare fails
// the spec. That is how the documents' branch filter was found missing (the
// legacy service replaced it with the type filter) and the dashboard's stray
// `page` found present.

const api = installApiSeam()

const BRANCH_ID = 7

const MixinHost = { name: 'MixinHost', mixins: [dashboardMixin], template: '<div />' }

const gets = () => api.requests().filter((request) => request.method === 'get')

describe('dashboardMixin.loadData', () => {
  beforeEach(() => {
    api.get('/api/member/member/me/', fixtureFor(vMember, { id: 1 }))
    api.get('/api/company/branch-my/', fixtureFor(vBranch, { id: BRANCH_ID, name: 'My Branch' }))
    api.get('/api/company/branch/first/', fixtureFor(vBranch, { id: BRANCH_ID, name: 'First Branch' }))
    api.get('/api/equipment/equipment-document/', ({ query }) =>
      paginated([fixtureFor(vEquipmentDocument, { name: `a ${query.type} document` })]),
    )
    // Months without purchases are absent; March has one.
    api.get('/api/invoice/purchase/year/', [{ month: 3, total: '120.50' }])
  })

  const branchReads = () =>
    gets().filter(({ path }) => path === '/api/member/member/me/' || path.startsWith('/api/company/branch'))

  test('loads me and the first branch when the user is not a branch employee', async () => {
    mountForm(MixinHost, { auth: { isBranchEmployee: false } })
    await settle()

    expect(branchReads()).toEqual([
      { method: 'get', path: '/api/member/member/me/', query: {}, body: undefined },
      { method: 'get', path: '/api/company/branch/first/', query: {}, body: undefined },
    ])
  })

  test('loads me and my own branch when the user is a branch employee', async () => {
    mountForm(MixinHost, { auth: { isBranchEmployee: true } })
    await settle()

    expect(branchReads()).toEqual([
      { method: 'get', path: '/api/member/member/me/', query: {}, body: undefined },
      { method: 'get', path: '/api/company/branch-my/', query: {}, body: undefined },
    ])
  })

  test("reads the branch's documents per equipment type, both filters in one query", async () => {
    const wrapper = mountForm(MixinHost, { auth: { isBranchEmployee: false } })
    await settle()

    expect(gets().filter(({ path }) => path === '/api/equipment/equipment-document/')).toEqual([
      {
        method: 'get',
        path: '/api/equipment/equipment-document/',
        query: { equipment__branch: String(BRANCH_ID), type: 'technical' },
        body: undefined,
      },
      {
        method: 'get',
        path: '/api/equipment/equipment-document/',
        query: { equipment__branch: String(BRANCH_ID), type: 'facility' },
        body: undefined,
      },
    ])
    expect(wrapper.vm.technicalDocuments.map((document) => document.name)).toEqual(['a technical document'])
    expect(wrapper.vm.facilityDocuments.map((document) => document.name)).toEqual(['a facility document'])
  })

  test("charts the year's purchases per month, a month without any as zero", async () => {
    const wrapper = mountForm(MixinHost, { auth: { isBranchEmployee: false } })
    await settle()

    const year = new Date().getFullYear()
    expect(gets().filter(({ path }) => path === '/api/invoice/purchase/year/')).toEqual([
      { method: 'get', path: '/api/invoice/purchase/year/', query: { year: String(year) }, body: undefined },
    ])
    expect(wrapper.vm.chartdataMonthBar.datasets[0].data).toEqual([0, 0, 120.5, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  })
})

describe('CompanyDashboard', () => {
  const DASHBOARD = {
    top_50_customers: [],
    order_status_counts: {},
    order_type_counts: {},
    top_customer_sales_by_profit: [],
    assigned_count: [],
    top_materials_used: [],
    top_material_sales_by_profit: [],
    transactions: {},
  }

  const STATS = [
    ['/api/order/order/order_types_stats/', vOrderOrderOrderTypesStatsRetrieveResponse],
    ['/api/order/order/order_counts_stats/', vOrderOrderOrderCountsStatsRetrieveResponse],
    ['/api/order/order/order_types_month_stats/', vOrderOrderOrderTypesMonthStatsRetrieveResponse],
    ['/api/order/order/counts_year_order_type_stats/', vOrderOrderCountsYearOrderTypeStatsRetrieveResponse],
  ]

  test("loads the year's dashboard, unpaginated, and the four unfiltered stats", async () => {
    api.get('/api/member/member/get_dashboard/', DASHBOARD)
    for (const [path, schema] of STATS) api.get(path, fixtureFor(schema))
    const year = new Date().getFullYear()

    mountForm(CompanyDashboard, { main: { getMemberHasBranches: false } })
    await settle()

    const [dashboard, ...stats] = gets()
    // One dashboard object: no `page`, which the backend ignores.
    expect(dashboard).toEqual({
      method: 'get', path: '/api/member/member/get_dashboard/', query: { year: String(year) }, body: undefined,
    })
    // The four stats go out in parallel, so the order they reach the wire in
    // is not the component's to fix.
    expect(stats.map(({ path, query }) => ({ path, query })).sort((a, b) => a.path.localeCompare(b.path)))
      .toEqual(STATS.map(([path]) => ({ path, query: {} })).sort((a, b) => a.path.localeCompare(b.path)))
  })
})
