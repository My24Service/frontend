import { beforeEach, describe, expect, test, vi } from 'vitest'

import OrderFormTemps from '@/views/orders/OrderFormTemps.vue'

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

const DETAIL = {
  id: 42,
  order_type: 'temps',
  order_name: 'Fictie B.V.',
  order_reference: 'REF-1',
  start_date: '20/08/2026',
  end_date: '21/08/2026',
  customer_relation: 12,
  customer_id: 'C-1263',
  orderlines: [{ id: 5, product: 'Widget', location: 'Roof', remarks: '' }],
}

const ROUTES = { '/order/order/42/': DETAIL }

/**
 * The signed-in user's role, which this form derives its write context from -
 * it is picked on member *type*, not per role, so every role lands here.
 */
function planningUser() {
  return {
    submodel: 'planning_user',
    user: { pk: 1, username: 'evert', is_staff: false, is_superuser: false, planning_user: true },
  }
}

function customerUser() {
  return {
    submodel: 'customer_user',
    user: { pk: 2, username: 'klant', is_staff: false, is_superuser: false, customer_user: { customer: 12 } },
  }
}

function mount(props = {}, { hasBranches = false, userInfo = planningUser() } = {}) {
  return mountForm(OrderFormTemps, {
    props,
    main: { getMemberHasBranches: hasBranches, getCountries: [], getOrderTypes: [] },
    auth: { userInfo },
  })
}

async function ready(props = {}, options = {}) {
  const wrapper = mount(props, options)
  await vi.waitFor(() => expect(wrapper.vm.isLoading).toBe(false))
  return wrapper
}

/** A create-form state the planning serializer accepts on a branchless tenant. */
async function readyValid(options = {}) {
  const wrapper = await ready({}, options)
  wrapper.vm.selectCustomer(CUSTOMER)
  wrapper.vm.order.order_type = 'temps'
  return wrapper
}

function payload(verb, index = 0) {
  return fakeHttp[verb].mock.calls[index][1]
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, ROUTES)
  toastCreate.mockClear()
  // The create path asks whether to add documents; say no unless a test opts
  // in. happy-dom provides no `confirm`, so this is a definition, not a spy.
  window.confirm = vi.fn(() => false)
})

describe('OrderFormTemps - the write context', () => {
  // Unlike the maintenance forms, OrderForm picks this one on member type, so
  // all three roles reach it and the context is derived. The order of checks
  // mirrors OrderViewSet.create.
  test('a planning user writes as planning, with the tenant setting', async () => {
    const wrapper = await ready({}, { hasBranches: true })

    expect(wrapper.vm.writeContext).toEqual({ role: 'planning', hasBranches: true })
  })

  test('a customer user writes as customer', async () => {
    const wrapper = await ready({}, { userInfo: customerUser() })

    expect(wrapper.vm.writeContext).toEqual({ role: 'customer' })
  })

  test('a customer needs no owner field', async () => {
    const wrapper = await ready({}, { userInfo: customerUser() })
    wrapper.vm.order.order_name = 'Fictie B.V.'
    wrapper.vm.order.order_type = 'temps'

    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'post')).toEqual(['/order/order/'])
    expect(payload('post')).not.toHaveProperty('customer_relation')
  })

  test('a planning user on a branchless tenant needs a customer', async () => {
    const wrapper = await ready()
    wrapper.vm.order.order_name = 'Fictie B.V.'
    wrapper.vm.order.order_type = 'temps'

    await wrapper.vm.submitForm()

    expect(fakeHttp.post).not.toHaveBeenCalled()
    expect(wrapper.vm.errors).toHaveProperty('customer_relation')
  })
})

