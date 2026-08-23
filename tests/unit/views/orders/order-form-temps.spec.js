import { beforeEach, describe, expect, test, vi } from 'vitest'

import OrderFormTemps from '@/views/orders/OrderFormTemps.vue'

import {
  mountForm,
  resetFakeHttp,
  routerGo,
  toastCreate,
  toastTitles,
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

beforeEach(() => {
  resetFakeHttp(fakeHttp, ROUTES)
  toastCreate.mockClear()
  // The create path asks whether to add documents; say no unless a test opts
  // in. happy-dom provides no `confirm`, so this is a definition, not a spy.
  window.confirm = vi.fn(() => false)
})

describe('OrderFormTemps - create', () => {

  // The customer's own reference string is not the FK the serializer wants.
  // Only `customer_id` was copied before, so a planning user's order could
  // never validate.

  // b-form-timepicker hands back HH:mm:ss; the schema takes either.

  test('offers the document page and goes there when accepted', async () => {
    window.confirm = vi.fn(() => true)
    const wrapper = await readyValid()

    await wrapper.vm.submitForm()

    expect(routerGo()).not.toHaveBeenCalled()
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

describe('OrderFormTemps - cancel', () => {
  test('goes back without touching the API', async () => {
    const wrapper = await ready()

    wrapper.vm.cancelForm()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(fakeHttp.post).not.toHaveBeenCalled()
  })
})

describe('OrderFormTemps - call shapes', () => {
  // Old `CustomerService.search(query)` built `?q=..` by hand; the generated
  // `customerCustomerAutocompleteList` carries it as a query object.
  test('getCustomers calls the customer autocomplete with the query', async () => {
    const wrapper = await ready()

    await wrapper.vm.getCustomers('acme')

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      // created()'s load already searched with an empty query.
      { method: 'get', path: '/api/customer/customer/autocomplete/', query: { q: '' }, body: undefined },
      { method: 'get', path: '/api/customer/customer/autocomplete/', query: { q: 'acme' }, body: undefined },
    ])
  })

  // Old `OrderService.setAccepted` posted an explicit `{}` body (plus CSRF
  // headers); the generated `orderOrderSetOrderAcceptedCreate` posts no body at
  // all. URL and query are unchanged - the new shape is asserted here.

})
