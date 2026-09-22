import { beforeEach, describe, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'
import VueMultiselect from 'vue-multiselect'

import { EngineerEventOrderForm } from '@/features/field-service'

import {
  vAddressAutocompleteRow,
  vEngineer,
  vEngineerEventCreateOrderResponse,
} from '@/api/valibot.gen'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts } from '../../support/form-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const {toastCreate} = await import('../../support/form-harness.js')
  return {...(await importOriginal()), useToast: () => ({create: toastCreate})}
})

/**
 * The attach-order modal: the whole request list it can send, as a literal —
 * read the engineer the event belongs to, search a customer, and create the
 * order.
 *
 * **The three writes this file used to pin are one request now.** The modal
 * posted the order, assigned it to the engineer, and attached the assignment
 * to the event, in that order; a failure after the first left an order behind
 * that the retry duplicated. `POST
 * /api/company/engineerevent/{id}/create-order/` does all three in one
 * transaction, so the write list is a single POST — and the failure test below
 * says what a retry costs: one order, not two.
 *
 * Every stub is validated against the operation's own response schema, so the
 * body asserted here is the one the endpoint declares, `notify_user` included
 * (the assign request it replaces carried it as a query parameter).
 */

const api = installApiSeam()

const ENGINEER = '/api/company/engineer/{id}/'
const AUTOCOMPLETE = '/api/customer/customer/autocomplete/'
const CREATE_ORDER = '/api/company/engineerevent/{id}/create-order/'

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

/**
 * The customer row the type-ahead answers with.
 *
 * `vCustomerAutocomplete` is an `intersect` of the shared address autocomplete
 * row and the customer half, so `fixtureFor` cannot walk it (an intersect has
 * no `entries`): the address half comes from the generated row and the four
 * customer keys are written out, which is the shape the seam then checks.
 */
const CUSTOMER = {
  ...fixtureFor(vAddressAutocompleteRow, {
    id: 5,
    name: 'Acme',
    address: 'Straat 1',
    city: 'Utrecht',
    postal: '1234AB',
    country_code: 'NL',
    tel: '030',
    mobile: '06',
    email: 'info@acme.nl',
    contact: 'Jan',
  }),
  customer_id: 'C-1',
  remarks: 'x',
  products_without_tax: false,
  branch_id: null,
}

