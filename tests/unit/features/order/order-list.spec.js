import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { OrderList } from '@/features/order'
import { vOrderStatus, vPaginatedOrderList } from '@/api/valibot.gen'
import { NEW_DATA_EVENTS, NEW_DATA_EVENTS_TYPES } from '@/constants'
import { useMainStore } from '@/stores/main'

import { flushPromises } from '@vue/test-utils'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toasts } from '../../support/form-harness.js'
import { orderRoutes } from '../../support/order-routes.js'
import { modal } from '../../support/modal.js'
import { addFilter, chipTexts, editorInput, offeredFilters, pickMode } from '../../support/column-filters.js'

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
    statuscode_id: 1,
    color: '#00ff00',
    text_color: '#003300',
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
        statuscode_id: 2,
        color: '#ff0000',
        text_color: '#550000',
        assigned_user_info: [],
      }, schema),
    ],
    { count },
  )
}

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

/** Pick a view from the header's dropdown: the control the pills were replaced by. */
async function pickView(wrapper, label) {
  await wrapper.get('.order-view-dropdown .dropdown-toggle').trigger('click')
  await flushPromises()
  const items = wrapper.findAll('.order-view-dropdown .dropdown-item')
  const item = items.find((candidate) => candidate.text() === label)
  if (!item) throw new Error(`no view '${label}'; it offers ${JSON.stringify(items.map((candidate) => candidate.text()))}`)
  await item.trigger('click')
  await pastDebounce()
}

const listRequests = (path = '/api/order/order/') => api.requests().filter((r) => r.path === path)

/** A customer or branch autocomplete row: the address block every owner picker shows. */
function ownerRow(overrides) {
  return {
    address: 'Main 1', postal: '1234AB', city: 'Gouda', country_code: 'NL', contact: '', tel: '', mobile: '', email: '',
    value: overrides.name, remarks: null, products_without_tax: false, branch_id: null,
    ...overrides,
  }
}

async function mountList({ props = {}, main = {}, auth = {} } = {}) {
  const wrapper = await mountListView(OrderList, {
    props,
    deep: true,
    routes: orderRoutes,
    // The column filters open in a popover whose close rides the real
    // transition — see support/column-filters.js.
    stubs: { transition: false },
    main: {
      getMemberType: 'maintenance', getFlavour: 'maintenance',
      getStatuscodes: STATUSCODES,
      getOrderTypes: ['maintenance', 'repair'],
      getOrderListMustIncludeReference: true,
      getAssignOrders: [],
      // Read for the company filter's shape; the real getter reads through
      // a null memberInfo on a testing pinia.
      getMemberHasBranches: false,
      ...main,
    },
    auth,
  })
  await settle()
  // The store owns the dispatch pick, so its action has to actually run. The
  // testing pinia stubs actions, which would leave the getter frozen and make
  // every selection assertion measure the stub instead of the store.
  const store = useMainStore()
  store.setAssignOrders.mockImplementation((orders) => { store.getAssignOrders = orders })
  return wrapper
}

