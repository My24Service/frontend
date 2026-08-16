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
  test('pads an HH:mm time to HH:mm:ss', async () => {
    const wrapper = await readyValid()
    wrapper.vm.order.start_time = '08:30'

    await wrapper.vm.submitForm()

    expect(payload('post').start_time).toBe('08:30:00')
  })

  test('refuses a time that is not a time', async () => {
    const wrapper = await readyValid()
    wrapper.vm.order.start_time = 'half past eight'

    await wrapper.vm.submitForm()

    expect(fakeHttp.post).not.toHaveBeenCalled()
    expect(wrapper.vm.errors).toHaveProperty('start_time')
  })

  test('sends the selected sales users as order_email_extra', async () => {
    const wrapper = await readyValid()
    wrapper.vm.selectedSalesUsers = [{ email: 'a@example.test' }, { email: 'b@example.test' }]

    await wrapper.vm.submitForm()

    expect(payload('post').order_email_extra).toEqual(['a@example.test', 'b@example.test'])
  })

  test('does not send the form-only keys with the order', async () => {
    const wrapper = await readyValid()
    wrapper.vm.product = 'Widget'
    wrapper.vm.location = 'Roof'
    wrapper.vm.addOrderLine()
    wrapper.vm.info = 'bring a ladder'
    wrapper.vm.addInfoLine()

    await wrapper.vm.submitForm()

    expect(payload('post')).not.toHaveProperty('orderlines')
    expect(payload('post')).not.toHaveProperty('infolines')
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

  test('drops blank infolines rather than posting them', async () => {
    const wrapper = await readyValid()
    wrapper.vm.info = '  '
    wrapper.vm.addInfoLine()

    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'post')).toEqual(['/order/order/'])
  })

  test('hands the new order id to the documents component', async () => {
    const wrapper = await readyValid()

    await wrapper.vm.submitForm()

    expect(orderCreated).toHaveBeenCalledWith(100)
  })
})

describe('OrderFormMaintenancePlanning - the tenant variant', () => {
  test('a tenant without branches must have a customer', async () => {
    const wrapper = await ready()
    wrapper.vm.order.order_type = 'maintenance'
    wrapper.vm.order.order_name = 'Fictie B.V.'

    await wrapper.vm.submitForm()

    expect(fakeHttp.post).not.toHaveBeenCalled()
    expect(wrapper.vm.errors).toHaveProperty('customer_relation')
    expect(wrapper.vm.stateOf('customer_relation')).toBe(false)
  })

  test('a tenant with branches must have a branch', async () => {
    const wrapper = await ready({}, { hasBranches: true })
    wrapper.vm.order.order_type = 'maintenance'
    wrapper.vm.order.order_name = 'Branch Amsterdam'

    await wrapper.vm.submitForm()

    expect(fakeHttp.post).not.toHaveBeenCalled()
    expect(wrapper.vm.errors).toHaveProperty('branch')
  })

  test('a branch satisfies the branch tenant', async () => {
    const wrapper = await ready({}, { hasBranches: true })
    wrapper.vm.fillBranch(BRANCH)
    wrapper.vm.order.order_type = 'maintenance'

    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'post')).toEqual(['/order/order/'])
    expect(payload('post').branch).toBe(7)
  })

  test('reports field errors only after a submit attempt', async () => {
    const wrapper = await ready()

    expect(wrapper.vm.stateOf('customer_relation')).toBeNull()
    expect(wrapper.vm.errorFor('customer_relation')).toBe('')

    await wrapper.vm.submitForm()

    expect(wrapper.vm.errorFor('customer_relation')).not.toBe('')
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

  test('patches the order and navigates back', async () => {
    const wrapper = await readyEdit()

    wrapper.vm.order.order_reference = 'REF-2'
    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'patch')).toContain('/order/order/42/')
    expect(payload('patch')).toMatchObject({ order_reference: 'REF-2' })
    expect(toastTitles()).toContain('Updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('patches the existing orderline and infoline', async () => {
    const wrapper = await readyEdit()

    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'patch')).toEqual([
      '/order/order/42/',
      '/order/orderline/5/',
      '/order/infoline/9/',
    ])
  })

  test('deletes the lines removed in the form', async () => {
    const wrapper = await readyEdit()

    wrapper.vm.deleteOrderLine(0)
    wrapper.vm.deleteInfoLine(0)
    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'delete')).toEqual(['/order/orderline/5/', '/order/infoline/9/'])
  })

  test('does not upload documents on edit', async () => {
    const wrapper = await readyEdit()

    await wrapper.vm.submitForm()

    expect(orderCreated).not.toHaveBeenCalled()
  })

  // The order is left marked apiOk so a second press does not create a
  // duplicate; only the parts that failed are retried.
  test('does not resubmit an order that already went through', async () => {
    const wrapper = await readyEdit()

    await wrapper.vm.submitForm()
    expect(wrapper.vm.order.apiOk).toBe(true)

    fakeHttp.patch.mockClear()
    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'patch')).not.toContain('/order/order/42/')
  })

  test('records an API failure on the order for ApiResult to render', async () => {
    const wrapper = await readyEdit()
    const boom = new Error('boom')
    fakeHttp.patch.mockRejectedValueOnce(boom)

    await wrapper.vm.submitForm()

    expect(wrapper.vm.order.apiOk).toBe(false)
    expect(wrapper.vm.order.error).toBe(boom)
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.isLoading).toBe(false)
    expect(wrapper.vm.buttonDisabled).toBe(false)
  })

  // A rejected payload is a form problem, not an API result: it belongs next to
  // the inputs, not in the ApiResult banner.
  test('does not record a validation failure as an API error', async () => {
    const wrapper = await readyEdit()
    wrapper.vm.order.start_time = 'half past eight'

    await wrapper.vm.submitForm()

    expect(wrapper.vm.order.apiOk).toBeUndefined()
    expect(wrapper.vm.order.error).toBeUndefined()
    expect(wrapper.vm.errors).toHaveProperty('start_time')
  })

  test('editAndAccept saves and then accepts the order', async () => {
    const wrapper = await readyEdit()

    await wrapper.vm.editAndAccept()

    expect(urlsOf(fakeHttp, 'post')).toContain('/order/order/42/set_order_accepted/')
    expect(toastTitles()).toContain('Accepted')
  })

  test('reject sets the order rejected and goes back', async () => {
    const wrapper = await readyEdit()

    await wrapper.vm.reject()

    expect(urlsOf(fakeHttp, 'post')).toEqual(['/order/order/42/set_order_rejected/'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })
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

describe('OrderFormMaintenancePlanning - date range', () => {
  test('moving the start date past the end date drags the end date along', async () => {
    const wrapper = await ready()
    wrapper.vm.order.start_date = new Date(2026, 7, 20)
    wrapper.vm.order.end_date = new Date(2026, 7, 21)
    await wrapper.vm.$nextTick()

    wrapper.vm.order.start_date = new Date(2026, 7, 25)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.order.end_date).toEqual(new Date(2026, 7, 25))
  })

  test('moving the end date before the start date drags the start date back', async () => {
    const wrapper = await ready()
    wrapper.vm.order.start_date = new Date(2026, 7, 20)
    wrapper.vm.order.end_date = new Date(2026, 7, 21)
    await wrapper.vm.$nextTick()

    wrapper.vm.order.end_date = new Date(2026, 7, 15)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.order.start_date).toEqual(new Date(2026, 7, 15))
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