beforeEach(() => {
  api.get(ENGINEER, () => fixtureFor(vEngineer, {id: 5, username: 'jan'}))
  api.get(AUTOCOMPLETE, () => [CUSTOMER])
  // What the endpoint answers: the order it created, the assigned order it
  // made of that order, and the event both were attached to. The modal reads
  // none of it — the events list it tells to reload is what shows the order —
  // but a stub is a claim about what this endpoint returns.
  api.post(CREATE_ORDER, () => fixtureFor(vEngineerEventCreateOrderResponse, {
    order: {id: 100, order_id: ORDER_ID},
    assigned_order: ASSIGNED_ORDER_ID,
    event: 42,
  }))
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

const reads = () => api.requests().filter((request) => request.method === 'get')
const writes = () => api.requests().filter((request) => request.method !== 'get')

describe('EngineerEventOrderForm', () => {
  test('opening it reads the engineer the event belongs to', async () => {
    const wrapper = mountModal()

    await wrapper.vm.show(42, 5)
    await settle()

    expect(reads()).toEqual([
      {method: 'get', path: '/api/company/engineer/5/', query: {}},
    ])
    expect(wrapper.text()).toContain('Search existing address')
  })

  test('the customer search asks the autocomplete for the typed term', async () => {
    const wrapper = mountModal()

    wrapper.findComponent(VueMultiselect).vm.$emit('search-change', 'acme')
    // 500 ms, the modal's own debounce.
    await new Promise((resolve) => setTimeout(resolve, 700))
    await settle()

    expect(reads()).toEqual([
      {method: 'get', path: AUTOCOMPLETE, query: {q: 'acme'}},
    ])
    expect(wrapper.findComponent(VueMultiselect).props('options')).toEqual([CUSTOMER])
  })

  test('an empty term asks for nothing', async () => {
    const wrapper = mountModal()

    wrapper.findComponent(VueMultiselect).vm.$emit('search-change', 'acme')
    wrapper.findComponent(VueMultiselect).vm.$emit('search-change', '')
    await new Promise((resolve) => setTimeout(resolve, 700))
    await settle()

    expect(reads()).toEqual([])
  })

  test('picking a customer fills the order from it', async () => {
    const wrapper = mountModal()

    await openForCustomer(wrapper)

    expect(wrapper.text()).toContain('Acme -')
    expect(wrapper.find('#order_reference').element.value).toBe('')
  })

  test('submitting creates the order, assigns it and attaches it in one request', async () => {
    const wrapper = mountModal()
    await openForCustomer(wrapper)
    await wrapper.get('#order_reference').setValue('AB-12-CD')

    await wrapper.get('.modal-ok').trigger('click')
    await settle()

    // The whole wire, not only the write: the create the modal used to make
    // (`POST /api/order/order/`), the assign after it
    // (`POST /api/mobile/assign-user/5/`) and the attach after that
    // (`PATCH /api/company/engineerevent-update/42/`) are all gone, and one
    // request carries the three.
    const shapes = api.requests()
    expect(shapes.map(({method, path, query}) => ({method, path, query}))).toEqual([
      {method: 'get', path: '/api/company/engineer/5/', query: {}},
      {method: 'post', path: '/api/company/engineerevent/42/create-order/', query: {}},
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
      // The notification the assign request sent as `?notify_user=1`, now a
      // body field. The endpoint's own default is the same true, so the
      // engineer is still told the order landed on their planning.
      notify_user: true,
    })
    // No order type (the modal never asks for one) and no engineer: the event
    // names the engineer, and the endpoint always assigns that one.
    expect(shapes[1].body.order_type).toBe(undefined)
    expect(shapes[1].body.engineer).toBe(undefined)
  })

  test('a refused create leaves no order behind, and the retry is one order', async () => {
    // The endpoint's own failure shape: order-field validation one level
    // deeper than the order-create endpoint's 400 — `{'order': {<field>: [...]}}`.
    let attempts = 0
    api.post(CREATE_ORDER, () => {
      attempts += 1
      return attempts === 1
        ? HttpResponse.json(
            {order: {order_name: ['This field is required.']}},
            {status: 400},
          )
        : fixtureFor(vEngineerEventCreateOrderResponse, {
            order: {id: 100, order_id: ORDER_ID},
            assigned_order: ASSIGNED_ORDER_ID,
            event: 42,
          })
    })

    const wrapper = mountModal()
    await openForCustomer(wrapper)
    await wrapper.get('#order_reference').setValue('AB-12-CD')

    await wrapper.get('.modal-ok').trigger('click')
    await settle()

    expect(toasts().map((toast) => toast.body)).toEqual(['Error creating/assigning order'])
    expect(writes()).toHaveLength(1)
    // Nothing was created before the failure, so there is no orphan order for
    // the retry to duplicate: the request that used to make one is not made at
    // all, and neither is the assign or the attach that followed it.
    expect(api.requests().some((request) => request.path === '/api/order/order/')).toBe(false)
    expect(api.requests().some((request) => request.path === '/api/mobile/assign-user/5/')).toBe(false)
    // The modal stays open on the values the user typed, and the list is not
    // told the event has an order.
    expect(wrapper.find('#order_reference').element.value).toBe('AB-12-CD')
    expect(wrapper.emitted('assigned')).toBeUndefined()

    await wrapper.get('.modal-ok').trigger('click')
    await settle()

    expect(writes().map(({method, path}) => ({method, path}))).toEqual([
      {method: 'post', path: '/api/company/engineerevent/42/create-order/'},
      {method: 'post', path: '/api/company/engineerevent/42/create-order/'},
    ])
    expect(wrapper.emitted('assigned')).toHaveLength(1)
    // The one failure was reported once, and the retry that landed said
    // nothing: the list's own "Order created and assigned" is the success copy.
    expect(toasts().map((toast) => toast.body)).toEqual(['Error creating/assigning order'])
  })

  test('tells its parent an order was assigned', async () => {
    const wrapper = mountModal()
    await openForCustomer(wrapper)

    await wrapper.get('.modal-ok').trigger('click')
    await settle()

    expect(wrapper.emitted('assigned')).toHaveLength(1)
  })

  test('a blank licence plate rides as null, not as an empty string', async () => {
    const wrapper = mountModal()
    await openForCustomer(wrapper)

    await wrapper.get('.modal-ok').trigger('click')
    await settle()

    const create = writes().find((request) => request.path === '/api/company/engineerevent/42/create-order/')
    expect(create.body.order_reference).toBe(null)
  })
})
