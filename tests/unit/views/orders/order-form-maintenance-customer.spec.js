import { beforeEach, describe, expect, test, vi } from 'vitest'

import OrderFormMaintenanceCustomer from '@/views/orders/OrderFormMaintenanceCustomer.vue'

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
}

const DETAIL = {
  id: 42,
  order_type: 'maintenance',
  order_name: 'Fictie B.V.',
  order_reference: 'REF-1',
  start_date: '20/08/2026',
  end_date: '21/08/2026',
  orderlines: [{ id: 5, product: 'Widget', location: 'Roof', remarks: '' }],
}

const ROUTES = {
  '/customer/customer/12/': CUSTOMER,
  '/order/order/42/': DETAIL,
}

const orderCreated = vi.fn()
const documentsStub = { template: '<div />', methods: { orderCreated } }

/**
 * The form resolves its customer from the signed-in user, and reads the auth
 * store synchronously during setup - so `userInfo` has to be seeded through
 * mountForm, before the component is created.
 */
function mount(props = {}) {
  return mountForm(OrderFormMaintenanceCustomer, {
    props,
    main: { getCountries: [] },
    auth: { userInfo: { user: { customer_user: { customer: 12 } } } },
    stubs: { DocumentsComponent: documentsStub },
  })
}

async function ready(props = {}) {
  const wrapper = mount(props)
  await vi.waitFor(() => expect(wrapper.vm.order).not.toBeNull())
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

describe('OrderFormMaintenanceCustomer - create', () => {
  test('prefills the order from the customer record', async () => {
    const wrapper = await ready()

    expect(wrapper.vm.order).toMatchObject({
      customer_relation: 12,
      customer_id: 'C-1263',
      order_name: 'Fictie B.V.',
      order_address: 'Metaalweg 4',
      order_postal: '3751LS',
      order_country_code: 'NL',
    })
  })

  // The old code assigned `this.order.city`, which no input and no schema binds
  // to, so a new order started with an empty city field.
  test('prefills the city into order_city', async () => {
    const wrapper = await ready()

    expect(wrapper.vm.order.order_city).toBe('Bunschoten-Spakenburg')
  })

  test('posts the order and navigates back', async () => {
    const wrapper = await ready()
    wrapper.vm.order.order_type = 'maintenance'

    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'post')).toEqual(['/order/order/'])
    expect(payload('post')).toMatchObject({
      order_type: 'maintenance',
      order_name: 'Fictie B.V.',
      order_city: 'Bunschoten-Spakenburg',
    })

    expect(orderCreated).toHaveBeenCalledWith({ id: 100 })
    expect(toastTitles()).toEqual(['Created'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(wrapper.vm.isLoading).toBe(false)
    expect(wrapper.vm.buttonDisabled).toBe(false)
  })

  // OrderCreateCustomerSerializer has neither owner field: the view derives the
  // customer from the requesting user.
  test('does not send the owner fields the customer serializer lacks', async () => {
    const wrapper = await ready()
    wrapper.vm.order.order_type = 'maintenance'

    await wrapper.vm.submitForm()

    expect(payload('post')).not.toHaveProperty('customer_relation')
    expect(payload('post')).not.toHaveProperty('branch')
  })

  test('sends the dates as YYYY-MM-DD, not as Date objects', async () => {
    const wrapper = await ready()
    wrapper.vm.order.order_type = 'maintenance'
    wrapper.vm.order.start_date = new Date(2026, 7, 20)
    wrapper.vm.order.end_date = new Date(2026, 7, 21)

    await wrapper.vm.submitForm()

    expect(payload('post')).toMatchObject({ start_date: '2026-08-20', end_date: '2026-08-21' })
  })

  test('pads an HH:mm time to the HH:mm:ss the serializer types', async () => {
    const wrapper = await ready()
    wrapper.vm.order.order_type = 'maintenance'
    wrapper.vm.order.start_time = '08:30'

    await wrapper.vm.submitForm()

    expect(payload('post').start_time).toBe('08:30:00')
  })

  test('sends nothing when the schema rejects the order', async () => {
    // A blank form has no order type, which every create serializer requires.
    const wrapper = await ready()

    await wrapper.vm.submitForm()

    expect(fakeHttp.post).not.toHaveBeenCalled()
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.errors).toHaveProperty('order_type')
    expect(toastTitles()).toEqual([])
  })

  test('reports field errors only after a submit attempt', async () => {
    const wrapper = await ready()

    expect(wrapper.vm.stateOf('order_type')).toBeNull()
    expect(wrapper.vm.errorFor('order_type')).toBe('')

    await wrapper.vm.submitForm()

    expect(wrapper.vm.stateOf('order_type')).toBe(false)
    expect(wrapper.vm.errorFor('order_type')).not.toBe('')
    expect(wrapper.vm.stateOf('order_name')).toBe(true)
  })

  test('does not send the form-only keys with the order', async () => {
    const wrapper = await ready()
    wrapper.vm.order.order_type = 'maintenance'
    wrapper.vm.order.service_number = 'S-1'
    wrapper.vm.addOrderLine()

    await wrapper.vm.submitForm()

    expect(payload('post')).not.toHaveProperty('orderlines')
    expect(payload('post')).not.toHaveProperty('service_number')
  })

  test('posts the orderlines against the new order id', async () => {
    const wrapper = await ready()
    wrapper.vm.order.order_type = 'maintenance'
    wrapper.vm.product = 'Widget'
    wrapper.vm.addOrderLine()

    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'post')).toEqual(['/order/order/', '/order/orderline/'])
    expect(payload('post', 1)).toMatchObject({ product: 'Widget', order: 100 })
  })

  test('does not navigate when the post fails', async () => {
    const wrapper = await ready()
    wrapper.vm.order.order_type = 'maintenance'
    fakeHttp.post.mockRejectedValueOnce(new Error('boom'))

    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual(['Error'])
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.isLoading).toBe(false)
    expect(wrapper.vm.buttonDisabled).toBe(false)
  })
})

