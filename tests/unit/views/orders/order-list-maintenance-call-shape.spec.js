import { beforeEach, describe, expect, test, vi } from 'vitest'

import OrderListMaintenance from '@/views/orders/OrderListMaintenance.vue'
import { NEW_DATA_EVENTS, NEW_DATA_EVENTS_TYPES } from '@/constants'
import { useMainStore } from '@/stores/main'

import { mountListView, resetFakeHttp, toastTitles } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Wire characterisation of the maintenance orders list, pinned before the
 * Order Slice replaces it. Every assertion here is about the requests the
 * screen makes and the store writes it performs - nothing about internals.
 *
 * The list URL is chosen by `queryMode`; the query is BaseModel's: `page`
 * always, then `q`, `user_filter`, `order_by` and `since` when set.
 * `order_by` is *always* set - the sort radio defaults to the literal
 * 'default', which the screen copies onto the service unconditionally.
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

// mounted() opens a member websocket; under test it must neither fetch a
// room nor connect. The handler it registers is kept so a test can deliver a
// message through it.
const socket = vi.hoisted(() => ({ handler: null }))
vi.mock('@/services/websocket/MemberNewDataSocket', () => ({
  default: class {
    async init() {}
    setOnmessageHandler(fn) { socket.handler = fn }
    removeOnmessageHandler() { socket.handler = null }
    getSocket() {}
    removeSocket() {}
  },
}))

const ORDERS_PAGE = {
  count: 2,
  num_pages: 1,
  results: [
    { id: 5, order_id: 'O-5', last_status: 'new', assigned_user_info: [] },
    { id: 6, order_id: 'O-6', last_status: 'new', assigned_user_info: [] },
  ],
}

const LIST_URLS = {
  '/order/order/': ORDERS_PAGE,
  '/order/order/all_for_customer_not_accepted/': ORDERS_PAGE,
  '/order/order/dispatch_list_all/': ORDERS_PAGE,
  '/order/order/dispatch_list_inprogress/': ORDERS_PAGE,
  '/order/order/dispatch_list_finished/': ORDERS_PAGE,
  '/order/order/get_within_range/': ORDERS_PAGE,
}

const ROUTES = {
  ...LIST_URLS,
  '/order/filter/simple_list/': [{ id: 7, name: 'Mine' }],
  '/order/order/all_for_customer_not_accepted_count/': { count: 3 },
}

const ROUTE_NAMES = [
  { path: '/orders/not-accepted', name: 'orders-not-accepted', component: { template: '<div />' } },
  { path: '/orders/add', name: 'order-add', component: { template: '<div />' } },
  { path: '/mobile/orders', name: 'mobile-orders', component: { template: '<div />' } },
  { path: '/mobile/dispatch', name: 'mobile-dispatch', component: { template: '<div />' } },
]

const gets = () => requestShapes(fakeHttp, { method: 'get' })
const listRequests = () => gets().filter((r) => r.path in LIST_URLS_API)
const LIST_URLS_API = Object.fromEntries(
  Object.keys(LIST_URLS).map((path) => [`/api${path}`, true]),
)

async function mountList({ props = {}, query = {}, main = {} } = {}) {
  const wrapper = await mountListView(OrderListMaintenance, {
    props,
    query,
    routes: ROUTE_NAMES,
    main: {
      getStatuscodes: [],
      getAssignOrders: [],
      getMemberType: 'maintenance',
      ...main,
    },
  })
  await flush()
  return wrapper
}

// created() awaits four requests in sequence; each microtask turn settles one.
async function flush(turns = 8) {
  for (let i = 0; i < turns; i++) await Promise.resolve()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, ROUTES)
  socket.handler = null
})

describe('OrderListMaintenance - the initial load', () => {
  test('fetches the saved filters, the unaccepted count and the first page, in that order', async () => {
    await mountList()

    expect(gets()).toEqual([
      { method: 'get', path: '/api/order/filter/simple_list/', query: {}, body: undefined },
      { method: 'get', path: '/api/order/order/all_for_customer_not_accepted_count/', query: {}, body: undefined },
      { method: 'get', path: '/api/order/order/', query: { page: '1', order_by: 'default' }, body: undefined },
    ])
  })

  test('writes the unaccepted count to the store', async () => {
    await mountList()

    expect(useMainStore().setUnacceptedCount).toHaveBeenCalledWith(3)
  })

  test('renders the page it was given', async () => {
    const wrapper = await mountList()

    expect(wrapper.vm.orders).toEqual(ORDERS_PAGE.results)
    expect(wrapper.vm.userFilters).toEqual([{ id: 7, name: 'Mine' }])
  })

  test('seeds page, search, sort, since and the saved filter from the route', async () => {
    await mountList({
      query: { page: '3', q: 'roof', order_by: 'last_update', since: '2026-01-01', user_filter: '7' },
    })

    expect(listRequests()).toEqual([
      {
        method: 'get',
        path: '/api/order/order/',
        query: { page: '3', q: 'roof', user_filter: '7', order_by: 'last_update', since: '2026-01-01' },
        body: undefined,
      },
    ])
  })

  test.each([
    ['all', '/api/order/order/'],
    ['unaccepted', '/api/order/order/all_for_customer_not_accepted/'],
    ['dispatch', '/api/order/order/dispatch_list_all/'],
    ['inprogress', '/api/order/order/dispatch_list_inprogress/'],
    ['finished', '/api/order/order/dispatch_list_finished/'],
    ['range', '/api/order/order/get_within_range/'],
  ])('queryMode %s lists from %s', async (queryMode, path) => {
    await mountList({ props: { queryMode } })

    expect(listRequests().map((r) => r.path)).toEqual([path])
  })

  test('a failed page load toasts and leaves the busy flag down', async () => {
    fakeHttp.get.mockImplementation((url) => {
      if (String(url).startsWith('/order/order/?')) return Promise.reject(new Error('boom'))
      return Promise.resolve({ data: [] })
    })

    const wrapper = await mountList()

    expect(toastTitles()).toEqual(['Error'])
    expect(wrapper.vm.isLoading).toBe(false)
  })
})