describe('OrderFormTemps - create', () => {
  test('loads the customers to pick from', async () => {
    const wrapper = await ready()

    expect(urlsOf(fakeHttp, 'get')).toContain('/customer/customer/autocomplete/?q=')
    expect(wrapper.vm.order.order_country_code).toBe('NL')
  })

  // The customer's own reference string is not the FK the serializer wants.
  // Only `customer_id` was copied before, so a planning user's order could
  // never validate.
  test('selectCustomer copies the relation as well as the customer id', async () => {
    const wrapper = await ready()

    wrapper.vm.selectCustomer(CUSTOMER)

    expect(wrapper.vm.order).toMatchObject({
      customer_relation: 12,
      customer_id: 'C-1263',
      order_name: 'Fictie B.V.',
      order_city: 'Bunschoten-Spakenburg',
      customer_remarks: 'gate code 1234',
    })
  })

  test('posts the order and navigates back', async () => {
    const wrapper = await readyValid()

    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'post')).toEqual(['/order/order/'])
    expect(payload('post')).toMatchObject({
      order_type: 'temps',
      customer_relation: 12,
      order_name: 'Fictie B.V.',
    })

    expect(toastTitles()).toEqual(['Created'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(wrapper.vm.isLoading).toBe(false)
    expect(wrapper.vm.buttonDisabled).toBe(false)
  })

  test('sends the dates as YYYY-MM-DD, not as Date objects', async () => {
    const wrapper = await readyValid()
    wrapper.vm.order.start_date = new Date(2026, 7, 20)
    wrapper.vm.order.end_date = new Date(2026, 7, 21)

    await wrapper.vm.submitForm()

    expect(payload('post')).toMatchObject({ start_date: '2026-08-20', end_date: '2026-08-21' })
  })

  // b-form-timepicker hands back HH:mm:ss; the schema takes either.
  test('accepts the timepicker HH:mm:ss unchanged', async () => {
    const wrapper = await readyValid()
    wrapper.vm.order.start_time = '08:30:00'

    await wrapper.vm.submitForm()

    expect(payload('post').start_time).toBe('08:30:00')
  })

  test('does not send the form-only keys with the order', async () => {
    const wrapper = await readyValid()
    wrapper.vm.order.required_users = 3
    wrapper.vm.product = 'Widget'
    wrapper.vm.addOrderLine()

    await wrapper.vm.submitForm()

    // required_users is bound by this form's template but is on no order write
    // serializer - see discardedByBackendEntries in Order.ts.
    expect(payload('post')).not.toHaveProperty('required_users')
    expect(payload('post')).not.toHaveProperty('orderlines')
  })

  test('posts the orderlines against the new order id', async () => {
    const wrapper = await readyValid()
    wrapper.vm.product = 'Widget'
    wrapper.vm.addOrderLine()

    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'post')).toEqual(['/order/order/', '/order/orderline/'])
    expect(payload('post', 1)).toMatchObject({ product: 'Widget', order: 100 })
  })

  test('offers the document page and goes there when accepted', async () => {
    window.confirm = vi.fn(() => true)
    const wrapper = await readyValid()

    await wrapper.vm.submitForm()

    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('sends nothing when the schema rejects the order', async () => {
    // A blank form has no order type, which every create serializer requires.
    const wrapper = await ready()
    wrapper.vm.selectCustomer(CUSTOMER)

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
  })

  test('does not navigate when the post fails', async () => {
    const wrapper = await readyValid()
    fakeHttp.post.mockRejectedValueOnce(new Error('boom'))

    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual(['Error'])
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.isLoading).toBe(false)
    expect(wrapper.vm.buttonDisabled).toBe(false)
  })
})

describe('OrderFormTemps - edit', () => {
  async function readyEdit() {
    const wrapper = await ready({ pk: 42 })
    await vi.waitFor(() => expect(wrapper.vm.order.id).toBe(42))
    return wrapper
  }

  test('loads the order and parses its dates', async () => {
    const wrapper = await readyEdit()

    expect(wrapper.vm.order.order_reference).toBe('REF-1')
    expect(wrapper.vm.order.start_date).toBeInstanceOf(Date)
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

  test('patches the existing orderline', async () => {
    const wrapper = await readyEdit()

    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'patch')).toEqual(['/order/order/42/', '/order/orderline/5/'])
  })

  test('deletes the orderlines removed in the form', async () => {
    const wrapper = await readyEdit()

    wrapper.vm.deleteOrderLine(0)
    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'delete')).toEqual(['/order/orderline/5/'])
  })

  // The accept step used to sit after a try/catch whose every path returned, so
  // it could not run at all.
  test('editAndAccept saves and then accepts the order', async () => {
    const wrapper = await readyEdit()

    await wrapper.vm.editAndAccept()

    expect(urlsOf(fakeHttp, 'patch')).toContain('/order/order/42/')
    expect(urlsOf(fakeHttp, 'post')).toContain('/order/order/42/set_order_accepted/')
    expect(toastTitles()).toContain('Accepted')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('reject sets the order rejected and goes back', async () => {
    const wrapper = await readyEdit()

    await wrapper.vm.reject()

    expect(urlsOf(fakeHttp, 'post')).toEqual(['/order/order/42/set_order_rejected/'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
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

describe('OrderFormTemps - orderlines', () => {
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
  })

  test('doEditOrderLine replaces the line in place', async () => {
    const wrapper = await ready()

    wrapper.vm.product = 'Widget'
    wrapper.vm.addOrderLine()
    wrapper.vm.editOrderLine({ product: 'Widget', location: '', remarks: '' }, 0)
    wrapper.vm.product = 'Gadget'
    wrapper.vm.doEditOrderLine()

    expect(wrapper.vm.order.orderlines[0]).toMatchObject({ product: 'Gadget' })
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

describe('OrderFormTemps - date range', () => {
  test('moving the start date past the end date drags the end date along', async () => {
    const wrapper = await ready()
    wrapper.vm.order.start_date = new Date(2026, 7, 20)
    wrapper.vm.order.end_date = new Date(2026, 7, 21)
    await wrapper.vm.$nextTick()

    wrapper.vm.order.start_date = new Date(2026, 7, 25)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.order.end_date).toEqual(new Date(2026, 7, 25))
  })
})

describe('OrderFormTemps - cancel', () => {
  test('goes back without touching the API', async () => {
    const wrapper = await ready()

    wrapper.vm.cancelForm()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(fakeHttp.post).not.toHaveBeenCalled()
  })
})
