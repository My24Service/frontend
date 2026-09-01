import { beforeEach, describe, expect, test, vi } from 'vitest'

import BranchView from '@/views/company/BranchView.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

// Call-shape characterisation for the migrated BranchView call sites:
//   - companyBranchMyRetrieve (GET /api/company/branch-my/) - the branch
//     employee path only; the non-employee path still uses BranchService.detail
//   - the four order-stats wrappers (@/models/orders/order-stats), whose branch
//     filter used to be OrderService.get{OrderTypesStats,MonthsStats,
//     OrderTypesMonthsStats,CountsYearOrdertypeStats}Branch(pk) and is now the
//     generated /api/order/order/<action>/ endpoints with query `branch`.
//
// The view also performs BaseModel CRUD around them (order history list, branch
// detail, location/equipment lists) - those are pinned here only as context, so
// the migrated calls are anchored to their exact position in the request order.

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

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

const BRANCH = {
  id: 7,
  name: 'Branch Amsterdam',
  address: 'Kerkstraat 1',
  postal: '1000 AA',
  city: 'Amsterdam',
  country_code: 'NL',
  tel: '0201234567',
  email: 'branch@example.test',
  contact: 'Jan',
  mobile: '0612345678',
}

const PAGE = { count: 0, results: [] }

const ROUTES = {
  '/order/order/': PAGE,
  '/company/branch/7/': BRANCH,
  '/company/branch-my/': BRANCH,
  '/order/order/order_types_stats/': { order_types_stats: {} },
  '/order/order/order_counts_stats/': { order_counts_stats: {} },
  '/order/order/order_types_month_stats/': { order_types_month_stats: {} },
  '/order/order/counts_year_order_type_stats/': { counts_year_order_type_stats: {} },
  '/equipment/location/': PAGE,
  '/equipment/equipment/': PAGE,
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, ROUTES)
})

describe('BranchView - non-branch-employee', () => {
  test('loads branch detail, then the four stats with branch=<pk>', async () => {
    mountForm(BranchView, { props: { pk: '7' }, auth: { isBranchEmployee: false } })
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalledTimes(8))

    // The view converts the string route param with Number() before handing it
    // to the stats wrappers; the wire query is the same `branch=7` the legacy
    // getOrderTypesStatsBranch(this.pk) produced for a numeric pk.
    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/order/order/', query: { branch: '7', page: '1' }, body: undefined },
      { method: 'get', path: '/api/company/branch/7/', query: {}, body: undefined },
      { method: 'get', path: '/api/order/order/order_types_stats/', query: { branch: '7' }, body: undefined },
      { method: 'get', path: '/api/order/order/order_counts_stats/', query: { branch: '7' }, body: undefined },
      { method: 'get', path: '/api/order/order/order_types_month_stats/', query: { branch: '7' }, body: undefined },
      { method: 'get', path: '/api/order/order/counts_year_order_type_stats/', query: { branch: '7' }, body: undefined },
      { method: 'get', path: '/api/equipment/location/', query: { branch: '7', page: '1' }, body: undefined },
      { method: 'get', path: '/api/equipment/equipment/', query: { branch: '7', page: '1' }, body: undefined },
    ])
  })
})

describe('BranchView - branch employee', () => {
  test('loads branch-my and the four stats with branch=<branchEmployeeBranch>', async () => {
    mountForm(BranchView, {
      props: {},
      auth: { isBranchEmployee: true, branchEmployeeBranch: 3 },
    })
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalledTimes(8))

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/order/order/', query: { page: '1' }, body: undefined },
      { method: 'get', path: '/api/company/branch-my/', query: {}, body: undefined },
      { method: 'get', path: '/api/order/order/order_types_stats/', query: { branch: '3' }, body: undefined },
      { method: 'get', path: '/api/order/order/order_counts_stats/', query: { branch: '3' }, body: undefined },
      { method: 'get', path: '/api/order/order/order_types_month_stats/', query: { branch: '3' }, body: undefined },
      { method: 'get', path: '/api/order/order/counts_year_order_type_stats/', query: { branch: '3' }, body: undefined },
      { method: 'get', path: '/api/equipment/location/', query: { page: '1' }, body: undefined },
      { method: 'get', path: '/api/equipment/equipment/', query: { page: '1' }, body: undefined },
    ])
  })
})
