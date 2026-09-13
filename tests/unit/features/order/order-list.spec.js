import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { OrderList } from '@/features/order'
import { vOrderStatus, vPaginatedOrderDispatchList, vPaginatedOrderList } from '@/api/valibot.gen'
import { NEW_DATA_EVENTS, NEW_DATA_EVENTS_TYPES } from '@/constants'
import { useMainStore } from '@/stores/main'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toasts } from '../../support/form-harness.js'
import { orderRoutes } from '../../support/order-routes.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

// The list subscribes to the member websocket while mounted; under test it
// must neither fetch a room nor connect. The registered handler is kept so a
// test can deliver a message through it.
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

const api = installApiSeam()

const ITEM = itemSchemaOf(vPaginatedOrderList)
const DISPATCH_ITEM = itemSchemaOf(vPaginatedOrderDispatchList)

const STATUSCODES = [
  { id: 1, statuscode: 'new', color: '#00ff00' },
  { id: 2, statuscode: 'done', color: 'ff0000' },
]

function seedUrl(queryString) {
  window.history.replaceState(null, '', `/#/?${queryString}`)
}

function resetUrl() {
  window.history.replaceState(null, '', '/')
}

function orderRow(overrides = {}, schema = ITEM) {
  return fixtureFor(schema, {
    id: 5,
    order_id: '2026-0005',
    order_reference: 'REF-5',
    order_name: 'Acme BV',
    order_type: 'maintenance',
    start_date: '2026-03-02',
    start_time: '09:00:00',
    last_status: 'new',
    last_status_full: 'new',
    assigned_user_info: [{ user_id: 9, full_name: 'Piet Post', license_plate: 'AB-12-CD' }],
    ...overrides,
  })
}

function orderPage({ count = 45, schema = ITEM } = {}) {
  return paginated(
    [
      orderRow({}, schema),
      orderRow({
        id: 6,
        order_id: '2026-0006',
        order_reference: null,
        order_name: 'Bakker & Zn',
        order_type: 'repair',
        start_time: null,
        last_status: 'done left keys',
        assigned_user_info: [],
      }, schema),
    ],
    { count },
  )
}

const dispatchPage = () => orderPage({ schema: DISPATCH_ITEM })

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

function pill(wrapper, text) {
  const link = wrapper.findAll('.subnav-pills a').find((a) => a.text() === text)
  if (!link) throw new Error(`no pill '${text}'`)
  return link
}

const listRequests = (path = '/api/order/order/') => api.requests().filter((r) => r.path === path)

async function mountList({ props = {}, main = {}, auth = {} } = {}) {
  const wrapper = await mountListView(OrderList, {
    props,
    deep: true,
    routes: orderRoutes,
    main: {
      getStatuscodes: STATUSCODES,
      getOrderTypes: ['maintenance', 'repair'],
      getOrderListMustIncludeReference: true,
      getAssignOrders: [],
      ...main,
    },
    auth,
  })
  await settle()
  return wrapper
}

beforeEach(() => {
  resetUrl()
  socket.handler = null
  api.get('/api/order/order/', orderPage())
  api.get('/api/order/order/all_for_customer_not_accepted/', orderPage({ count: 1 }))
  api.get('/api/order/order/dispatch_list_all/', dispatchPage())
  api.get('/api/order/order/dispatch_list_inprogress/', dispatchPage())
  api.get('/api/order/order/dispatch_list_finished/', dispatchPage())
  api.get('/api/order/order/all_for_customer_not_accepted_count/', { count: 3 })
  api.get('/api/order/filter/simple_list/', [{ id: 7, name: 'Mine' }])
  api.delete('/api/order/order/{id}/', noContent)
  api.post('/api/order/status/', fixtureFor(vOrderStatus, { id: 1, order: 5, status: 'done' }))
})

afterEach(() => {
  resetUrl()
})

