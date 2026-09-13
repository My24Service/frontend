import { beforeEach, describe, expect, test, vi } from 'vitest'

import OrderListTemps from '@/views/orders/OrderListTemps.vue'

import { mountListView, resetFakeHttp, toastTitles } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Wire characterisation of the temps orders list. It shares the list
 * request with the maintenance variant but fetches neither the saved
 * filters nor the unaccepted count, opens no websocket, and is the only
 * place the list's change-status modal is still reachable.
 */

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

const ORDERS_PAGE = {
  count: 1,
  num_pages: 1,
  results: [{ id: 5, order_id: 'O-5', last_status: 'new', assigned_user_info: [] }],
}

const ROUTES = {
  '/order/order/': ORDERS_PAGE,
  '/order/order/dispatch_list_all/': ORDERS_PAGE,
}

const ROUTE_NAMES = [
  { path: '/orders/add', name: 'order-add', component: { template: '<div />' } },
  { path: '/orders/edit/:pk', name: 'order-edit', component: { template: '<div />' } },
  { path: '/orders/docs/:orderPk', name: 'order-documents', component: { template: '<div />' } },
]

const gets = () => requestShapes(fakeHttp, { method: 'get' })

async function mountList({ props = {}, query = {}, main = {} } = {}) {
  const wrapper = await mountListView(OrderListTemps, {
    props,
    query,
    routes: ROUTE_NAMES,
    // the search modal's imperative hide() is what handleSearchOk calls first
    stubs: { SearchModal: { template: '<div />', methods: { hide() {} } } },
    main: {
      getStatuscodes: [{ statuscode: 'new' }, { statuscode: 'done' }],
      getAssignOrders: [],
      getMemberType: 'temps',
      ...main,
    },
  })
  await flush()
  return wrapper
}

async function flush(turns = 6) {
  for (let i = 0; i < turns; i++) await Promise.resolve()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, ROUTES)
})

describe('OrderListTemps - the initial load', () => {
  test('makes exactly one request: the first page', async () => {
    await mountList()

    expect(gets()).toEqual([
      { method: 'get', path: '/api/order/order/', query: { page: '1', order_by: 'default' }, body: undefined },
    ])
  })

  test('seeds page, search, sort and since from the route', async () => {
    await mountList({ query: { page: '2', q: 'roof', order_by: '-start_date', since: '2026-01-01' } })

    expect(gets()[0].query).toEqual({ page: '2', q: 'roof', order_by: '-start_date', since: '2026-01-01' })
  })

  test('queryMode picks the list url', async () => {
    await mountList({ props: { dispatch: true, queryMode: 'dispatch' } })

    expect(gets().map((r) => r.path)).toEqual(['/api/order/order/dispatch_list_all/'])
  })
})

describe('OrderListTemps - narrowing the list', () => {
  test('a search re-lists with q and page 1', async () => {
    const wrapper = await mountList({ query: { page: '2' } })
    fakeHttp.get.mockClear()

    wrapper.vm.handleSearchOk('gutter')
    await flush()

    expect(gets()).toHaveLength(1)
    expect(gets()[0].query).toEqual({ page: '1', q: 'gutter', order_by: 'default' })
  })

  test('the sort modal re-lists with the chosen order and since date', async () => {
    const wrapper = await mountList()
    fakeHttp.get.mockClear()

    wrapper.vm.sortMode = '-start_date'
    wrapper.vm.sinceDate = '2026-03-01'
    wrapper.vm.doSort()
    await flush()

    expect(gets()[0].query).toEqual({ page: '1', order_by: '-start_date', since: '2026-03-01' })
  })
})

describe('OrderListTemps - the change-status modal', () => {
  test('posts the status with the extra text appended and reloads', async () => {
    const wrapper = await mountList()
    fakeHttp.get.mockClear()

    wrapper.vm.orderPk = 5
    wrapper.vm.status = { statuscode: 'done', extra_text: 'left keys' }
    await wrapper.vm.changeStatus()
    await flush()

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([
      {
        method: 'post',
        path: '/api/order/status/',
        query: {},
        body: { order: 5, status: 'done left keys' },
      },
    ])
    expect(gets()).toHaveLength(1)
    expect(toastTitles()).toEqual(['Created'])
  })

  test('posts the bare code when there is no extra text', async () => {
    const wrapper = await mountList()

    wrapper.vm.orderPk = 5
    wrapper.vm.status = { statuscode: 'done', extra_text: '' }
    await wrapper.vm.changeStatus()

    expect(requestShapes(fakeHttp, { method: 'post' })[0].body).toEqual({ order: 5, status: 'done' })
  })
})

describe('OrderListTemps - deleting', () => {
  test('deletes the chosen order and reloads', async () => {
    const wrapper = await mountList()
    fakeHttp.get.mockClear()

    wrapper.vm.orderPk = 5
    await wrapper.vm.doDelete()
    await flush()

    expect(requestShapes(fakeHttp, { method: 'delete' }).map((r) => r.path)).toEqual(['/api/order/order/5/'])
    expect(gets()).toHaveLength(1)
    expect(toastTitles()).toEqual(['Deleted'])
  })
})
