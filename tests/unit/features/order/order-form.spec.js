import { beforeEach, describe, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'

import { OrderForm } from '@/features/order'
import { nextWorkingDay } from '@/features/order/form/schemas'
import { toApiDate } from '@/features/forms/dates'
import {
  vAssignOrdersResponse,
  vAssignResultResponse,
  vBranch,
  vCustomer,
  vEngineerForSelect,
  vEquipment,
  vOrderCreate,
  vOrderDetail,
  vOrderSeedResponse,
  vOrderUpdate,
  vSetOrderAcceptedResponse,
} from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { orderRoutes } from '../../support/order-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const UUID = '2f1c9a2e-5b7d-4c3a-9e8f-1a2b3c4d5e6f'
const TOMORROW = toApiDate(nextWorkingDay())

const MAIN = {
  getMemberType: 'maintenance', getFlavour: 'maintenance',
  getMemberHasBranches: false,
  getMemberUsesEquipment: false,
  getCountries: [{ value: 'NL', text: 'NL' }],
  getOrderTypes: ['Maintenance', 'Repair'],
  getSettingEquipmentPlanningQuickCreate: false,
  getSettingEquipmentLocationPlanningQuickCreate: false,
  getSettingEquipmentQuickCreate: false,
  getSettingEquipmentLocationQuickCreate: false,
  getMaintenanceEquipment: null,
}

const PLANNING = { isPlanning: true, isStaff: false, isSuperuser: false, isAdmin: false, isBranchEmployee: false, isCustomer: false }
const EMPLOYEE = { isPlanning: false, isStaff: false, isSuperuser: false, isAdmin: false, isBranchEmployee: true, isCustomer: false }
const CUSTOMER = {
  isPlanning: false, isStaff: false, isSuperuser: false, isAdmin: false, isBranchEmployee: false, isCustomer: true,
  userInfo: { customer_user: { customer: 7 } },
}

const AUTOCOMPLETE_CUSTOMER = {
  id: 7,
  name: 'Acme BV',
  address: 'Main 1',
  postal: '1234AB',
  city: 'Gouda',
  country_code: 'NL',
  contact: 'Jan de Vries',
  tel: '+31101234567',
  mobile: '+31612345678',
  email: 'info@acme.example',
  value: 'Acme BV',
  customer_id: '5013',
  remarks: 'gate code 1234',
  products_without_tax: false,
  branch_id: null,
}

const CONTACT_BODY = {
  customer_id: '5013',
  customer_remarks: 'gate code 1234',
  order_name: 'Acme BV',
  order_address: 'Main 1',
  order_postal: '1234AB',
  order_city: 'Gouda',
  order_country_code: 'NL',
  order_tel: '+31101234567',
  order_mobile: '+31612345678',
  order_email: 'info@acme.example',
  order_contact: 'Jan de Vries',
}

const CREATED = () => ({
  ...fixtureFor(vOrderCreate, { id: 42, order_id: '2026-042', order_type: 'Maintenance', order_name: 'Acme BV' }),
  customer_relation: 7,
  orderlines: [{ id: 502, product: 'Boiler', location: 'Cellar', remarks: 'leaks' }],
  infolines: [{ id: 602, info: 'call first' }],
})

const DETAIL = (overrides = {}) =>
  fixtureFor(vOrderDetail, {
    id: 42,
    uuid: UUID,
    order_id: '2026-042',
    order_type: 'Maintenance',
    order_name: 'Acme BV',
    order_address: 'Main 1',
    order_postal: '1234AB',
    order_city: 'Gouda',
    order_country_code: 'NL',
    customer_id: '5013',
    customer_relation: 7,
    start_date: '02/01/2026',
    end_date: '03/01/2026',
    start_date_iso: '2026-01-02',
    end_date_iso: '2026-01-03',
    start_time: '08:00:00',
    end_time: null,
    customer_order_accepted: true,
    order_email_extra: ['sales@acme.example'],
    planning_remarks: 'bring keys',
    assigned_user_info: [{ user_id: 9, full_name: 'Piet', license_plate: null }],
    orderlines: [{ id: 501, product: 'Boiler', location: 'Cellar', remarks: '', equipment_view: null, equipment_location_view: null }],
    infolines: [{ id: 601, order: 42, info: 'call first' }],
    documents: [],
    statuses: [],
    invoices: [],
    workorder_documents: [],
    workorder_documents_partners: [],
    workorder_documents_org_order: [],
    workorder_pdf_url_partner: [],
    copied_order_data: [],
    reported_codes_extra_data: [],
    parent_order_data: {},
    workorder_url_org_order: null,
    ...overrides,
  })

const multiselectStub = {
  props: ['options', 'modelValue'],
  emits: ['select', 'search-change', 'update:modelValue', 'tag'],
  methods: { deactivate: vi.fn() },
  template: '<div class="multiselect-stub"><input ref="search" value="" /><slot name="noResult" /></div>',
}

const datePickerStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<div class="datepicker-stub" />',
}