describe('OrderList, wire contract', () => {
  test('the initial load sends the page and the page size, and nothing else', async () => {
    await mountList()

    expect(listRequests()).toHaveLength(1)
    expect(listRequests()[0]).toMatchObject({
      path: '/api/order/order/',
      query: { page: '1', page_size: '20' },
    })
  })

  test('reads the saved filters and the unaccepted count beside the page', async () => {
    await mountList()

    const paths = api.requests().map((r) => r.path)
    expect(paths).toContain('/api/order/filter/simple_list/')
    expect(paths).toContain('/api/order/order/all_for_customer_not_accepted_count/')
  })

  test('writes the unaccepted count to the store', async () => {
    await mountList()

    expect(useMainStore().setUnacceptedCount).toHaveBeenCalledWith(3)
  })

  test('shows a row for every order the backend returned, linked to the detail page', async () => {
    const wrapper = await mountList()

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('#2026-0005 / REF-5')
    expect(rows[0].text()).toContain('Acme BV')
    expect(rows[0].text()).toContain('Piet Post (AB-12-CD)')
    expect(rows[1].text()).toContain('#2026-0006')
    expect(rows[1].text()).not.toContain('/')

    const hrefs = wrapper.findAll('tbody a').map((link) => link.attributes('href'))
    expect(hrefs).toContain('/orders/orders/view/5')
    expect(hrefs).toContain('/orders/orders/view/6')
  })

  test('leaves the reference off when the tenant does not show it', async () => {
    const wrapper = await mountList({ main: { getOrderListMustIncludeReference: false } })

    expect(wrapper.findAll('tbody tr')[0].text()).not.toContain('REF-5')
  })

  test.each([
    ['unaccepted', '/api/order/order/all_for_customer_not_accepted/'],
    ['dispatch', '/api/order/order/dispatch_list_all/'],
    ['inprogress', '/api/order/order/dispatch_list_inprogress/'],
    ['finished', '/api/order/order/dispatch_list_finished/'],
  ])('queryMode %s lists from %s', async (queryMode, path) => {
    await mountList({ props: { queryMode } })

    expect(listRequests()).toHaveLength(0)
    expect(listRequests(path)).toHaveLength(1)
    expect(listRequests(path)[0].query).toEqual({ page: '1', page_size: '20' })
  })

  test('an unknown queryMode falls back to the plain list', async () => {
    await mountList({ props: { queryMode: 'range' } })

    expect(listRequests()).toHaveLength(1)
  })
})

describe('OrderList sorting', () => {
  test('a header click sorts the wire with the ordering list', async () => {
    const wrapper = await mountList()

    await wrapper.get('th[aria-label="Sort by order_name"]').trigger('click')
    await settle()

    expect(listRequests().at(-1).query).toEqual({ page: '1', page_size: '20', ordering: 'order_name' })
    expect(window.location.hash).toContain('ordering=order_name')
  })

  test('the status column does not sort', async () => {
    const wrapper = await mountList()

    expect(wrapper.find('th[aria-label="Sort by last_status"]').exists()).toBe(false)
  })

  test('the dispatch lists offer no sort, because their actions take no ordering yet', async () => {
    const wrapper = await mountList({ props: { queryMode: 'dispatch', dispatch: true } })

    expect(wrapper.findAll('th.sortable-header')).toHaveLength(0)
  })
})

describe('OrderList column filters', () => {
  test('typing in the company filter narrows on the wire under its bare name', async () => {
    const wrapper = await mountList()

    await wrapper.get('input[aria-label="Filter order_name"]').setValue('acme')
    await pastDebounce()

    expect(listRequests().at(-1).query).toMatchObject({ page: '1', order_name: 'acme' })
    expect(window.location.hash).toContain('order_name=acme')
  })

  test('the type filter is a select over the tenant\'s order types', async () => {
    const wrapper = await mountList()
    const select = wrapper.get('select[aria-label="Filter order_type"]')

    expect(select.findAll('option').map((o) => o.attributes('value'))).toEqual(['', 'maintenance', 'repair'])

    await select.setValue('repair')
    await pastDebounce()

    expect(listRequests().at(-1).query).toMatchObject({ order_type: 'repair' })
  })

  test('the status filter is a select over the statuscodes', async () => {
    const wrapper = await mountList()
    const select = wrapper.get('select[aria-label="Filter last_status"]')

    expect(select.findAll('option').map((o) => o.attributes('value'))).toEqual(['', 'new', 'done'])

    await select.setValue('done')
    await pastDebounce()

    expect(listRequests().at(-1).query).toMatchObject({ last_status: 'done' })
  })

  test('a shared URL restores the filters before the first request', async () => {
    seedUrl('order_name=acme&order_type=repair&page=2')

    await mountList()

    expect(listRequests()).toHaveLength(1)
    expect(listRequests()[0].query).toEqual({ page: '2', page_size: '20', order_name: 'acme', order_type: 'repair' })
  })
})

