import { beforeEach, describe, expect, test, vi } from 'vitest'
import VueMultiselect from 'vue-multiselect'

import EngineerEventOrderForm from '@/features/field-service/engineer-event/EngineerEventOrderForm.vue'

import {
  vAddressAutocompleteRow,
  vAssignOrdersResponse,
  vEngineer,
  vOrderCreateCustomer,
  vResultResponse,
} from '@/api/valibot.gen'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const {toastCreate} = await import('../../support/form-harness.js')
  return {...(await importOriginal()), useToast: () => ({create: toastCreate})}
})

/**
 * The attach-order modal: the whole request list it can send, as a literal —
 * read the engineer the event belongs to, search a customer, create the order,
 * assign it to that engineer, attach the assigned order to the event.
 *
 * **This file used the older client-shape harness until the document caught
 * up.** Two gaps kept it there: every variant of the POST's declared body
 * required `order_type`, which this modal never asks for (the model field is
 * `CharField(max_length=30, null=True, blank=True)`, my24service
 * `apps/order/models/order.py:72`), and the attach PATCH read `assigned_order`
 * without declaring it. Both are declared now — the create bodies no longer
 * require a type and the PATCH's body is `PatchedEngineerEventAttachOrderRequest` —
 * so the create goes out uncast and the seam validates every request against
 * the operation's own component, and every stub against its response.
 *
 * The legacy screen was the third and last caller of
 * src/models/mobile/Assign.js; the assign now goes through the Slice's shared
 * useOrderAssignment, which sends the same request and was already shared by
 * the dispatch board and the trip screens.
 */

const api = installApiSeam()

const ENGINEER = '/api/company/engineer/{id}/'
const AUTOCOMPLETE = '/api/customer/customer/autocomplete/'
const ORDER = '/api/order/order/'
const ASSIGN = '/api/mobile/assign-user/{id}/'
const ATTACH = '/api/company/engineerevent-update/{id}/'

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
  // The created order, as the create endpoint answers it: the customer variant
  // of the read union the operation declares (the modal creates customer
  // orders). `order_id` is the field the modal forwards to the assignment.
  api.post(ORDER, () => fixtureFor(vOrderCreateCustomer, {id: 100, order_id: ORDER_ID}))
  api.post(ASSIGN, () => fixtureFor(vAssignOrdersResponse, {
    result: 1,
    assigned_data: {[ORDER_ID]: ASSIGNED_ORDER_ID},
  }))
  api.patch(ATTACH, () => fixtureFor(vResultResponse, {result: true}))
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

  test('submitting creates the order, assigns it and attaches it to the event', async () => {
    const wrapper = mountModal()
    await openForCustomer(wrapper)
    await wrapper.get('#order_reference').setValue('AB-12-CD')

    await wrapper.get('.modal-ok').trigger('click')
    await settle()

    const shapes = api.requests()
    expect(shapes.map(({method, path, query}) => ({method, path, query}))).toEqual([
      {method: 'get', path: '/api/company/engineer/5/', query: {}},
      {method: 'post', path: ORDER, query: {}},
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
    // The body names no type, and the seam now validates it against
    // `vOrderCreateRequestRequest` — the create above is that check passing.
    expect(shapes[1].body.order_type).toBe(undefined)

    expect(shapes[2].body).toEqual({order_ids: ORDER_ID})
    expect(shapes[3].body).toEqual({assigned_order: ASSIGNED_ORDER_ID})
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

    const create = api.requests().find((request) => request.method === 'post' && request.path === ORDER)
    expect(create.body.order_reference).toBe(null)
  })
})
