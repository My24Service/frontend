import { beforeEach, describe, expect, test, vi } from 'vitest'

import OrderFormMaintenanceEmployee from '@/views/orders/OrderFormMaintenanceEmployee.vue'

import {
  mountForm,
  resetFakeHttp,
  routerGo,
  toastCreate,
  toastTitles,
  urlsOf,
} from '../../support/form-harness.js'

// This form constructs its own services (`new OrderService()` in setup), so the
// seam is the axios module every BaseModel instance takes its client from - not
// the model singletons installFakeClients() patches. See form-harness.js.
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
}

const DETAIL = {
  id: 42,
  order_type: 'maintenance',
  order_name: 'Branch Amsterdam',
  order_reference: 'REF-1',
  start_date: '20/08/2026',
  end_date: '21/08/2026',
  orderlines: [{ id: 5, product: 'Widget', location: 'Roof', remarks: '' }],
}

const ROUTES = {
  '/company/branch-my/': BRANCH,
  '/order/order/42/': DETAIL,
}

/**
 * DocumentsComponent is a child with an imperative API: the form calls
 * `orderCreated(newOrder)` on it through a template ref once the POST lands. A
 * shallowMount stub has no methods, so it needs a real one - otherwise the
 * create path throws where the app would not.
 */
const orderCreated = vi.fn()
const documentsStub = {
  template: '<div />',
  methods: { orderCreated },
}

/** The member has branches, which is what this branch-employee form assumes. */
function mount(props = {}, main = {}) {
  return mountForm(OrderFormMaintenanceEmployee, {
    props,
    main: { getMemberHasBranches: true, getCountries: [], ...main },
    stubs: { DocumentsComponent: documentsStub },
  })
}

/** Wait until created()'s async load has put an order on the component. */
async function ready(props = {}, main = {}) {
  const wrapper = mount(props, main)
  await vi.waitFor(() => expect(wrapper.vm.order).not.toBeNull())
  return wrapper
}

/** The order payload of the nth call to a verb. */
function payload(verb, index = 0) {
  return fakeHttp[verb].mock.calls[index][1]
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, ROUTES)
  toastCreate.mockClear()
  orderCreated.mockClear()
})

