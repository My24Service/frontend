import { beforeEach, describe, expect, test, vi } from 'vitest'
import VueMultiselect from 'vue-multiselect'

import EngineerEventOrderForm from '@/features/field-service/engineer-event/EngineerEventOrderForm.vue'

import { mountForm, resetFakeHttp, toastCreate } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * The attach-order modal: the whole request list it can send, as a literal —
 * read the engineer the event belongs to, search a customer, create the order,
 * assign it to that engineer, attach the assigned order to the event.
 *
 * **This file cannot use the strict API seam.** The order it creates carries no
 * `order_type` — the modal never asks for one — while every variant of the
 * POST's declared body (openapi/schema.yaml, the four `OrderCreate*Request`
 * components) requires a non-empty string, and the seam refuses a body its
 * declaration rejects. The backend's own field is `CharField(max_length=30,
 * null=True, blank=True)` (my24service apps/order/models/order.py:72), so the
 * create is legal and the document is what is wrong. The modal is therefore
 * characterised through the older client-shape harness, which is what
 * support/api-client-mock.js still exists for, and the Slice README records
 * the gap.
 *
 * The legacy screen was the third and last caller of
 * src/models/mobile/Assign.js; the assign now goes through the Slice's shared
 * useOrderAssignment, which sends the same request and was already shared by
 * the dispatch board and the trip screens.
 */

const fakeHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/services/api', () => ({default: fakeHttp, normalClient: fakeHttp}))

vi.mock('@/api/client.gen', async () => {
  const {apiClientMock} = await import('../../support/api-client-mock.js')
  return apiClientMock(fakeHttp)
})

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({create: toastCreate}),
}))

/**
 * A `b-modal` that renders its slot and answers `ok`: a real one teleports
 * its content to `document.body` and, under happy-dom, has no footer to click.
 */
const modalStub = {
  name: 'BModal',
  template: '<div><slot /><button class="modal-ok" type="button" @click="ok">ok</button></div>',
  methods: {
    show() {},
    hide() {},
    ok() {
      this.$emit('ok')
    },
  },
}

const ASSIGNED_ORDER_ID = 77
const ORDER_ID = '2026-0012'

const CUSTOMER = {
  id: 5,
  customer_id: 'C-1',
  name: 'Acme',
  address: 'Straat 1',
  city: 'Utrecht',
  postal: '1234AB',
  country_code: 'NL',
  tel: '030',
  mobile: '06',
  email: 'info@acme.nl',
  contact: 'Jan',
  remarks: 'x',
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, {
    // The generated client carries the /api prefix in its own URL; resetFakeHttp
    // matches on the path without its query string.
    '/api/company/engineer/5/': {id: 5, username: 'jan'},
    '/api/customer/customer/autocomplete/': [CUSTOMER],
  })
  fakeHttp.post.mockImplementation((url) => {
    if (String(url).startsWith('/api/mobile/assign-user/')) {
      return Promise.resolve({data: {result: 1, assigned_data: {[ORDER_ID]: ASSIGNED_ORDER_ID}}})
    }
    return Promise.resolve({data: {id: 100, order_id: ORDER_ID}})
  })
})

function mountModal() {
  return mountForm(EngineerEventOrderForm, {
    deep: true,
    stubs: {'b-modal': modalStub},
  })
}

async function openForCustomer(wrapper) {
  await wrapper.vm.show(42, 5)
  wrapper.findComponent(VueMultiselect).vm.$emit('select', CUSTOMER)
}

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('EngineerEventOrderForm', () => {
  test('opening it reads the engineer the event belongs to', async () => {
    const wrapper = mountModal()

    await wrapper.vm.show(42, 5)

    expect(requestShapes(fakeHttp, {method: 'get'})).toEqual([
      {method: 'get', path: '/api/company/engineer/5/', query: {}, body: undefined},
    ])
    expect(wrapper.text()).toContain('Search existing address')
  })

  test('the customer search asks the autocomplete for the typed term', async () => {
    const wrapper = mountModal()

    wrapper.findComponent(VueMultiselect).vm.$emit('search-change', 'acme')
    // 500 ms, the modal's own debounce.
    await new Promise((resolve) => setTimeout(resolve, 700))

    expect(requestShapes(fakeHttp, {method: 'get'})).toEqual([
      {
        method: 'get',
        path: '/api/customer/customer/autocomplete/',
        query: {q: 'acme'},
        body: undefined,
      },
    ])
    expect(wrapper.findComponent(VueMultiselect).props('options')).toEqual([CUSTOMER])
  })

  test('an empty term asks for nothing', async () => {
    const wrapper = mountModal()

    wrapper.findComponent(VueMultiselect).vm.$emit('search-change', 'acme')
    wrapper.findComponent(VueMultiselect).vm.$emit('search-change', '')
    await new Promise((resolve) => setTimeout(resolve, 700))

    expect(requestShapes(fakeHttp, {method: 'get'})).toEqual([])
  })

  test('picking a customer fills the order from it', async () => {
    const wrapper = mountModal()

    await openForCustomer(wrapper)

    expect(wrapper.text()).toContain('Acme -')
    expect(wrapper.find('#order_reference').element.value).toBe('')
  })

  test('submitting creates the order, assigns it and attaches it to the event', async () => {
    const wrapper = mountModal()
    await openForCustomer(wrapper)
    await wrapper.get('#order_reference').setValue('AB-12-CD')

    await wrapper.get('.modal-ok').trigger('click')
    await tick()

    const shapes = requestShapes(fakeHttp)
    expect(shapes.map(({method, path, query}) => ({method, path, query}))).toEqual([
      {method: 'get', path: '/api/company/engineer/5/', query: {}},
      {method: 'post', path: '/api/order/order/', query: {}},
      {method: 'post', path: '/api/mobile/assign-user/5/', query: {notify_user: '1'}},
      {method: 'patch', path: '/api/company/engineerevent-update/42/', query: {}},
    ])

    expect(shapes[1].body).toEqual({
      customer_relation: 5,
      customer_id: 'C-1',
      order_name: 'Acme',
      order_reference: 'AB-12-CD',
      order_address: 'Straat 1',
      order_city: 'Utrecht',
      order_postal: '1234AB',
      order_country_code: 'NL',
      order_tel: '030',
      order_mobile: '06',
      order_email: 'info@acme.nl',
      order_contact: 'Jan',
      customer_remarks: 'x',
      start_date: expect.stringMatching(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
      end_date: expect.stringMatching(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
    })
    expect(shapes[1].body.order_type).toBe(undefined)

    expect(shapes[2].body).toEqual({order_ids: ORDER_ID})
    expect(shapes[3].body).toEqual({assigned_order: ASSIGNED_ORDER_ID})
  })

  test('tells its parent an order was assigned', async () => {
    const wrapper = mountModal()
    await openForCustomer(wrapper)

    await wrapper.get('.modal-ok').trigger('click')
    await tick()

    expect(wrapper.emitted('assigned')).toHaveLength(1)
  })

  test('a blank licence plate rides as null, not as an empty string', async () => {
    const wrapper = mountModal()
    await openForCustomer(wrapper)

    await wrapper.get('.modal-ok').trigger('click')
    await tick()

    expect(requestShapes(fakeHttp, {method: 'post'})[0].body.order_reference).toBe(null)
  })
})
