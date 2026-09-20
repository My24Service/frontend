import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import Dispatch from '@/features/field-service/dispatch/Dispatch.vue'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { vAssignedOrderCreate, vEngineerLocation, vOrderDetail } from '@/api/valibot.gen'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts, toastCreate } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { fieldServiceRoutes } from '../../support/field-service-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({create: toastCreate}),
}))

// The board subscribes to the member websocket while mounted; under test it
// must neither fetch a room nor connect. The registered handler is kept so a
// test can deliver the dispatch message through it.
const socket = vi.hoisted(() => ({ handlers: {}, removed: [] }))
vi.mock('@/services/websocket/MemberNewDataSocket', () => ({
  default: class {
    async init() {}
    setOnmessageHandler(fn) { socket.handlers.dispatch = fn }
    removeOnmessageHandler() { socket.removed.push('dispatch') }
    getSocket() {}
    removeSocket() {}
  },
}))

/**
 * Characterisation of the dispatch week board, written against the LEGACY
 * screen before it moves into `src/features/field-service/dispatch/`.
 *
 * The board is the slice's biggest screen and the one with real state: the
 * week it shows, the view settings it remembers, the websocket that tells it
 * the planning changed underneath, and five writes (assign, unassign, change
 * date, split, open the order). This file pins the wire contract of all five
 * plus the lifecycle, because those are what a conversion breaks silently.
 *
 * The three flows that live inside a `b-modal` are driven through the
 * instance rather than through the DOM: `b-modal` teleports its content to
 * `document.body`, and the pickers inside it (`VueDatePicker`,
 * `VueMultiselect`, the nested `SearchAndAssign`) have no happy-dom
 * equivalent. What is asserted is the request that leaves, which is the part
 * the seam can judge.
 */
const api = installApiSeam()

const WINDOW = '/api/company/dispatch-assignedorders-user-list-v4/'
const ASSIGN = '/api/mobile/assign-user/{id}/'
const UNASSIGN = '/api/mobile/unassign-user/{id}/'
const CHANGE_DATE = '/api/mobile/assignedorder/{id}/detail_change_date/'
const ASSIGNED_ORDER = '/api/mobile/assignedorder/'
const ORDER = '/api/order/order/{id}/'

const statuscodes = [
  {id: 1, statuscode: 'new', color: '#00ff00', text_color: '#000000'},
]

function orderRow(overrides = {}) {
  return {
    id: 12,
    order_id: '2026-0012',
    order_name: 'Acme',
    order_city: 'Utrecht',
    order_type: 'maintenance',
    order_reference: '',
    assigned_user_info: [],
    ...overrides,
  }
}

beforeEach(() => {
  socket.handlers = {}
  socket.removed = []
  // Only Date is faked: `settle()` waits on real timers, and freezing those
  // would hang every spec in this file.
  vi.useFakeTimers({toFake: ['Date']})
  vi.setSystemTime(new Date(2026, 8, 16, 9, 0, 0))
  localStorage.clear()

  api.get(WINDOW, {data: []})
  api.post(ASSIGN, {result: 1, assigned_data: {}})
  api.post(UNASSIGN, {result: 1})
  api.patch(CHANGE_DATE, {result: true})
  api.post(ASSIGNED_ORDER, () => fixtureFor(vAssignedOrderCreate))
  api.get(ORDER, () => fixtureFor(vOrderDetail, {id: 12, order_id: '2026-0012'}))
  api.get('/api/company/engineer/get_locations/', () => [fixtureFor(vEngineerLocation)])
})

afterEach(() => {
  vi.useRealTimers()
})

async function mountDispatch(props = {}, options = {}) {
  const wrapper = mountForm(Dispatch, {
    deep: true,
    routes: fieldServiceRoutes,
    props: {assignModeProp: 'false', ...props},
    main: {getStatuscodes: statuscodes, getCurrentLanguage: 'nl', getAssignOrders: []},
    stubs: {
      // Both widgets have no meaningful DOM under happy-dom. The datepicker is
      // keyed on the *inner* component (`@vuepic/vue-datepicker` exports an
      // unnamed wrapper around it), so a stub keyed `VueDatePicker` would
      // replace the wrapper and receive no props at all.
      VueDatePickerRoot: {template: '<div />'},
      VueMultiselect: {template: '<div />'},
    },
    ...options,
  })
  await settle()
  return wrapper
}

const requestsTo = (path) => api.requests().filter((request) => request.path === path)

