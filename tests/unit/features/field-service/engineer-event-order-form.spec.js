import { beforeEach, describe, expect, test, vi } from 'vitest'

import EngineerEventOrderForm from '@/views/company/EngineerEventOrderForm.vue'

import { mountForm, resetFakeHttp, toastCreate } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Characterisation of the attach-order modal, written against the LEGACY screen
 * before it moves into `src/features/field-service/engineer-event/`.
 *
 * The whole request list the modal can send is pinned below as a literal: read
 * the engineer the event belongs to, search a customer, create the order,
 * assign it to that engineer, attach the assigned order to the event.
 *
 * **This file cannot use the strict API seam.** The order it creates is
 * `orderModel.getFields()`, whose `order_type` is the form's own default
 * `null` — `OrderFormSchema` starts from `vOrderCreateWritable` and nothing in
 * this modal picks a type — while every variant of `vOrderCreateRequestRequest`
 * (the POST's declared body, `openapi/schema.yaml` `OrderCreate*Request`)
 * requires `order_type` to be a non-empty string. The seam refuses a body its
 * declaration rejects, so the modal is characterised through the older
 * client-shape harness, which is what `support/api-client-mock.js` still
 * exists for. The backend's own field is
 * `models.Order.order_type = CharField(max_length=30, null=True, blank=True)`
 * (my24service `apps/order/models/order.py:72`), so the document is what is
 * wrong here, not the request. The conversion keeps `orderModel.insert` for it
 * and the Slice README records why.
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

const NEW_ORDER = {id: 100, order_id: '2026-0012'}
const ASSIGNED_ORDER_ID = 77

beforeEach(() => {
  resetFakeHttp(fakeHttp, {
    '/company/engineer/5/': {id: 5, username: 'jan'},
    '/customer/customer/autocomplete/': [
      {
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
      },
    ],
  })
  fakeHttp.post.mockImplementation((url) => {
    if (String(url).startsWith('/api/mobile/assign-user/')) {
      return Promise.resolve({data: {result: 1, assigned_data: {'2026-0012': ASSIGNED_ORDER_ID}}})
    }
    return Promise.resolve({data: NEW_ORDER})
  })
})

function mountModal() {
  return mountForm(EngineerEventOrderForm, {
    deep: true,
    stubs: {
      'b-modal': {template: '<div><slot /></div>', methods: {show() {}, hide() {}}},
    },
  })
}

describe('EngineerEventOrderForm', () => {
  test('opening it reads the engineer the event belongs to', async () => {
    const wrapper = mountModal()

    await wrapper.vm.show(42, 5)

    expect(requestShapes(fakeHttp, {method: 'get'})).toEqual([
      {method: 'get', path: '/api/company/engineer/5/', query: {}, body: undefined},
    ])
    expect(wrapper.vm.engineer).toEqual({id: 5, username: 'jan'})
  })

  test('the customer search asks the autocomplete for the typed term', async () => {
    const wrapper = mountModal()

    await wrapper.vm.getCustomers('acme')

    expect(requestShapes(fakeHttp, {method: 'get'})).toEqual([
      {
        method: 'get',
        path: '/api/customer/customer/autocomplete/',
        query: {q: 'acme'},
        body: undefined,
      },
    ])
    expect(wrapper.vm.customers[0].name).toBe('Acme')
  })

  test('picking a customer fills the order from it', async () => {
    const wrapper = mountModal()

    wrapper.vm.selectCustomer({
      id: 5, customer_id: 'C-1', name: 'Acme', address: 'Straat 1', city: 'Utrecht',
      postal: '1234AB', country_code: 'NL', tel: '030', mobile: '06',
      email: 'info@acme.nl', contact: 'Jan', remarks: 'x',
    })

    expect(wrapper.vm.order).toMatchObject({
      customer_relation: 5,
      customer_id: 'C-1',
      order_name: 'Acme',
      order_city: 'Utrecht',
    })
  })

  describe('submitting', () => {
    test('creates the order, assigns it and attaches it to the event', async () => {
      const wrapper = mountModal()
      await wrapper.vm.show(42, 5)
      wrapper.vm.selectCustomer({
        id: 5, customer_id: 'C-1', name: 'Acme', address: 'Straat 1', city: 'Utrecht',
        postal: '1234AB', country_code: 'NL', tel: '030', mobile: '06',
        email: 'info@acme.nl', contact: 'Jan', remarks: 'x',
      })
      wrapper.vm.order.order_reference = 'AB-12-CD'

      await wrapper.vm.submitForm()

      const shapes = requestShapes(fakeHttp)
      expect(shapes.map(({method, path, query}) => ({method, path, query}))).toEqual([
        {method: 'get', path: '/api/company/engineer/5/', query: {}},
        {method: 'post', path: '/api/order/order/', query: {}},
        {method: 'post', path: '/api/mobile/assign-user/5/', query: {notify_user: '1'}},
        {method: 'patch', path: '/api/company/engineerevent-update/42/', query: {}},
      ])

      expect(shapes[1].body).toMatchObject({
        customer_relation: 5,
        customer_id: 'C-1',
        order_name: 'Acme',
        order_address: 'Straat 1',
        order_city: 'Utrecht',
        order_postal: '1234AB',
        order_country_code: 'NL',
        order_tel: '030',
        order_mobile: '06',
        order_email: 'info@acme.nl',
        order_contact: 'Jan',
        customer_remarks: 'x',
        order_reference: 'AB-12-CD',
      })
      // The create body is the form's whole bag, type included — see the header.
      expect(shapes[1].body.order_type).toBe(null)
      expect(shapes[1].body.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(shapes[1].body.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)

      expect(shapes[2].body).toEqual({order_ids: '2026-0012'})
      expect(shapes[3].body).toEqual({assigned_order: ASSIGNED_ORDER_ID})
    })

    test('tells its parent an order was assigned and hides', async () => {
      const wrapper = mountModal()
      await wrapper.vm.show(42, 5)
      wrapper.vm.selectCustomer({
        id: 5, customer_id: 'C-1', name: 'Acme', address: 'Straat 1', city: 'Utrecht',
        postal: '1234AB', country_code: 'NL', tel: '030', mobile: '06',
        email: 'info@acme.nl', contact: 'Jan', remarks: 'x',
      })

      await wrapper.vm.submitForm()

      expect(wrapper.emitted('assigned')).toHaveLength(1)
    })
  })
})