describe('OrderFormMaintenanceEmployee - create', () => {
  test('prefills the order from the employee branch', async () => {
    const wrapper = await ready()

    expect(wrapper.vm.order).toMatchObject({
      branch: 7,
      order_name: 'Branch Amsterdam',
      order_address: 'Kerkstraat 1',
      order_postal: '1000 AA',
      order_city: 'Amsterdam',
      order_country_code: 'NL',
    })
  })

  test('posts the order and navigates back', async () => {
    const wrapper = await ready()
    wrapper.vm.order.order_type = 'maintenance'

    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'post')).toEqual(['/order/order/'])
    expect(payload('post')).toMatchObject({
      order_type: 'maintenance',
      order_name: 'Branch Amsterdam',
      branch: 7,
    })

    expect(orderCreated).toHaveBeenCalledWith({ id: 100 })
    expect(toastTitles()).toEqual(['Created'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(wrapper.vm.isLoading).toBe(false)
    expect(wrapper.vm.buttonDisabled).toBe(false)
  })

  test('sends the dates as YYYY-MM-DD, not as Date objects', async () => {
    const wrapper = await ready()
    wrapper.vm.order.order_type = 'maintenance'
    wrapper.vm.order.start_date = new Date(2026, 7, 20)
    wrapper.vm.order.end_date = new Date(2026, 7, 21)

    await wrapper.vm.submitForm()

    expect(payload('post')).toMatchObject({
      start_date: '2026-08-20',
      end_date: '2026-08-21',
    })
  })

  test('sends nothing when the schema rejects the order', async () => {
    // A blank form has no order type, which OrderCreateSerializer requires.
    const wrapper = await ready()

    await wrapper.vm.submitForm()

    expect(fakeHttp.post).not.toHaveBeenCalled()
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.errors).toHaveProperty('order_type')
  })

  test('reports field errors only after a submit attempt', async () => {
    const wrapper = await ready()

    expect(wrapper.vm.stateOf('order_type')).toBeNull()
    expect(wrapper.vm.errorFor('order_type')).toBe('')

    await wrapper.vm.submitForm()

    expect(wrapper.vm.stateOf('order_type')).toBe(false)
    expect(wrapper.vm.errorFor('order_type')).not.toBe('')
    // A field that did validate stays clean.
    expect(wrapper.vm.stateOf('order_name')).toBe(true)
  })

  test('clears an error once the field is filled in and resubmitted', async () => {
    const wrapper = await ready()

    await wrapper.vm.submitForm()
    expect(wrapper.vm.errors).toHaveProperty('order_type')

    wrapper.vm.order.order_type = 'maintenance'
    await wrapper.vm.submitForm()

    expect(wrapper.vm.errors).toEqual({})
    expect(fakeHttp.post).toHaveBeenCalled()
  })

  // The view reads a branch employee's POST with
  // OrderCreateBranchEmployeeSerializer, where branch is `required: False` -
  // not with the tenant-dependent planning variant. A tenant without branches
  // therefore changes nothing here.
  test('does not require an owner field, whatever the tenant setting', async () => {
    const wrapper = await ready({}, { getMemberHasBranches: false })
    wrapper.vm.order.order_type = 'maintenance'
    wrapper.vm.order.branch = null

    await wrapper.vm.submitForm()

    expect(urlsOf(fakeHttp, 'post')).toEqual(['/order/order/'])
    expect(wrapper.vm.errors).toEqual({})
  })

  test('does not send the form-only keys with the order', async () => {
    const wrapper = await ready()
    wrapper.vm.order.order_type = 'maintenance'
    wrapper.vm.order.orderlines = [{ product: 'Widget' }]

    await wrapper.vm.submitForm()

    expect(payload('post')).not.toHaveProperty('orderlines')
    expect(payload('post')).not.toHaveProperty('statuses')
  })

  test('posts the orderlines against the new order id', async () => {
    const wrapper = await ready()
    wrapper.vm.order.order_type = 'maintenance'
    wrapper.vm.order.orderlines = [{ product: 'Widget' }]

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

describe('OrderFormMaintenanceEmployee - edit', () => {
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

  test('does not send branch - OrderUpdateSerializer has no such field', async () => {
    const wrapper = await readyEdit()

    await wrapper.vm.submitForm()

    expect(payload('patch')).not.toHaveProperty('branch')
  })

  test('patches an existing orderline and posts a new one', async () => {
    const wrapper = await readyEdit()

    wrapper.vm.order.orderlines.push({ product: 'Gadget' })
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

describe('OrderFormMaintenanceEmployee - orderlines', () => {
  test('editOrderLine copies the line into the entry fields', async () => {
    const wrapper = await ready()

    wrapper.vm.editOrderLine(
      { id: 5, product: 'Widget', location: 'Roof', remarks: 'note', equipment: 1, equipment_location: 2 },
      0,
    )

    expect(wrapper.vm.product).toBe('Widget')
    expect(wrapper.vm.location).toBe('Roof')
    expect(wrapper.vm.remarks).toBe('note')
    expect(wrapper.vm.equipment).toBe(1)
    expect(wrapper.vm.equipment_location).toBe(2)
    expect(wrapper.vm.isEditOrderLine).toBe(true)
  })

  test('selectEquipment takes the location with it when the equipment has one', async () => {
    const wrapper = await ready()

    wrapper.vm.selectEquipment({ id: 1, name: 'Widget', location: { id: 2, name: 'Roof' } })

    expect(wrapper.vm.equipment).toBe(1)
    expect(wrapper.vm.product).toBe('Widget')
    expect(wrapper.vm.equipment_location).toBe(2)
    expect(wrapper.vm.location).toBe('Roof')
  })

  test('deleteOrderLine removes the line and remembers it for deletion', async () => {
    const wrapper = await ready()
    wrapper.vm.order.orderlines = [{ id: 5, product: 'Widget' }]

    wrapper.vm.deleteOrderLine(0)

    expect(wrapper.vm.order.orderlines).toEqual([])
    expect(wrapper.vm.deletedOrderlines).toEqual([{ id: 5, product: 'Widget' }])
  })
})

describe('OrderFormMaintenanceEmployee - cancel', () => {
  test('goes back without touching the API', async () => {
    const wrapper = await ready()

    wrapper.vm.cancelForm()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(fakeHttp.post).not.toHaveBeenCalled()
    expect(fakeHttp.patch).not.toHaveBeenCalled()
  })
})