const modalShellStub = {
  emits: ['ok', 'cancel'],
  methods: { show() {}, hide() {} },
  template: '<div><slot /><button type="button" class="quick-create-ok" @click="$emit(\'ok\')">OK</button></div>',
}

async function mountOrderForm({ props = {}, auth = PLANNING, main = {} } = {}) {
  const wrapper = mountForm(OrderForm, {
    deep: true,
    routes: orderRoutes,
    props,
    auth,
    main: { ...MAIN, ...main },
    stubs: {
      VueMultiselect: multiselectStub,
      VueDatePicker: datePickerStub,
      'b-modal': modalShellStub,
      // no meaningful DOM under happy-dom; the panel reads the chosen files
      // off the change event, which the stub emits verbatim
      'b-form-file': { emits: ['change'], template: '<input type="file" @change="$emit(\'change\', $event)" />' },
    },
  })
  await settle()
  return wrapper
}

function multiselects(wrapper) {
  return wrapper.findAllComponents(multiselectStub)
}

/** The multiselect with this element id, whichever order the variant renders them in. */
function multiselect(wrapper, id) {
  const picker = multiselects(wrapper).find((component) => component.attributes('id') === id)
  if (!picker) throw new Error(`no multiselect '${id}'`)
  return picker
}

async function clickButton(wrapper, text) {
  const buttons = wrapper.findAll('button').filter((b) => b.text() === text)
  const button = buttons.find((b) => b.isVisible()) ?? buttons[0]
  if (!button) throw new Error(`no button labelled "${text}"`)
  await button.trigger('click')
}

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 600))
  await settle()
}

async function fillMinimum(wrapper) {
  await multiselect(wrapper, 'order-owner-search').vm.$emit('select', AUTOCOMPLETE_CUSTOMER)
  await wrapper.get('#order_type').setValue('Maintenance')
}

async function stageOrderline(wrapper, { product = 'Boiler', location = 'Cellar', remarks = 'leaks' } = {}) {
  await wrapper.get('#order-orderline-product').setValue(product)
  await wrapper.get('#order-orderline-location').setValue(location)
  await wrapper.get('#order-orderline-remarks').setValue(remarks)
  await clickButton(wrapper, 'Add orderline')
}