beforeEach(() => {
  resetUrl()
  socket.handler = null
  // Every list mode rides `?mode=` on the one list endpoint, so one mock
  // serves them all; rows are OrderSerializer rows in every mode.
  api.get('/api/order/order/', orderPage())
  api.get('/api/order/order/all_for_customer_not_accepted_count/', { count: 3 })
  api.get('/api/order/filter/simple_list/', [{ id: 7, name: 'Mine' }])
  api.get('/api/order/filter/get_statuses/', ['aangemaakt', 'done left keys', 'new'])
  // The company filter's picks: the owner autocompletes the order form uses.
  api.get('/api/customer/customer/autocomplete/', [
    ownerRow({ id: 5, name: 'Acme BV', customer_id: '5013' }),
    ownerRow({ id: 6, name: 'Beta BV', customer_id: '5014' }),
  ])
  api.get('/api/company/branch/autocomplete/', [ownerRow({ id: 31, name: 'North' }), ownerRow({ id: 32, name: 'South' })])
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
    ['unaccepted', { page: '1', page_size: '20', mode: 'unaccepted' }],
    ['dispatch', { page: '1', page_size: '20', mode: 'dispatch' }],
    ['inprogress', { page: '1', page_size: '20', mode: 'inprogress' }],
    ['finished', { page: '1', page_size: '20', mode: 'finished' }],
  ])('queryMode %s lists from /api/order/order/ with ?mode=', async (queryMode, query) => {
    await mountList({ props: { queryMode } })

    expect(listRequests()).toHaveLength(1)
    expect(listRequests()[0].query).toEqual(query)
  })

  test('an unknown queryMode falls back to the plain list', async () => {
    await mountList({ props: { queryMode: 'range' } })

    expect(listRequests()).toHaveLength(1)
  })
})

describe('OrderList on a temps tenant', () => {
  test('the people column counts heads against the required number instead of naming them', async () => {
    api.get('/api/order/order/', paginated([
      orderRow({ id: 5, assigned_count: 3, required_users: 5, required_assigned: 'Piet, Klaas, Jan' }),
      orderRow({ id: 6, order_id: '2026-0006', assigned_count: 1, required_users: 1, required_assigned: 'Piet' }),
      orderRow({ id: 7, order_id: '2026-0007', assigned_count: 0, required_users: 2, required_assigned: '' }),
    ]))
    const wrapper = await mountList({ main: { getMemberType: 'temps', getFlavour: 'temps' } })

    const people = wrapper.findAll('tbody tr').map((row) => row.findAll('td')[3].text())
    expect(people).toEqual(['Assigned to 3 / 5 people', 'Assigned to 1 person', '–'])
    expect(wrapper.text()).not.toContain('Piet Post')
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

  test('the dispatch lists sort too, with the same ordering list', async () => {
    const wrapper = await mountList({ props: { queryMode: 'dispatch', dispatch: true } })

    await wrapper.get('th[aria-label="Sort by order_name"]').trigger('click')
    await settle()

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/order/order/',
      query: { mode: 'dispatch', ordering: 'order_name' },
    })
  })
})