describe('OrderFormMaintenanceCustomer - edit', () => {
  async function readyEdit() {
    const wrapper = await ready({ pk: 42 })
    await vi.waitFor(() => expect(wrapper.vm.order.id).toBe(42))
    return wrapper
  }

  test('loads the order and parses its dates', async () => {
    const wrapper = await readyEdit()

    expect(wrapper.vm.order.order_reference).toBe('REF-1')
    expect(wrapper.vm.order.start_date).toBeInstanceOf(Date)
    expect(wrapper.vm.order.start_date.getFullYear()).toBe(2026)
    expect(wrapper.vm.order.start_date.getMonth()).toBe(7)
    expect(wrapper.vm.order.start_date.getDate()).toBe(20)
  })

  test('patches the order and navigates back', async () => {
    const wrapper = await readyEdit()

    wrapper.vm.order.order_reference = 'REF-2'
    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'patch')).toContain('/order/order/42/')
    expect(payload('patch')).toMatchObject({ order_reference: 'REF-2' })
    expect(toastTitles()).toEqual(['Updated'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  // OrderUpdateCustomerSerializer has neither field.
  test('does not send customer_relation or customer_id', async () => {
    const wrapper = await readyEdit()

    await wrapper.vm.submitForm()

    expect(payload('patch')).not.toHaveProperty('customer_relation')
    expect(payload('patch')).not.toHaveProperty('customer_id')
  })

  test('patches an existing orderline and posts a new one', async () => {
    const wrapper = await readyEdit()

    wrapper.vm.product = 'Gadget'
    wrapper.vm.addOrderLine()
    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'patch')).toEqual(['/order/order/42/', '/order/orderline/5/'])
    expect(urlsOf(fakeHttp, 'post')).toEqual(['/order/orderline/'])
    expect(payload('post')).toMatchObject({ product: 'Gadget', order: 42 })
  })

  test('deletes the orderlines removed in the form', async () => {
    const wrapper = await readyEdit()

    wrapper.vm.deleteOrderLine(0)
    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'delete')).toEqual(['/order/orderline/5/'])
  })

  test('does not navigate when the patch fails', async () => {
    const wrapper = await readyEdit()

    fakeHttp.patch.mockRejectedValueOnce(new Error('boom'))
    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual(['Error'])
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.isLoading).toBe(false)
  })
})

describe('OrderFormMaintenanceCustomer - orderlines', () => {
  test('addOrderLine appends the entry fields and clears them', async () => {
    const wrapper = await ready()

    wrapper.vm.product = 'Widget'
    wrapper.vm.location = 'Roof'
    wrapper.vm.remarks = 'note'
    wrapper.vm.addOrderLine()

    expect(wrapper.vm.order.orderlines).toEqual([
      { product: 'Widget', location: 'Roof', remarks: 'note' },
    ])
    expect(wrapper.vm.product).toBe('')
    expect(wrapper.vm.location).toBe('')
    expect(wrapper.vm.remarks).toBe('')
  })

  test('editOrderLine loads a line into the entry fields', async () => {
    const wrapper = await ready()

    wrapper.vm.editOrderLine({ id: 5, product: 'Widget', location: 'Roof', remarks: 'note' }, 0)

    expect(wrapper.vm.product).toBe('Widget')
    expect(wrapper.vm.location).toBe('Roof')
    expect(wrapper.vm.remarks).toBe('note')
    expect(wrapper.vm.isEditOrderLine).toBe(true)
  })

  test('doEditOrderLine replaces the line in place and leaves edit mode', async () => {
    const wrapper = await ready()

    wrapper.vm.product = 'Widget'
    wrapper.vm.addOrderLine()
    wrapper.vm.editOrderLine({ id: 5, product: 'Widget', location: '', remarks: '' }, 0)
    wrapper.vm.product = 'Gadget'
    wrapper.vm.doEditOrderLine()

    expect(wrapper.vm.order.orderlines).toEqual([
      { id: 5, product: 'Gadget', location: '', remarks: '' },
    ])
    expect(wrapper.vm.isEditOrderLine).toBe(false)
    expect(wrapper.vm.editIndex).toBeNull()
  })

  test('deleteOrderLine removes the line and remembers it for deletion', async () => {
    const wrapper = await ready()
    wrapper.vm.order.orderlines = [{ id: 5, product: 'Widget' }]

    wrapper.vm.deleteOrderLine(0)

    expect(wrapper.vm.order.orderlines).toEqual([])
    expect(wrapper.vm.deletedOrderlines).toEqual([{ id: 5, product: 'Widget' }])
  })
})

describe('OrderFormMaintenanceCustomer - date range', () => {
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

describe('OrderFormMaintenanceCustomer - cancel', () => {
  test('goes back without touching the API', async () => {
    const wrapper = await ready()

    wrapper.vm.cancelForm()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(fakeHttp.post).not.toHaveBeenCalled()
    expect(fakeHttp.patch).not.toHaveBeenCalled()
  })
})