describe('Dispatch - the week it shows', () => {
  test('opens on this week and reads the window for it', async () => {
    await mountDispatch()

    const read = api.requests().find((request) => request.path === WINDOW)
    expect(read).toMatchObject({method: 'get', query: {start_date: '2026-09-14'}})
  })

  test('remembers the view mode and the user filter across visits', async () => {
    localStorage.setItem('displayMode', JSON.stringify('compact'))
    localStorage.setItem('showUsersMode', JSON.stringify('all'))

    const wrapper = await mountDispatch()
    expect(wrapper.vm.mode).toBe('compact')
    expect(wrapper.vm.showUsersMode).toBe('all')

    wrapper.vm.changeViewMode('wide')
    wrapper.vm.changeShowUsersMode('active')
    // The writes ride a watcher, which flushes on the next tick.
    await wrapper.vm.$nextTick()
    expect(JSON.parse(localStorage.getItem('displayMode'))).toBe('wide')
    expect(JSON.parse(localStorage.getItem('showUsersMode'))).toBe('active')
  })

  test('steps the week a day at a time and re-reads it', async () => {
    const wrapper = await mountDispatch()
    expect(requestsTo(WINDOW)).toHaveLength(1)

    wrapper.vm.timeForward()
    await wrapper.setProps({})
    await settle()
    expect(api.requests().filter((r) => r.path === WINDOW).at(-1).query).toEqual({start_date: '2026-09-15'})

    wrapper.vm.timeBackWeek()
    await settle()
    expect(api.requests().filter((r) => r.path === WINDOW).at(-1).query).toEqual({start_date: '2026-09-08'})
  })
})

describe('Dispatch - the websocket', () => {
  test('subscribes on mount and unsubscribes on unmount', async () => {
    const wrapper = await mountDispatch()
    expect(socket.handlers.dispatch).toBeTypeOf('function')

    wrapper.unmount()
    expect(socket.removed).toContain('dispatch')
  })

  test('a dispatch message raises the refresh flag without reloading', async () => {
    const wrapper = await mountDispatch()

    socket.handlers.dispatch({type: 'dispatch'})
    await settle()

    expect(wrapper.vm.newData).toBe(true)
    expect(requestsTo(WINDOW)).toHaveLength(1)
  })

  test('a message of another type is ignored', async () => {
    const wrapper = await mountDispatch()

    socket.handlers.dispatch({type: 'contract'})
    await settle()

    expect(wrapper.vm.newData).toBe(false)
  })
})

describe('Dispatch - assigning orders', () => {
  test('sends one assign per user, with the order ids and the notify flag', async () => {
    const wrapper = await mountDispatch()

    wrapper.vm.selectedOrders = [orderRow(), orderRow({id: 13, order_id: '2026-0013'})]
    wrapper.vm.selectedUsers = [
      {user_id: 4, full_name: 'Jan Jansen'},
      {user_id: 7, full_name: 'Piet Pietersen'},
    ]
    await wrapper.vm.assignToUsers()
    await settle()

    expect(requestsTo('/api/mobile/assign-user/4/')).toEqual([
      {method: 'post', path: '/api/mobile/assign-user/4/', query: {notify_user: '1'}, body: {order_ids: '2026-0012,2026-0013'}},
    ])
    expect(requestsTo('/api/mobile/assign-user/7/')).toEqual([
      {method: 'post', path: '/api/mobile/assign-user/7/', query: {notify_user: '1'}, body: {order_ids: '2026-0012,2026-0013'}},
    ])
  })

  test('a user already on one of the orders is not offered', async () => {
    const wrapper = await mountDispatch()

    wrapper.vm.alreadyAssignedUsers = [{user_id: 4, full_name: 'Jan Jansen'}]
    wrapper.vm.addSelectedUser({user_id: 4, full_name: 'Jan Jansen'})

    expect(wrapper.vm.selectedUsers).toEqual([])
    expect(toasts().map((toast) => toast.body)).toEqual(['Order(s) already assigned'])
  })

  test('a second click on the same user does not add them twice', async () => {
    const wrapper = await mountDispatch()

    wrapper.vm.addSelectedUser({user_id: 4, full_name: 'Jan Jansen'})
    wrapper.vm.addSelectedUser({user_id: 4, full_name: 'Jan Jansen'})

    expect(wrapper.vm.selectedUsers).toEqual([{user_id: 4, full_name: 'Jan Jansen'}])
  })

  test('cancelling clears the selection and the board mode', async () => {
    const wrapper = await mountDispatch()

    wrapper.vm.assignMode = true
    wrapper.vm.selectedUsers = [{user_id: 4, full_name: 'Jan Jansen'}]
    wrapper.vm.selectedOrders = [orderRow()]
    wrapper.vm.cancelAssign()

    expect(wrapper.vm.selectedUsers).toEqual([])
    expect(wrapper.vm.selectedOrders).toEqual([])
    expect(wrapper.vm.alreadyAssignedUsers).toEqual([])
    expect(wrapper.vm.assignMode).toBe(false)
  })

  test('a failed assign reports it and keeps the selection', async () => {
    api.post(ASSIGN, serverError)
    const wrapper = await mountDispatch()

    wrapper.vm.selectedOrders = [orderRow()]
    wrapper.vm.selectedUsers = [{user_id: 4, full_name: 'Jan Jansen'}]
    await wrapper.vm.assignToUsers()
    await settle()

    expect(toasts().map((toast) => toast.body)).toEqual(['Error assigning order(s)'])
    expect(wrapper.vm.selectedUsers).toHaveLength(1)
  })
})

