import { beforeEach, describe, expect, test, vi } from 'vitest'

import OrderFormMaintenancePlanning from '@/views/orders/OrderFormMaintenancePlanning.vue'

import {
  mountForm,
  resetFakeHttp,
  routerGo,
  toastCreate,
  toastTitles,
  urlsOf,
} from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

// This form builds its own services in setup, so the seam is the axios module -
// see form-harness.js. The fake must be created with vi.hoisted here; an async
// factory that imports the harness deadlocks the run.
const fakeHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
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

const CUSTOMER = {
  id: 12,
  customer_id: 'C-1263',
  name: 'Fictie B.V.',
  address: 'Metaalweg 4',
  postal: '3751LS',
  city: 'Bunschoten-Spakenburg',
  country_code: 'NL',
  tel: '0650008',
  mobile: '+316123456789',
  email: 'test@example.test',
  contact: 'L. Welling',
  remarks: 'gate code 1234',
}

const BRANCH = {
  id: 7,
  name: 'Branch Amsterdam',
  address: 'Kerkstraat 1',
  postal: '1000 AA',
  city: 'Amsterdam',
  country_code: 'NL',
  tel: '0201234567',
  mobile: '0612345678',
  email: 'branch@example.test',
  contact: 'Jan',
  remarks: 'ring twice',
}

const DETAIL = {
  id: 42,
  order_id: 'ORD-42',
  order_type: ' maintenance ',
  order_name: 'Fictie B.V.',
  order_reference: 'REF-1',
  start_date: '20/08/2026',
  end_date: '21/08/2026',
  order_email_extra: ['sales@example.test'],
  orderlines: [{ id: 5, product: 'Widget', location: 'Roof', remarks: '' }],
  infolines: [{ id: 9, info: 'bring a ladder' }],
}

const ROUTES = {
  '/order/order/42/': DETAIL,
  '/customer/customer/12/': CUSTOMER,
}

const orderCreated = vi.fn(() => [])
const documentsStub = { template: '<div />', methods: { orderCreated } }

/**
 * The tenant setting decides which owner field OrderCreateSerializer requires,
 * and this is the only form where that matters - it is the planning/staff one.
 */
function mount(props = {}, { hasBranches = false } = {}) {
  return mountForm(OrderFormMaintenancePlanning, {
    props,
    main: {
      getMemberHasBranches: hasBranches,
      getCountries: [],
      getMemberUsesEquipment: false,
      getMaintenanceEquipment: null,
    },
    stubs: { DocumentsComponent: documentsStub },
  })
}

async function ready(props = {}, options = {}) {
  const wrapper = mount(props, options)
  await vi.waitFor(() => expect(wrapper.vm.order).not.toBeNull())
  return wrapper
}

/** A create-form state the planning serializer accepts, for a tenant without branches. */
async function readyValid() {
  const wrapper = await ready()
  wrapper.vm.fillCustomer(CUSTOMER)
  wrapper.vm.order.order_type = 'maintenance'
  return wrapper
}

function payload(verb, index = 0) {
  return fakeHttp[verb].mock.calls[index][1]
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, ROUTES)
  toastCreate.mockClear()
  orderCreated.mockClear()
})

describe('OrderFormMaintenancePlanning - create', () => {
  test('starts from a blank order model', async () => {
    const wrapper = await ready()

    expect(wrapper.vm.order.order_country_code).toBe('NL')
    expect(wrapper.vm.order.orderlines).toEqual([])
    expect(wrapper.vm.order.infolines).toEqual([])
  })

  test('fillCustomer copies the customer onto the order', async () => {
    const wrapper = await ready()

    wrapper.vm.selectCustomer(CUSTOMER)

    expect(wrapper.vm.order).toMatchObject({
      customer_relation: 12,
      customer_id: 'C-1263',
      order_name: 'Fictie B.V.',
      order_address: 'Metaalweg 4',
      order_city: 'Bunschoten-Spakenburg',
      customer_remarks: 'gate code 1234',
    })
  })

  test('fillBranch copies the branch onto the order', async () => {
    const wrapper = await ready({}, { hasBranches: true })

    wrapper.vm.selectBranch(BRANCH)

    expect(wrapper.vm.order).toMatchObject({
      branch: 7,
      order_name: 'Branch Amsterdam',
      order_city: 'Amsterdam',
    })
  })

  test('posts the order and navigates back', async () => {
    const wrapper = await readyValid()

    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'post')).toEqual(['/order/order/'])
    expect(payload('post')).toMatchObject({
      order_type: 'maintenance',
      customer_relation: 12,
      order_name: 'Fictie B.V.',
    })

    expect(toastTitles()).toEqual(['Created'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('sends the dates as YYYY-MM-DD, not as Date objects', async () => {
    const wrapper = await readyValid()
    wrapper.vm.order.start_date = new Date(2026, 7, 20)
    wrapper.vm.order.end_date = new Date(2026, 7, 21)

    await wrapper.vm.submitForm()

    expect(payload('post')).toMatchObject({ start_date: '2026-08-20', end_date: '2026-08-21' })
  })

  // The form's own `isCorrectTime` validator accepted `H:mm`; the schema's
  // apiTime() accepts the same input and pads it to what the serializer types.

  test('sends the selected sales users as order_email_extra', async () => {
    const wrapper = await readyValid()
    wrapper.vm.selectedSalesUsers = [{ email: 'a@example.test' }, { email: 'b@example.test' }]

    await wrapper.vm.submitForm()

    expect(payload('post').order_email_extra).toEqual(['a@example.test', 'b@example.test'])
  })

  test('posts the orderlines and infolines against the new order', async () => {
    const wrapper = await readyValid()
    wrapper.vm.product = 'Widget'
    wrapper.vm.addOrderLine()
    wrapper.vm.info = 'bring a ladder'
    wrapper.vm.addInfoLine()

    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'post')).toEqual([
      '/order/order/',
      '/order/orderline/',
      '/order/infoline/',
    ])
    expect(payload('post', 1)).toMatchObject({ product: 'Widget', order: 100 })
    expect(payload('post', 2)).toMatchObject({ info: 'bring a ladder', order: 100 })
  })

  test('hands the new order id to the documents component', async () => {
    const wrapper = await readyValid()

    await wrapper.vm.submitForm()

    expect(orderCreated).toHaveBeenCalledWith(100)
  })
})