describe('OrderListMaintenance - narrowing the list', () => {
  test('a search re-lists with q and page 1, and re-fetches the filters and the count', async () => {
    const wrapper = await mountList({ query: { page: '2' } })
    fakeHttp.get.mockClear()

    wrapper.vm.handleSearchOk('gutter')
    await flush()

    expect(gets().map((r) => r.path)).toEqual([
      '/api/order/filter/simple_list/',
      '/api/order/order/all_for_customer_not_accepted_count/',
      '/api/order/order/',
    ])
    expect(listRequests()[0].query).toEqual({ page: '1', q: 'gutter', order_by: 'default' })
  })

  test('the sort modal re-lists with the chosen order and since date', async () => {
    const wrapper = await mountList()
    fakeHttp.get.mockClear()

    wrapper.vm.sortMode = 'last_update'
    wrapper.vm.sinceDate = '2026-03-01'
    wrapper.vm.doSort()
    await flush()

    expect(listRequests()[0].query).toEqual({
      page: '1',
      order_by: 'last_update',
      since: '2026-03-01',
    })
  })

  test('the saved filter comes from the route on every reload, not from component state', async () => {
    const wrapper = await mountList({ query: { user_filter: '7' } })
    fakeHttp.get.mockClear()

    wrapper.vm.handleSearchOk('x')
    await flush()

    expect(listRequests()[0].query).toEqual({ page: '1', q: 'x', user_filter: '7', order_by: 'default' })
  })
})

describe('OrderListMaintenance - deleting', () => {
  test('deletes the chosen order and reloads', async () => {
    const wrapper = await mountList()
    fakeHttp.get.mockClear()

    wrapper.vm.orderPk = 5
    await wrapper.vm.doDelete()
    await flush()

    expect(requestShapes(fakeHttp, { method: 'delete' }).map((r) => r.path)).toEqual([
      '/api/order/order/5/',
    ])
    expect(listRequests()).toHaveLength(1)
    expect(toastTitles()).toEqual(['Deleted'])
  })

  test('a refused delete toasts and does not reload', async () => {
    const wrapper = await mountList()
    fakeHttp.get.mockClear()
    fakeHttp.delete.mockRejectedValueOnce(new Error('403'))

    wrapper.vm.orderPk = 5
    await wrapper.vm.doDelete()
    await flush()

    expect(listRequests()).toHaveLength(0)
    expect(toastTitles()).toEqual(['Error'])
  })
})

describe('OrderListMaintenance - the dispatch selection', () => {
  test('selecting orders writes them to the store, once each', async () => {
    const wrapper = await mountList({ props: { dispatch: true, queryMode: 'dispatch' } })
    const store = useMainStore()

    wrapper.vm.selectOrder(ORDERS_PAGE.results[0])
    wrapper.vm.selectOrder(ORDERS_PAGE.results[0])
    wrapper.vm.selectOrder(ORDERS_PAGE.results[1])

    expect(wrapper.vm.selectedOrders.map((o) => o.id)).toEqual([5, 6])
    expect(store.setAssignOrders).toHaveBeenLastCalledWith(wrapper.vm.selectedOrders)

    wrapper.vm.removeSelectedOrder(0)

    expect(wrapper.vm.selectedOrders.map((o) => o.id)).toEqual([6])
    expect(store.setAssignOrders).toHaveBeenLastCalledWith(wrapper.vm.selectedOrders)
  })

  test('the selection is restored from the store on load', async () => {
    const wrapper = await mountList({
      props: { dispatch: true, queryMode: 'dispatch' },
      main: { getAssignOrders: [ORDERS_PAGE.results[1]] },
    })

    expect(wrapper.vm.selectedOrders.map((o) => o.id)).toEqual([6])
  })

  test('assigning hands the selection to the dispatch screen', async () => {
    const wrapper = await mountList({ props: { dispatch: true, queryMode: 'dispatch' } })
    const push = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue()

    wrapper.vm.selectOrder(ORDERS_PAGE.results[0])
    wrapper.vm.doAssign()

    expect(push).toHaveBeenCalledWith({ name: 'mobile-dispatch', params: { assignModeProp: true } })
  })
})

describe('OrderListMaintenance - the member websocket', () => {
  test('an accepted or rejected order reloads the list', async () => {
    await mountList()
    fakeHttp.get.mockClear()
    expect(socket.handler).toBeTypeOf('function')

    socket.handler({
      type: NEW_DATA_EVENTS.UNACCEPTED_ORDER,
      data_type: NEW_DATA_EVENTS_TYPES.NEW_DATA_ORDER_ACCEPTED,
    })
    await flush()

    expect(listRequests()).toHaveLength(1)
  })

  test('any other message is ignored', async () => {
    await mountList()
    fakeHttp.get.mockClear()

    socket.handler({ type: 'something-else', data_type: NEW_DATA_EVENTS_TYPES.NEW_DATA_ORDER_ACCEPTED })
    await flush()

    expect(listRequests()).toHaveLength(0)
  })

  test('unmounting drops the handler', async () => {
    const wrapper = await mountList()

    wrapper.unmount()
    await flush()

    expect(socket.handler).toBeNull()
  })
})