describe('OrderList column filters', () => {
  test('the bar offers the five filterable columns under their own labels', async () => {
    const wrapper = await mountList()

    expect(wrapper.find('tr.filter-row').exists()).toBe(false)
    expect(await offeredFilters(wrapper)).toEqual(['Order ID', 'Customer', 'Type', 'Status', 'Start date'])
  })

  test('the company column filters on the customer it points at, picked from the autocomplete', async () => {
    const wrapper = await mountList()

    await addFilter(wrapper, 'Customer')
    await flushPromises()
    // The first page of the list: the autocomplete asked with an empty term.
    expect(api.requests()).toContainEqual({ method: 'get', path: '/api/customer/customer/autocomplete/', query: { q: '' } })
    const options = () => wrapper.findAll('.column-filter-popover [role="option"]')
    expect(options().map((option) => option.text())).toEqual(['Acme BV', 'Beta BV'])

    await options()[1].trigger('click')
    await pastDebounce()

    // The key rides the wire, not the name the column shows.
    const query = listRequests().at(-1).query
    expect(query).toMatchObject({ page: '1', customer_relation: '6' })
    expect(query).not.toHaveProperty('order_name')
    expect(chipTexts(wrapper)).toEqual(['Customer: Beta BV'])
    expect(window.location.hash).toContain('customer_relation=6')

    await editorInput(wrapper, 'order_name').setValue('ac')
    await pastDebounce()
    expect(api.requests().at(-1)).toMatchObject({ path: '/api/customer/customer/autocomplete/', query: { q: 'ac' } })
  })

  test('on a tenant with branches the company column is a pick from the branches', async () => {
    const wrapper = await mountList({ main: { getMemberHasBranches: true } })

    expect(await offeredFilters(wrapper)).toContain('Branch')
    await addFilter(wrapper, 'Branch')
    await flushPromises()
    const options = wrapper.findAll('.column-filter-popover [role="option"]')
    expect(options.map((option) => option.text())).toEqual(['North', 'South'])

    await options[0].trigger('click')
    await pastDebounce()

    expect(listRequests().at(-1).query).toMatchObject({ branch: '31' })
    expect(chipTexts(wrapper)).toEqual(['Branch: North'])
  })

  test('a restored customer id is named on its chip through the autocomplete', async () => {
    seedUrl('customer_relation=5,6')

    const wrapper = await mountList()
    await flushPromises()

    expect(api.requests()).toContainEqual({
      method: 'get', path: '/api/customer/customer/autocomplete/', query: { id: '5,6' },
    })
    expect(chipTexts(wrapper)).toEqual(['Customer: Acme BV, Beta BV'])
    expect(listRequests()[0].query).toMatchObject({ customer_relation: '5,6' })
  })

  test('the start-date filter rides the wire under its bare name, in the shared period grammar', async () => {
    vi.useFakeTimers({ now: new Date(2026, 2, 15), toFake: ['Date'] })
    try {
      const wrapper = await mountList()

      await addFilter(wrapper, 'Start date')
      await pickMode(wrapper, 'Month')
      const thisMonth = wrapper.findAll('.column-filter-popover .filter-date-preset').find((button) => button.text() === 'This month')
      await thisMonth.trigger('click')
      await pastDebounce()

      expect(listRequests().at(-1).query).toMatchObject({ page: '1', start_date: '2026-03' })
      expect(window.location.hash).toContain('start_date=2026-03')
      expect(chipTexts(wrapper)).toEqual(['Start date: 03/2026'])
    } finally {
      vi.useRealTimers()
    }
  })

  test('the type filter picks any of the tenant\'s order types', async () => {
    const wrapper = await mountList()

    await addFilter(wrapper, 'Type')
    const options = wrapper.findAll('.column-filter-popover [role="option"]')
    expect(options.map((option) => option.text())).toEqual(['maintenance', 'repair'])

    await options[1].trigger('click')
    await pastDebounce()
    expect(listRequests().at(-1).query).toMatchObject({ order_type: 'repair' })
    expect(chipTexts(wrapper)).toEqual(['Type: repair'])

    await options[0].trigger('click')
    await pastDebounce()
    expect(listRequests().at(-1).query).toMatchObject({ order_type: 'repair,maintenance' })
    expect(chipTexts(wrapper)).toEqual(['Type: repair, maintenance'])
  })

  test('the status filter is a pick from every status on record, not the configured codes', async () => {
    const wrapper = await mountList()

    expect(api.requests()).toContainEqual({ method: 'get', path: '/api/order/filter/get_statuses/', query: {} })
    await addFilter(wrapper, 'Status')
    const options = wrapper.findAll('.column-filter-popover [role="option"]')
    expect(options.map((option) => option.text())).toEqual(['aangemaakt', 'done left keys', 'new'])

    await options[1].trigger('click')
    await pastDebounce()

    expect(listRequests().at(-1).query).toMatchObject({ last_status: 'done left keys' })
  })

  test('a shared URL restores the filters before the first request, as chips', async () => {
    seedUrl('order_id=101&order_type=repair&start_date=2026-03...2026-04&page=2')

    const wrapper = await mountList()

    expect(listRequests()).toHaveLength(1)
    expect(listRequests()[0].query).toEqual({
      page: '2', page_size: '20', order_id: '101', order_type: 'repair', start_date: '2026-03...2026-04',
    })
    expect(chipTexts(wrapper)).toEqual(['Order ID: 101', 'Type: repair', 'Start date: 03/2026 – 04/2026'])
  })
})