describe('OrderList saved filters', () => {
  test('shows a pill per saved filter; picking one rides the wire as user_filter and the address bar', async () => {
    const wrapper = await mountList()

    await pill(wrapper, 'Mine').trigger('click')
    await pastDebounce()

    expect(listRequests().at(-1).query).toMatchObject({ page: '1', user_filter: '7' })
    expect(window.location.hash).toContain('user_filter=7')
  })

  test('picking the active pill again clears it', async () => {
    seedUrl('user_filter=7')
    const wrapper = await mountList()
    expect(listRequests()[0].query).toMatchObject({ user_filter: '7' })

    await pill(wrapper, 'Mine').trigger('click')
    await pastDebounce()

    expect(listRequests().at(-1).query).toEqual({ page: '1', page_size: '20' })
    expect(window.location.hash).not.toContain('user_filter')
  })

  test('the not-accepted list drops a saved filter its action does not take', async () => {
    seedUrl('user_filter=7')

    await mountList({ props: { queryMode: 'unaccepted' } })

    expect(listRequests('/api/order/order/all_for_customer_not_accepted/')[0].query).toEqual({ page: '1', page_size: '20' })
  })
})

describe('OrderList status change', () => {
  test('picking another status posts it for the order and refetches the page', async () => {
    const wrapper = await mountList()
    const before = listRequests().length

    await wrapper.get('select#5-change-status').setValue('done')
    await settle()

    expect(api.requests().filter((r) => r.method === 'post').at(-1)).toMatchObject({
      path: '/api/order/status/',
      body: { order: 5, status: 'done' },
    })
    expect(listRequests().length).toBe(before + 1)
  })

  test('the status select is coloured by the code the status names', async () => {
    const wrapper = await mountList()

    const cells = wrapper.findAll('span.status')
    expect(cells[0].attributes('style')).toContain('--status-color: #00ff00')
    // 'done left keys' names the `done` code; a bare hex gains its '#'
    expect(cells[1].attributes('style')).toContain('--status-color: #ff0000')
  })
})

describe('OrderList deleting', () => {
  test('the delete icon opens the modal; confirming deletes and refetches', async () => {
    const wrapper = await mountList()
    const before = listRequests().length

    await wrapper.findAll('tbody tr')[0].get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-order-modal').ok()
    await settle()

    expect(api.requests().filter((r) => r.method === 'delete').map((r) => r.path)).toEqual(['/api/order/order/5/'])
    expect(listRequests().length).toBe(before + 1)
    expect(toasts().map((t) => t.title)).toContain('Deleted')
  })

  test('a customer user gets no delete icon', async () => {
    const wrapper = await mountList({ auth: { isCustomer: true } })

    expect(wrapper.find('button[title="Delete"]').exists()).toBe(false)
  })
})

describe('OrderList dispatch selection', () => {
  test('the assign icon collects the order, once, and hands the selection to the store', async () => {
    const wrapper = await mountList({ props: { queryMode: 'dispatch', dispatch: true } })
    const store = useMainStore()

    const assign = () => wrapper.findAll('tbody tr')[0].get('button[title="Assign"]')
    await assign().trigger('click')
    await assign().trigger('click')
    await settle()

    expect(wrapper.text()).toContain('Selected orders (1)')
    expect(store.setAssignOrders).toHaveBeenLastCalledWith([{ id: 5, order_id: '2026-0005' }])
  })

  test('the selection is restored from the store', async () => {
    const wrapper = await mountList({
      props: { queryMode: 'dispatch', dispatch: true },
      main: { getAssignOrders: [{ id: 6, order_id: '2026-0006' }] },
    })

    expect(wrapper.text()).toContain('Selected orders (1)')
    expect(wrapper.text()).toContain('2026-0006')
  })

  test('a plain list has no assign icons', async () => {
    const wrapper = await mountList()

    expect(wrapper.find('button[title="Assign"]').exists()).toBe(false)
  })
})

describe('OrderList live updates', () => {
  test('an accepted or rejected order refetches the page and the count', async () => {
    await mountList()
    expect(socket.handler).toBeTypeOf('function')
    const before = listRequests().length
    const countsBefore = listRequests('/api/order/order/all_for_customer_not_accepted_count/').length

    socket.handler({
      type: NEW_DATA_EVENTS.UNACCEPTED_ORDER,
      data_type: NEW_DATA_EVENTS_TYPES.NEW_DATA_ORDER_REJECTED,
    })
    await settle()

    expect(listRequests().length).toBe(before + 1)
    expect(listRequests('/api/order/order/all_for_customer_not_accepted_count/').length).toBe(countsBefore + 1)
  })

  test('any other message is ignored', async () => {
    await mountList()
    const before = listRequests().length

    socket.handler({ type: 'dispatch', data_type: NEW_DATA_EVENTS_TYPES.NEW_DATA_ORDER_REJECTED })
    await settle()

    expect(listRequests().length).toBe(before)
  })

  test('unmounting drops the handler', async () => {
    const wrapper = await mountList()

    wrapper.unmount()
    await settle()

    expect(socket.handler).toBeNull()
  })
})