beforeEach(() => {
  api.get('/api/company/engineer/list-for-select/', [
    fixtureFor(vEngineerForSelect, { user_id: 9, full_name: 'Piet' }),
    fixtureFor(vEngineerForSelect, { user_id: 10, full_name: 'Klaas' }),
  ])
  api.get('/api/customer/customer/autocomplete/', [AUTOCOMPLETE_CUSTOMER])
  api.get('/api/order/order/{id}/', DETAIL())
  api.post('/api/order/order/', CREATED(), { status: 201 })
  api.patch('/api/order/order/{id}/', fixtureFor(vOrderUpdate, { order_type: 'Maintenance', order_name: 'Acme BV', start_date: '2026-01-02', end_date: '2026-01-03' }))
  api.post('/api/mobile/assign-user/{id}/', fixtureFor(vAssignOrdersResponse, { result: 1, assigned_data: {} }))
  api.post('/api/mobile/unassign-user/{id}/', fixtureFor(vAssignResultResponse, { result: 1 }))
  api.post('/api/order/order/{id}/set_order_accepted/', fixtureFor(vSetOrderAcceptedResponse, {}))
  api.post('/api/order/order/{id}/set_order_rejected/', fixtureFor(vSetOrderAcceptedResponse, {}))
  api.get('/api/company/branch-my/', fixtureFor(vBranch, { id: 3, name: 'Depot West', address: 'Kade 2', postal: '2000AA', city: 'Rotterdam', country_code: 'NL' }))
  api.get('/api/customer/customer/{id}/', fixtureFor(vCustomer, { id: 7, name: 'Acme BV', customer_id: '5013', address: 'Main 1', postal: '1234AB', city: 'Gouda', country_code: 'NL' }))
  // The seed read answers nulls by default; the describes that seed from a
  // quotation or a maintenance contract register their own answer.
  api.get('/api/order/order/new/', fixtureFor(vOrderSeedResponse))
})

