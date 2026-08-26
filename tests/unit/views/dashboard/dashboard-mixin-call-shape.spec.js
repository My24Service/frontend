import { beforeEach, describe, expect, test, vi } from 'vitest'

import dashboardMixin from '@/views/dashboard/dashboard_view/dashboardMixin'
import DashboardView from '@/views/company/Dashboard.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

// Call-shape characterisation for the migrated call sites in the two dashboard
// views assigned to this cluster.
//
// dashboardMixin.loadData() (shared by DashboardDefault/DashboardShltr) used
// to call MemberService.getMe() (GET `/member/member/me/`), and - depending on
// the role - BranchService.getMyBranch() (GET `/company/branch-my/`) or
// BranchService.first() (GET `/company/branch/first/`). It now calls the
// generated memberMemberMeRetrieve, companyBranchMyRetrieve and
// companyBranchFirstRetrieve; all three URLs are unchanged, no query, no body.
// The surrounding document/purchase-invoice loads are BaseModel CRUD and are
// only seeded so the flow reaches the migrated calls.
//
// Dashboard.vue (company) replaced OrderService.get{OrderTypesStats,MonthsStats,
// OrderTypesMonthsStats,CountsYearOrdertypeStats}Branch() - all four unfiltered
// GETs on `/order/order/<action>/` - with the four @/models/orders/order-stats
// wrappers called without a filter; the generated endpoints keep the same URLs
// and send no query. The dashboard list() call before them is BaseModel CRUD.

const fakeHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/services/api', () => ({ default: fakeHttp, normalClient: fakeHttp }))

vi.mock('@/api/client.gen', async () => {
  const { apiClientMock } = await import('../../support/api-client-mock.js')
  return apiClientMock(fakeHttp)
})

const MIXIN_ROUTES = {
  '/member/member/me/': { pk: 1, username: 'engineer' },
  '/company/branch-my/': { id: 7, name: 'My Branch' },
  '/company/branch/first/': { id: 7, name: 'First Branch' },
  // BaseModel CRUD around the migrated calls; page-shaped so loadCollection()
  // can map over .results.
  '/equipment/equipment-document/': { count: 0, results: [] },
}

const MixinHost = { name: 'MixinHost', mixins: [dashboardMixin], template: '<div />' }

beforeEach(() => {
  resetFakeHttp(fakeHttp, MIXIN_ROUTES)
})

describe('dashboardMixin.loadData', () => {
  test('loads me and the first branch when the user is not a branch employee', async () => {
    mountForm(MixinHost, { auth: { isBranchEmployee: false } })
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalledTimes(5))

    // me/ and branch/first/ are the migrated calls; the two document loads and
    // the purchase-invoice year overview are BaseModel CRUD around them.
    expect(
      requestShapes(fakeHttp, { method: 'get' }).filter(
        ({ path }) => path === '/api/member/member/me/' || path.startsWith('/api/company/branch'),
      ),
    ).toEqual([
      { method: 'get', path: '/api/member/member/me/', query: {}, body: undefined },
      { method: 'get', path: '/api/company/branch/first/', query: {}, body: undefined },
    ])
  })

  test('loads me and my own branch when the user is a branch employee', async () => {
    mountForm(MixinHost, { auth: { isBranchEmployee: true } })
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalledTimes(5))

    expect(
      requestShapes(fakeHttp, { method: 'get' }).filter(
        ({ path }) => path === '/api/member/member/me/' || path.startsWith('/api/company/branch'),
      ),
    ).toEqual([
      { method: 'get', path: '/api/member/member/me/', query: {}, body: undefined },
      { method: 'get', path: '/api/company/branch-my/', query: {}, body: undefined },
    ])
  })
})

describe('Dashboard (company)', () => {
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

  const ROUTES = {
    '/member/member/get_dashboard/': DASHBOARD,
    '/order/order/order_types_stats/': { order_types_stats: {} },
    '/order/order/order_counts_stats/': { order_counts_stats: {} },
    '/order/order/order_types_month_stats/': { order_types_month_stats: {} },
    '/order/order/counts_year_order_type_stats/': { counts_year_order_type_stats: {} },
  }

  test('loads the dashboard list and the four unfiltered stats', async () => {
    resetFakeHttp(fakeHttp, ROUTES)
    const year = new Date().getFullYear()

    mountForm(DashboardView, { main: { getMemberHasBranches: false } })
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalledTimes(5))

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      {
        method: 'get',
        path: '/api/member/member/get_dashboard/',
        // BaseModel.list() appends its pagination to the query.
        query: { year: String(year), page: '1' },
        body: undefined,
      },
      {
        method: 'get',
        path: '/api/order/order/order_types_stats/',
        query: {},
        body: undefined,
      },
      {
        method: 'get',
        path: '/api/order/order/order_counts_stats/',
        query: {},
        body: undefined,
      },
      {
        method: 'get',
        path: '/api/order/order/order_types_month_stats/',
        query: {},
        body: undefined,
      },
      {
        method: 'get',
        path: '/api/order/order/counts_year_order_type_stats/',
        query: {},
        body: undefined,
      },
    ])
  })
})