describe('OrderFormMaintenancePlanning - the tenant variant', () => {

  test('a branch satisfies the branch tenant', async () => {
    const wrapper = await ready({}, { hasBranches: true })
    wrapper.vm.fillBranch(BRANCH)
    wrapper.vm.order.order_type = 'maintenance'

    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'post')).toEqual(['/order/order/'])
    expect(payload('post').branch).toBe(7)
  })

  // Nothing was sent, so the lines the user entered have to survive for the
  // next attempt - submitForm empties them on the order before the call.
  test('keeps the orderlines and infolines when validation fails', async () => {
    const wrapper = await ready()
    wrapper.vm.product = 'Widget'
    wrapper.vm.addOrderLine()
    wrapper.vm.info = 'bring a ladder'
    wrapper.vm.addInfoLine()

    await wrapper.vm.submitForm()

    expect(wrapper.vm.order.orderlines).toHaveLength(1)
    expect(wrapper.vm.order.infolines).toHaveLength(1)
    expect(wrapper.vm.order.apiOk).toBeUndefined()
  })
})

describe('OrderFormMaintenancePlanning - edit', () => {
  async function readyEdit() {
    const wrapper = await ready({ pk: 42 })
    await vi.waitFor(() => expect(wrapper.vm.order.id).toBe(42))
    return wrapper
  }

  test('loads the order, parses its dates and trims the order type', async () => {
    const wrapper = await readyEdit()

    expect(wrapper.vm.order.order_type).toBe('maintenance')
    expect(wrapper.vm.order.start_date).toBeInstanceOf(Date)
    expect(wrapper.vm.order.start_date.getDate()).toBe(20)
  })

  test('seeds the sales-user picker from order_email_extra', async () => {
    const wrapper = await readyEdit()

    expect(wrapper.vm.selectedSalesUsers).toEqual([{ email: 'sales@example.test' }])
  })

  test('does not upload documents on edit', async () => {
    const wrapper = await readyEdit()

    await wrapper.vm.submitForm()

    expect(orderCreated).not.toHaveBeenCalled()
  })

  // The order is left marked apiOk so a second press does not create a
  // duplicate; only the parts that failed are retried.

  // A rejected payload is a form problem, not an API result: it belongs next to
  // the inputs, not in the ApiResult banner.

})

describe('OrderFormMaintenancePlanning - engineers', () => {
  test('assigns the selected engineers to the new order', async () => {
    const wrapper = await readyValid()
    wrapper.vm.selectedEngineers = [{ id: 3, full_name: 'Ing. One' }]
    fakeHttp.post.mockResolvedValueOnce({ data: { id: 100, order_id: 'ORD-100' } })

    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'post')).toContain('/mobile/assign-user/3/?notify_user=1')
    expect(wrapper.vm.selectedEngineers).toEqual([])
    expect(wrapper.vm.assignResult).toEqual([{ id: 3, full_name: 'Ing. One', apiOk: true }])
  })

  test('unassigns the engineers removed from the order', async () => {
    const wrapper = await readyValid()
    wrapper.vm.removedEngineers = [{ user_id: 4, full_name: 'Ing. Two' }]
    // unAssign reports refusal with result 0 rather than an error status.
    fakeHttp.post.mockImplementation((url) =>
      url.startsWith('/mobile/unassign-user/')
        ? Promise.resolve({ data: { result: 1 } })
        : Promise.resolve({ data: { id: 100 } }),
    )

    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'post')).toContain('/mobile/unassign-user/4/')
    expect(wrapper.vm.removedEngineers).toEqual([])
    expect(toastTitles()).toContain('Engineers unassigned')
  })

  test('treats a refused unassign as an error and does not navigate', async () => {
    const wrapper = await readyValid()
    wrapper.vm.removedEngineers = [{ user_id: 4, full_name: 'Ing. Two' }]
    fakeHttp.post.mockImplementation((url) =>
      url.startsWith('/mobile/unassign-user/')
        ? Promise.resolve({ data: { result: 0 } })
        : Promise.resolve({ data: { id: 100 } }),
    )

    await wrapper.vm.submitForm()

    expect(routerGo()).not.toHaveBeenCalled()
    // errorToast(create, body, title): the refusal reports the engineer as the
    // body under its own title, and the run then ends with the generic Error
    // toast rather than navigating.
    expect(toastTitles()).toEqual(['There were errors unassigning engineers', 'Error'])
  })
})