describe('OrderForm, planning create (no branches)', () => {
  test('mounts with the engineer select list as its only read', async () => {
    await mountOrderForm()

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/company/engineer/list-for-select/', query: {}, body: undefined },
    ])
  })

  test('searches customers by query, debounced half a second', async () => {
    const wrapper = await mountOrderForm()

    await multiselect(wrapper, 'order-owner-search').vm.$emit('search-change', 'acme')
    await settle()
    expect(api.requests().map((r) => r.path)).not.toContain('/api/customer/customer/autocomplete/')

    await pastDebounce()

    expect(api.requests().at(-1)).toEqual({
      method: 'get', path: '/api/customer/customer/autocomplete/', query: { q: 'acme' }, body: undefined,
    })
  })

  test('choosing a customer fills the contact block', async () => {
    const wrapper = await mountOrderForm()

    await multiselect(wrapper, 'order-owner-search').vm.$emit('select', AUTOCOMPLETE_CUSTOMER)
    await settle()

    expect(wrapper.get('#order_name').element.value).toBe('Acme BV')
    expect(wrapper.get('#customer_id').element.value).toBe('5013')
    expect(wrapper.get('#order_address').element.value).toBe('Main 1')
    expect(wrapper.get('#customer_remarks').element.value).toBe('gate code 1234')
  })

  test('validation blocks an empty submit with no write', async () => {
    const wrapper = await mountOrderForm()

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(api.requests().filter((r) => r.method !== 'get')).toEqual([])
    expect(wrapper.text()).toContain('Please select a customer')
    expect(wrapper.text()).toContain('Please select an order type')
  })

  test('posts the order with its orderlines and infolines in one write, then the engineer, then goes back', async () => {
    const wrapper = await mountOrderForm()
    await fillMinimum(wrapper)
    await wrapper.get('#order_reference').setValue('REF-1')
    await wrapper.get('#start_time').setValue('8:30')
    await stageOrderline(wrapper)
    await wrapper.get('#order-infoline-info').setValue('call first')
    await clickButton(wrapper, 'add')
    await multiselect(wrapper, 'order-assign').vm.$emit('update:modelValue', [{ user_id: 9, full_name: 'Piet' }])
    await settle()

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(api.requests().filter((r) => r.method !== 'get')).toEqual([
      {
        method: 'post',
        path: '/api/order/order/',
        query: {},
        body: {
          ...CONTACT_BODY,
          customer_relation: 7,
          order_type: 'Maintenance',
          order_reference: 'REF-1',
          start_date: TOMORROW,
          end_date: TOMORROW,
          start_time: '08:30:00',
          order_email_extra: [],
          orderlines: [{ product: 'Boiler', location: 'Cellar', remarks: 'leaks' }],
          infolines: [{ info: 'call first' }],
        },
      },
      { method: 'post', path: '/api/mobile/assign-user/9/', query: { notify_user: '1' }, body: { order_ids: '2026-042' } },
    ])
    expect(toasts().map((t) => t.title)).toEqual(['Assigned', 'Created'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('an order with orderlines and infolines is exactly one write request', async () => {
    const wrapper = await mountOrderForm()
    await fillMinimum(wrapper)
    await stageOrderline(wrapper)
    await wrapper.get('#order-infoline-info').setValue('call first')
    await clickButton(wrapper, 'add')

    await clickButton(wrapper, 'Submit')
    await settle()

    const writes = api.requests().filter((r) => r.method !== 'get')
    expect(writes).toHaveLength(1)
    expect(writes[0]).toMatchObject({
      method: 'post',
      path: '/api/order/order/',
      body: {
        orderlines: [{ product: 'Boiler', location: 'Cellar', remarks: 'leaks' }],
        infolines: [{ info: 'call first' }],
      },
    })
  })

  test('a retry after a failed assignment carries the ids the create returned, so the rows are updated rather than replaced', async () => {
    api.post('/api/mobile/assign-user/{id}/', () => HttpResponse.json({ detail: 'nope' }, { status: 500 }))
    const wrapper = await mountOrderForm()
    await fillMinimum(wrapper)
    await stageOrderline(wrapper)
    await wrapper.get('#order-infoline-info').setValue('call first')
    await clickButton(wrapper, 'add')
    await multiselect(wrapper, 'order-assign').vm.$emit('update:modelValue', [{ user_id: 9, full_name: 'Piet' }])
    await settle()

    await clickButton(wrapper, 'Submit')
    await settle()
    expect(routerGo()).not.toHaveBeenCalled()

    await clickButton(wrapper, 'Submit')
    await settle()

    const retry = api.requests().filter((r) => r.path === '/api/order/order/42/')
    expect(retry).toHaveLength(1)
    expect(retry[0]).toMatchObject({
      method: 'patch',
      body: {
        orderlines: [{ id: 502, product: 'Boiler', location: 'Cellar', remarks: 'leaks' }],
        infolines: [{ id: 602, info: 'call first' }],
      },
    })
  })

  test('a blank time is absent from the body and a bad one blocks the submit', async () => {
    const wrapper = await mountOrderForm()
    await fillMinimum(wrapper)
    await wrapper.get('#end_time').setValue('later')

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(api.requests().filter((r) => r.method !== 'get')).toEqual([])
    expect(wrapper.text()).toContain('Please enter a valid end time HH:mm')

    await wrapper.get('#end_time').setValue('')
    await clickButton(wrapper, 'Submit')
    await settle()

    const post = api.requests().find((r) => r.method === 'post')
    expect(post.body).not.toHaveProperty('start_time')
    expect(post.body).not.toHaveProperty('end_time')
  })

  test('"Submit and open dispatch" goes to the dispatch screen instead of back', async () => {
    const wrapper = await mountOrderForm()
    await fillMinimum(wrapper)
    const push = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue()

    await clickButton(wrapper, 'Submit and open dispatch')
    await settle()

    expect(api.requests().filter((r) => r.method === 'post').map((r) => r.path)).toEqual(['/api/order/order/'])
    expect(push).toHaveBeenCalledWith({ name: 'mobile-dispatch' })
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('a failed post toasts and stays on the form', async () => {
    api.post('/api/order/order/', new HttpResponse(JSON.stringify({ detail: 'nope' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }))
    const wrapper = await mountOrderForm()
    await fillMinimum(wrapper)

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(toasts().map((t) => t.title)).toEqual(['Error'])
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('OrderForm, planning edit', () => {
  test('loads the order and seeds the rows, the assignees and the extra recipients', async () => {
    const wrapper = await mountOrderForm({ props: { pk: '42' } })

    expect(api.requests().map((r) => r.path)).toEqual([
      '/api/company/engineer/list-for-select/',
      '/api/order/order/42/',
    ])
    expect(wrapper.get('#order_name').element.value).toBe('Acme BV')
    expect(wrapper.get('#start_time').element.value).toBe('08:00')
    expect(wrapper.get('#planning_remarks').element.value).toBe('bring keys')
    expect(wrapper.text()).toContain('Boiler')
    expect(wrapper.text()).toContain('call first')
    expect(wrapper.text()).toContain('Piet')
  })

  test('saving PATCHes the order with the kept and new rows, the removed one absent, then unassigns', async () => {
    const wrapper = await mountOrderForm({ props: { pk: '42' } })
    await stageOrderline(wrapper, { product: 'Pump', location: 'Roof', remarks: '' })
    await wrapper.get('.info-lines a[title="Delete"]').trigger('click')
    await wrapper.get('button[title="Unassign"]').trigger('click')

    await clickButton(wrapper, 'Submit')
    await settle()

    const writes = api.requests().filter((r) => r.method !== 'get')
    expect(writes[0]).toEqual({
      method: 'patch',
      path: '/api/order/order/42/',
      query: {},
      body: {
        customer_id: '5013',
        order_type: 'Maintenance',
        start_date: '2026-01-02',
        end_date: '2026-01-03',
        start_time: '08:00:00',
        order_name: 'Acme BV',
        order_address: 'Main 1',
        order_postal: '1234AB',
        order_city: 'Gouda',
        order_country_code: 'NL',
        customer_relation: 7,
        order_email_extra: ['sales@acme.example'],
        planning_remarks: 'bring keys',
        orderlines: [
          { id: 501, product: 'Boiler', location: 'Cellar', remarks: '' },
          { product: 'Pump', location: 'Roof', remarks: '' },
        ],
        infolines: [],
      },
    })
    expect(writes.slice(1)).toEqual([
      { method: 'post', path: '/api/mobile/unassign-user/9/', query: {}, body: { order_pk: 42 } },
    ])
    expect(toasts().map((t) => t.title)).toEqual(['Updated'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a refused unassign reports the engineer and keeps the user on the form', async () => {
    api.post('/api/mobile/unassign-user/{id}/', fixtureFor(vAssignResultResponse, { result: 0 }))
    const wrapper = await mountOrderForm({ props: { pk: '42' } })
    await wrapper.get('button[title="Unassign"]').trigger('click')

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(toasts().map((t) => t.body)).toContain('Piet has booked hours or materials')
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('"Save & accept" is offered for an unaccepted order and posts the acceptance after the save', async () => {
    api.get('/api/order/order/{id}/', DETAIL({ customer_order_accepted: false }))
    const wrapper = await mountOrderForm({ props: { pk: '42' } })

    await clickButton(wrapper, 'Save & accept')
    await settle()

    const paths = api.requests().filter((r) => r.method !== 'get').map((r) => `${r.method} ${r.path}`)
    expect(paths[0]).toBe('patch /api/order/order/42/')
    expect(paths.at(-1)).toBe('post /api/order/order/42/set_order_accepted/')
    expect(toasts().map((t) => t.title)).toEqual(['Accepted', 'Updated'])
  })

  test('"Reject" rejects and leaves without saving', async () => {
    api.get('/api/order/order/{id}/', DETAIL({ customer_order_accepted: false }))
    const wrapper = await mountOrderForm({ props: { pk: '42' } })

    await clickButton(wrapper, 'Reject')
    await settle()

    expect(api.requests().filter((r) => r.method !== 'get')).toEqual([
      { method: 'post', path: '/api/order/order/42/set_order_rejected/', query: {}, body: undefined },
    ])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('an accepted order offers neither button', async () => {
    const wrapper = await mountOrderForm({ props: { pk: '42' } })

    expect(wrapper.findAll('button').map((b) => b.text())).not.toContain('Reject')
  })
})

describe('OrderForm, branch employee create', () => {
  test('reads the seed for their own branch, fills the contact block from it, and posts the employee body', async () => {
    api.get('/api/order/order/new/', fixtureFor(vOrderSeedResponse, {
      branch: fixtureFor(vBranch, { id: 3, name: 'Depot West', address: 'Kade 2', postal: '2000AA', city: 'Rotterdam', country_code: 'NL' }),
    }))
    const wrapper = await mountOrderForm({ auth: EMPLOYEE, main: { getMemberHasBranches: true } })

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/order/order/new/', query: {}, body: undefined },
    ])
    expect(wrapper.get('#order_name').element.value).toBe('Depot West')
    expect(multiselects(wrapper)).toHaveLength(0)

    await wrapper.get('#order_type').setValue('Repair')
    await clickButton(wrapper, 'Submit')
    await settle()

    expect(api.requests().filter((r) => r.method === 'post')).toEqual([
      {
        method: 'post',
        path: '/api/order/order/',
        query: {},
        body: {
          order_type: 'Repair',
          start_date: TOMORROW,
          end_date: TOMORROW,
          order_name: 'Depot West',
          order_address: 'Kade 2',
          order_postal: '2000AA',
          order_city: 'Rotterdam',
          order_country_code: 'NL',
          branch: 3,
          order_email_extra: [],
          orderlines: [],
        },
      },
    ])
  })
})

describe('OrderForm, customer create', () => {
  test('reads the seed for their own customer, fills the contact block, and posts the customer body without an owner', async () => {
    api.get('/api/order/order/new/', fixtureFor(vOrderSeedResponse, {
      customer: fixtureFor(vCustomer, { id: 7, name: 'Acme BV', customer_id: '5013', address: 'Main 1', postal: '1234AB', city: 'Gouda', country_code: 'NL' }),
    }))
    const wrapper = await mountOrderForm({ auth: CUSTOMER })

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/order/order/new/', query: {}, body: undefined },
    ])
    expect(wrapper.get('#order_name').element.value).toBe('Acme BV')
    expect(wrapper.find('#customer_reference').exists()).toBe(false)
    expect(wrapper.find('#order-infoline-info').exists()).toBe(false)

    await wrapper.get('#order_type').setValue('Maintenance')
    await clickButton(wrapper, 'Submit')
    await settle()

    const post = api.requests().find((r) => r.method === 'post')
    expect(post.path).toBe('/api/order/order/')
    expect(post.body).not.toHaveProperty('customer_relation')
    expect(post.body).toMatchObject({ order_type: 'Maintenance', order_name: 'Acme BV', customer_id: '5013' })
  })
})

describe('OrderForm, planning create with equipment', () => {
  const EQUIPMENT_ROW = { id: 11, name: 'Boiler', value: 'Boiler', location: { id: 2, name: 'Cellar' }, identifier: null, description: null }

  async function mountEquipmentForm(main = {}) {
    const wrapper = await mountOrderForm({ main: { getMemberUsesEquipment: true, ...main } })
    await fillMinimum(wrapper)
    return wrapper
  }

  test('searches equipment within the chosen customer; a pick fills the orderline and locks its location', async () => {
    api.get('/api/equipment/equipment/autocomplete/', [EQUIPMENT_ROW])
    const wrapper = await mountEquipmentForm()

    await multiselect(wrapper, 'maintenance-contract-equipment-name').vm.$emit('search-change', 'boil')
    await pastDebounce()
    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/equipment/equipment/autocomplete/', query: { q: 'boil', customer: '7' },
    })

    await multiselect(wrapper, 'maintenance-contract-equipment-name').vm.$emit('select', EQUIPMENT_ROW)
    await settle()
    expect(multiselect(wrapper, 'location-name').attributes('disabled')).toBeDefined()
    await clickButton(wrapper, 'Add orderline')
    await clickButton(wrapper, 'Submit')
    await settle()

    expect(api.requests().find((r) => r.path === '/api/order/order/').body.orderlines).toEqual([
      { product: 'Boiler', location: 'Cellar', remarks: '', equipment: 11, equipment_location: 2 },
    ])
  })

  test('quick-created equipment is named after what was typed, created for the customer, and picked', async () => {
    api.post('/api/equipment/equipment/create_quick/', { id: 21, name: 'Pump B' }, { status: 201 })
    const wrapper = await mountEquipmentForm({ getSettingEquipmentPlanningQuickCreate: true })
    const picker = multiselect(wrapper, 'maintenance-contract-equipment-name')
    picker.get('input').element.value = 'Pump B'

    await picker.findAll('button').find((b) => b.text() === 'Add new equipment').trigger('click')
    expect(wrapper.get('#maintenance_equipment_new_equipment').element.value).toBe('Pump B')
    await wrapper.findAll('.quick-create-ok')[0].trigger('click')
    await settle()

    expect(api.requests().at(-1)).toEqual({
      method: 'post', path: '/api/equipment/equipment/create_quick/', query: {}, body: { name: 'Pump B', customer: 7 },
    })
    expect(wrapper.find('.order-lines').text()).toContain('Pump B')
  })
})

describe('OrderForm, planning create from a quotation', () => {
  test('reads one seed with the quotation and its customer, fills the contact block, and posts the quotation and its reference', async () => {
    api.get('/api/order/order/new/', fixtureFor(vOrderSeedResponse, {
      customer: fixtureFor(vCustomer, { id: 7, name: 'Acme BV', customer_id: '5013', address: 'Main 1', postal: '1234AB', city: 'Gouda', country_code: 'NL' }),
      quotation: { id: 5, customer_relation: 7, quotation_reference: 'Q-5' },
    }))
    const wrapper = await mountOrderForm({ props: { fromQuotation: true, quotationId: '5' } })
    await settle()

    expect(api.requests().map((r) => r.path)).toEqual([
      '/api/company/engineer/list-for-select/',
      '/api/order/order/new/',
    ])
    expect(api.requests().at(-1).query).toEqual({ from_quotation: '5' })
    expect(wrapper.get('#order_name').element.value).toBe('Acme BV')
    expect(wrapper.get('#order_reference').element.value).toBe('Q-5')

    await wrapper.get('#order_type').setValue('Repair')
    await clickButton(wrapper, 'Submit')
    await settle()

    expect(api.requests().find((r) => r.method === 'post').body).toMatchObject({
      customer_relation: 7, quotation: 5, order_reference: 'Q-5',
    })
  })
})

describe('OrderForm, planning create for a maintenance contract', () => {
  test('reads one seed with the staged customer and equipment, and stages an orderline per equipment for the contract', async () => {
    api.get('/api/order/order/new/', fixtureFor(vOrderSeedResponse, {
      customer: fixtureFor(vCustomer, { id: 7, name: 'Acme BV', customer_id: '5013', address: 'Main 1', postal: '1234AB', city: 'Gouda', country_code: 'NL' }),
      equipment: [fixtureFor(vEquipment, { id: 11, name: 'Boiler', location: 2, location_name: 'Cellar' })],
    }))
    const wrapper = await mountOrderForm({
      props: { maintenance: true },
      main: {
        getMaintenanceEquipment: {
          customer_pk: 7,
          contract_pk: 3,
          maintenanceEquipment: [{ equipment_pk: 11, remarks: 'yearly', amount: 2 }],
        },
      },
    })
    await settle()

    expect(api.requests().map((r) => r.path)).toEqual([
      '/api/company/engineer/list-for-select/',
      '/api/order/order/new/',
    ])
    expect(api.requests().at(-1).query).toEqual({ maintenance_customer: '7', equipment: '11' })
    expect(wrapper.get('#order_name').element.value).toBe('Acme BV')
    expect(wrapper.find('.order-lines').text()).toContain('Boiler')

    await wrapper.get('#order_type').setValue('Maintenance')
    await clickButton(wrapper, 'Submit')
    await settle()

    expect(api.requests().find((r) => r.path === '/api/order/order/').body.orderlines).toEqual([
      { product: 'Boiler', location: 'Cellar', remarks: 'yearly', equipment: 11, equipment_location: 2, amount: 2, maintenance_contract: 3 },
    ])
  })
})

describe('OrderForm, the staged documents', () => {
  test('a document staged on a create survives typing in the other fields', async () => {
    const wrapper = await mountOrderForm()
    await clickButton(wrapper, 'Add document(s)')
    const input = wrapper.get('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [new File(['x'], 'plan.pdf')], configurable: true })
    await input.trigger('change')
    await new Promise((resolve) => setTimeout(resolve, 10))
    await settle()
    expect(wrapper.find('#order-document-table').text()).toContain('plan.pdf')

    await wrapper.get('#order_reference').setValue('REF-1')
    await settle()

    expect(wrapper.find('#order-document-table').text()).toContain('plan.pdf')
  })
})