describe('Dispatch - the three order actions', () => {
  async function withSelectedOrder(wrapper) {
    wrapper.vm.selectedAssignedOrder = {id: 77, order: orderRow()}
    wrapper.vm.selectedOrder = orderRow()
    wrapper.vm.selectedOrderUserId = 4
    await wrapper.vm.$nextTick()
  }

  test('unassigning sends the order pk for that user', async () => {
    const wrapper = await mountDispatch()
    await withSelectedOrder(wrapper)

    await wrapper.vm.postUnassign()
    await settle()

    expect(requestsTo('/api/mobile/unassign-user/4/')).toEqual([
      {method: 'post', path: '/api/mobile/unassign-user/4/', query: {}, body: {order_pk: 12}},
    ])
    expect(toasts().map((toast) => toast.body)).toContain('Order removed from planning')
  })

  test('changing the date sends both dates as YYYY-MM-DD', async () => {
    const wrapper = await mountDispatch()
    await withSelectedOrder(wrapper)

    wrapper.vm.assignedOrder = {
      alt_start_date: new Date(2026, 8, 20),
      alt_end_date: new Date(2026, 8, 22),
      alt_start_time: '08:00',
      alt_end_time: '12:00',
    }
    await wrapper.vm.changeDateSubmit()
    await settle()

    expect(requestsTo('/api/mobile/assignedorder/77/detail_change_date/')).toEqual([
      {
        method: 'patch',
        path: '/api/mobile/assignedorder/77/detail_change_date/',
        query: {},
        // `alt_*`, which is what AssignedOrderDatesSerializer declares and
        // what the request schema requires; the legacy body sent the model's own
        // `start_time`/`end_time`, which DRF ignored, so editing a time in this
        // modal did nothing. Seconds are appended because the schema declares
        // `isoTimeSecond` and the field hands over `HH:mm`.
        body: {
          alt_start_date: '2026-09-20',
          alt_end_date: '2026-09-22',
          alt_start_time: '08:00:00',
          alt_end_time: '12:00:00',
        },
      },
    ])
  })

  test('splitting sends one assigned order per picked engineer', async () => {
    const wrapper = await mountDispatch()
    await withSelectedOrder(wrapper)

    wrapper.vm.selectedEngineers = [{submodel_id: 3}, {submodel_id: 5}]
    wrapper.vm.assignedOrder = {
      order: 12,
      alt_start_date: new Date(2026, 8, 20),
      alt_end_date: new Date(2026, 8, 22),
      alt_start_time: '08:00',
      alt_end_time: '12:00',
    }
    await wrapper.vm.splitOrderSubmit()
    await settle()

    expect(requestsTo(ASSIGNED_ORDER)).toEqual([
      {
        method: 'post',
        path: ASSIGNED_ORDER,
        query: {},
        body: {
          order: 12,
          engineer: 3,
          alt_start_date: '2026-09-20',
          alt_end_date: '2026-09-22',
          alt_start_time: '08:00:00',
          alt_end_time: '12:00:00',
        },
      },
      {
        method: 'post',
        path: ASSIGNED_ORDER,
        query: {},
        body: {
          order: 12,
          engineer: 5,
          alt_start_date: '2026-09-20',
          alt_end_date: '2026-09-22',
          alt_start_time: '08:00:00',
          alt_end_time: '12:00:00',
        },
      },
    ])
  })

  test('opening an order reads it and then shows the actions', async () => {
    const wrapper = await mountDispatch()

    // Not awaited: `b-modal.show()` returns a promise that settles on the
    // modal manager's 'shown' event, and the manager is installed by the app's
    // plugin, which this harness does not install. The order read is what is
    // being pinned, and it lands before that await.
    void wrapper.vm.openActionsModal(4, 12, {id: 77, order: orderRow()}, false)
    await settle()

    expect(requestsTo('/api/order/order/12/')).toHaveLength(1)
    expect(wrapper.vm.selectedOrder).toMatchObject({id: 12})
  })
})