describe('OrderFormMaintenancePlanning - orderlines and infolines', () => {
  test('addOrderLine appends the entry fields and clears them', async () => {
    const wrapper = await ready()

    wrapper.vm.product = 'Widget'
    wrapper.vm.location = 'Roof'
    wrapper.vm.remarks = 'note'
    wrapper.vm.addOrderLine()

    expect(wrapper.vm.order.orderlines).toEqual([
      { product: 'Widget', location: 'Roof', remarks: 'note', equipment: null, equipment_location: null },
    ])
    expect(wrapper.vm.product).toBe('')
  })

  test('doEditOrderLine replaces the line in place', async () => {
    const wrapper = await ready()

    wrapper.vm.product = 'Widget'
    wrapper.vm.addOrderLine()
    wrapper.vm.editOrderLine({ id: 5, product: 'Widget' }, 0)
    wrapper.vm.product = 'Gadget'
    wrapper.vm.doEditOrderLine()

    expect(wrapper.vm.order.orderlines[0]).toMatchObject({ id: 5, product: 'Gadget' })
    expect(wrapper.vm.isEditOrderLine).toBe(false)
    expect(wrapper.vm.editIndex).toBeNull()
  })

  test('selectEquipment takes the location with it when the equipment has one', async () => {
    const wrapper = await ready()

    wrapper.vm.selectEquipment({ id: 1, name: 'Widget', location: { id: 2, name: 'Roof' } })

    expect(wrapper.vm.equipment).toBe(1)
    expect(wrapper.vm.equipment_location).toBe(2)
    expect(wrapper.vm.location).toBe('Roof')
  })

  test('doEditInfoLine replaces the line in place', async () => {
    const wrapper = await ready()

    wrapper.vm.info = 'first'
    wrapper.vm.addInfoLine()
    wrapper.vm.editInfoLine({ id: 9, info: 'first' }, 0)
    wrapper.vm.info = 'second'
    wrapper.vm.doEditInfoLine()

    expect(wrapper.vm.order.infolines[0]).toEqual({ id: 9, info: 'second' })
    expect(wrapper.vm.isEditInfoLine).toBe(false)
  })

  test('deleteInfoLine removes the line and remembers it for deletion', async () => {
    const wrapper = await ready()
    wrapper.vm.order.infolines = [{ id: 9, info: 'bring a ladder' }]

    wrapper.vm.deleteInfoLine(0)

    expect(wrapper.vm.order.infolines).toEqual([])
    expect(wrapper.vm.deletedInfolines).toEqual([{ id: 9, info: 'bring a ladder' }])
  })
})

describe('OrderFormMaintenancePlanning - cancel', () => {
  test('goes back without touching the API', async () => {
    const wrapper = await ready()

    wrapper.vm.cancelForm()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(fakeHttp.post).not.toHaveBeenCalled()
  })
})

describe('OrderFormMaintenancePlanning - call shapes', () => {
  // Old `OrderService.setAccepted` posted an explicit `{}` body (plus CSRF
  // headers); the generated `orderOrderSetOrderAcceptedCreate` posts no body at
  // all. URL and query are unchanged - the new shape is asserted here.

  // Old `EquipmentService.searchCustomer`/`LocationService.searchCustomer`
  // built `?q=..&customer=..` by hand; the generated ops carry the same pair
  // as a query object. `selectCustomer` is the one exposed entry point that
  // reaches them (it preloads the equipment and location pickers when the
  // tenant uses equipment).
  test('selecting a customer with equipment enabled autocompletes equipment and locations by customer', async () => {
    const wrapper = mountForm(OrderFormMaintenancePlanning, {
      props: {},
      main: {
        getMemberHasBranches: false,
        getCountries: [],
        getMemberUsesEquipment: true,
        getMaintenanceEquipment: null,
      },
      stubs: { DocumentsComponent: documentsStub },
    })
    await vi.waitFor(() => expect(wrapper.vm.order).not.toBeNull())

    await wrapper.vm.selectCustomer(CUSTOMER)

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/equipment/equipment/autocomplete/', query: { q: '', customer: '12' }, body: undefined },
      { method: 'get', path: '/api/equipment/location/autocomplete/', query: { q: '', customer: '12' }, body: undefined },
    ])
  })
})