describe('OrderList saved filters', () => {
  test('picking a saved filter rides the wire as user_filter and the address bar', async () => {
    const wrapper = await mountList()

    await pickView(wrapper, 'Mine')

    expect(listRequests().at(-1).query).toMatchObject({ page: '1', user_filter: '7' })
    expect(window.location.hash).toContain('user_filter=7')
  })

  test('picking the active view again clears it', async () => {
    seedUrl('user_filter=7')
    const wrapper = await mountList()
    expect(listRequests()[0].query).toMatchObject({ user_filter: '7' })

    await pickView(wrapper, 'Mine')

    expect(listRequests().at(-1).query).toEqual({ page: '1', page_size: '20' })
    expect(window.location.hash).not.toContain('user_filter')
  })

  test('the saved filter in force is the only active view, never All as well', async () => {
    // The pills let the router mark "All" active on a route-name match, so a
    // saved filter — which only changes the query — left both highlighted.
    seedUrl('user_filter=7')
    const wrapper = await mountList()
    expect(listRequests()[0].query).toMatchObject({ user_filter: '7' })

    expect(wrapper.get('.order-view-dropdown .dropdown-toggle').text()).toBe('Mine')

    await wrapper.get('.order-view-dropdown .dropdown-toggle').trigger('click')
    await flushPromises()
    const active = wrapper.findAll('.order-view-dropdown .dropdown-item')
      .filter((item) => item.classes().includes('active'))

    expect(active.map((item) => item.text())).toEqual(['Mine'])
  })

  test('the not-accepted list drops a saved filter its mode does not take', async () => {
    seedUrl('user_filter=7')

    await mountList({ props: { queryMode: 'unaccepted' } })

    expect(listRequests()[0].query).toEqual({ page: '1', page_size: '20', mode: 'unaccepted' })
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

  test('a failed status write rolls the select back to the stored status', async () => {
    api.post('/api/order/status/', new (await import('msw')).HttpResponse(null, { status: 500 }))
    const wrapper = await mountList()

    await wrapper.get('select#5-change-status').setValue('done')
    await settle()

    expect(wrapper.get('select#5-change-status').element.value).toBe('new')
    expect(toasts().map((toast) => toast.body)).toContain('Error creating status')
  })

  test('the status select is coloured by the row, and selects the row code', async () => {
    const wrapper = await mountList()

    const cells = wrapper.findAll('span.status')
    expect(cells[0].attributes('style')).toContain('--status-color: #00ff00')
    // the row names the `done` code by id even though its text has user
    // text appended; the select shows that code
    expect(cells[1].attributes('style')).toContain('--status-color: #ff0000')
    expect(wrapper.get('select#5-change-status').element.value).toBe('new')
    expect(wrapper.get('select#6-change-status').element.value).toBe('done')
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

  test('removing a picked order writes the shortened selection to the store', async () => {
    const wrapper = await mountList({
      props: { queryMode: 'dispatch', dispatch: true },
      main: { getAssignOrders: [{ id: 5, order_id: '2026-0005' }, { id: 6, order_id: '2026-0006' }] },
    })
    const store = useMainStore()

    await wrapper.findAll('.selected-order')[0].get('.icon').trigger('click')
    await settle()

    expect(store.setAssignOrders).toHaveBeenLastCalledWith([{ id: 6, order_id: '2026-0006' }])
    expect(wrapper.text()).toContain('Selected orders (1)')
    expect(wrapper.get('.selected-orders').text()).not.toContain('2026-0005')
  })

  test('a pick written to the store elsewhere reaches the strip', async () => {
    const wrapper = await mountList({ props: { queryMode: 'dispatch', dispatch: true } })
    const store = useMainStore()
    expect(wrapper.text()).not.toContain('Selected orders')

    store.setAssignOrders([{ id: 6, order_id: '2026-0006' }])
    await settle()

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
