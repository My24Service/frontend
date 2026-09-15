import { beforeEach, describe, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'

import { OrderForm } from '@/features/order'
import { nextWorkingDay, toApiDate } from '@/features/order/form/schemas'
import {
  vOrderCreate,
  vOrderDetail,
  vOrderLineCreateUpdate,
  vOrderUpdate,
  vSetOrderAcceptedResponse,
} from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { orderRoutes } from '../../support/order-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const TOMORROW = toApiDate(nextWorkingDay())

const MAIN = {
  getMemberType: 'temps',
  getMemberHasBranches: false,
  getMemberUsesEquipment: false,
  getCountries: [{ value: 'NL', text: 'NL' }],
  getOrderTypes: ['Event', 'Catering'],
  getSettingEquipmentPlanningQuickCreate: false,
  getSettingEquipmentLocationPlanningQuickCreate: false,
  getSettingEquipmentQuickCreate: false,
  getSettingEquipmentLocationQuickCreate: false,
  getMaintenanceEquipment: null,
}

const PLANNING = { isPlanning: true, isStaff: false, isSuperuser: false, isAdmin: false, isBranchEmployee: false, isCustomer: false }

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
  ...fixtureFor(vOrderCreate, { id: 42, order_id: '2026-042', order_type: 'Event', order_name: 'Acme BV' }),
  customer_relation: 7,
})

const DETAIL = (overrides = {}) =>
  fixtureFor(vOrderDetail, {
    id: 42,
    order_id: '2026-042',
    order_type: 'Event',
    order_name: 'Acme BV',
    order_address: 'Main 1',
    order_postal: '1234AB',
    order_city: 'Gouda',
    order_country_code: 'NL',
    customer_id: '5013',
    customer_relation: 7,
    required_users: 4,
    start_date: '02/01/2026',
    end_date: '03/01/2026',
    start_date_iso: '2026-01-02',
    end_date_iso: '2026-01-03',
    start_time: '08:00:00',
    end_time: null,
    customer_order_accepted: true,
    order_email_extra: [],
    assigned_user_info: [],
    orderlines: [{ id: 501, product: 'Waiter', location: 'Hall A', remarks: '', equipment_view: null, equipment_location_view: null }],
    infolines: [],
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

async function mountTempsForm({ props = {}, main = {} } = {}) {
  const wrapper = mountForm(OrderForm, {
    deep: true,
    routes: orderRoutes,
    props,
    auth: PLANNING,
    main: { ...MAIN, ...main },
    stubs: {
      VueMultiselect: multiselectStub,
      VueDatePicker: datePickerStub,
      // the orderlines panel mounts two quick-create modals that need the app's modal manager
      'b-modal': { template: '<div><slot /></div>' },
    },
  })
  await settle()
  return wrapper
}

function multiselect(wrapper, id) {
  const picker = wrapper.findAllComponents(multiselectStub).find((component) => component.attributes('id') === id)
  if (!picker) throw new Error(`no multiselect '${id}'`)
  return picker
}

async function clickButton(wrapper, text) {
  const buttons = wrapper.findAll('button').filter((b) => b.text() === text)
  const button = buttons.find((b) => b.isVisible()) ?? buttons[0]
  if (!button) throw new Error(`no button labelled "${text}"`)
  await button.trigger('click')
}

async function fillMinimum(wrapper) {
  await multiselect(wrapper, 'order-owner-search').vm.$emit('select', AUTOCOMPLETE_CUSTOMER)
  await wrapper.get('#order_type').setValue('Event')
}

async function stageOrderline(wrapper, { product = 'Waiter', location = 'Hall A', remarks = 'black tie' } = {}) {
  await wrapper.get('#order-orderline-product').setValue(product)
  await wrapper.get('#order-orderline-location').setValue(location)
  await wrapper.get('#order-orderline-remarks').setValue(remarks)
  await clickButton(wrapper, 'Add orderline')
}

const writes = () => api.requests().filter((r) => r.method !== 'get')

beforeEach(() => {
  api.get('/api/customer/customer/autocomplete/', [AUTOCOMPLETE_CUSTOMER])
  api.get('/api/order/order/{id}/', DETAIL())
  api.post('/api/order/order/', CREATED(), { status: 201 })
  api.patch('/api/order/order/{id}/', fixtureFor(vOrderUpdate, { order_type: 'Event', order_name: 'Acme BV', start_date: '2026-01-02', end_date: '2026-01-03' }))
  api.post('/api/order/orderline/', fixtureFor(vOrderLineCreateUpdate, { id: 502, order: 42 }), { status: 201 })
  api.patch('/api/order/orderline/{id}/', fixtureFor(vOrderLineCreateUpdate, { id: 501, order: 42 }))
  api.delete('/api/order/orderline/{id}/', noContent)
  api.post('/api/order/order/{id}/set_order_accepted/', fixtureFor(vSetOrderAcceptedResponse, {}))
  api.post('/api/order/order/{id}/set_order_rejected/', fixtureFor(vSetOrderAcceptedResponse, {}))
})

describe('the order form on a temps tenant', () => {
  test('is the temps form: required users, no engineers, infolines or documents, and no read on create', async () => {
    const wrapper = await mountTempsForm()

    expect(wrapper.find('#required_users').exists()).toBe(true)
    expect(wrapper.get('#required_users').element.value).toBe('1')
    expect(wrapper.find('#order-assign').exists()).toBe(false)
    expect(wrapper.find('#order-infoline-info').exists()).toBe(false)
    expect(wrapper.find('#order-document-name').exists()).toBe(false)
    expect(api.requests()).toEqual([])
  })

  test('a maintenance tenant still gets the full form', async () => {
    api.get('/api/company/engineer/list-for-select/', [])
    const wrapper = await mountTempsForm({ main: { getMemberType: 'maintenance' } })

    expect(wrapper.find('#required_users').exists()).toBe(false)
    expect(wrapper.find('#order-infoline-info').exists()).toBe(true)
  })

  test('validation blocks an empty submit with no write, and names the customer it needs', async () => {
    const wrapper = await mountTempsForm()

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(writes()).toEqual([])
    expect(wrapper.text()).toContain('Please select a customer')
    expect(wrapper.text()).toContain('Please select an order type')
  })

  test('required users must be a whole number of at least one; blank is allowed', async () => {
    const wrapper = await mountTempsForm()
    await fillMinimum(wrapper)

    for (const bad of ['0', '2.5', 'two']) {
      await wrapper.get('#required_users').setValue(bad)
      await clickButton(wrapper, 'Submit')
      await settle()
      expect(writes()).toEqual([])
      expect(wrapper.text()).toContain('Please enter a whole number of people, at least 1')
    }

    await wrapper.get('#required_users').setValue('')
    await clickButton(wrapper, 'Submit')
    await settle()

    expect(writes()).toHaveLength(1)
    expect(writes()[0].body).not.toHaveProperty('required_users')
  })

  test('posts the order with its customer and headcount, then the orderlines against the new id, then goes back', async () => {
    const wrapper = await mountTempsForm()
    await fillMinimum(wrapper)
    await wrapper.get('#required_users').setValue('3')
    await wrapper.get('#order_reference').setValue('GALA-1')
    await wrapper.get('#start_time').setValue('18:00')
    await stageOrderline(wrapper)

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(writes()).toEqual([
      {
        method: 'post',
        path: '/api/order/order/',
        query: {},
        body: {
          ...CONTACT_BODY,
          customer_relation: 7,
          order_type: 'Event',
          order_reference: 'GALA-1',
          required_users: 3,
          start_date: TOMORROW,
          end_date: TOMORROW,
          start_time: '18:00:00',
          order_email_extra: [],
        },
      },
      {
        method: 'post',
        path: '/api/order/orderline/',
        query: {},
        body: { order: 42, product: 'Waiter', location: 'Hall A', remarks: 'black tie' },
      },
    ])
    expect(toasts().map((t) => t.title)).toEqual(['Created'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a failed create toasts and keeps the form', async () => {
    api.post('/api/order/order/', () => new HttpResponse(JSON.stringify({ detail: 'nope' }), { status: 400, headers: { 'content-type': 'application/json' } }))
    const wrapper = await mountTempsForm()
    await fillMinimum(wrapper)

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(writes()).toHaveLength(1)
    expect(toasts().map((t) => [t.title, t.body])).toEqual([['Error', 'Error creating order']])
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.get('#order_reference').exists()).toBe(true)
  })
})

describe('the temps form editing an order', () => {
  test('reads the order once and shows its headcount and lines', async () => {
    const wrapper = await mountTempsForm({ props: { pk: '42' } })

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/order/order/42/', query: {}, body: undefined },
    ])
    expect(wrapper.get('#required_users').element.value).toBe('4')
    expect(wrapper.get('#order_name').element.value).toBe('Acme BV')
    expect(wrapper.get('#customer_id').element.value).toBe('5013')
    expect(wrapper.get('#start_time').element.value).toBe('08:00')
    expect(wrapper.text()).toContain('Waiter')
  })

  test('patches the order with the new headcount, then updates, adds and deletes its lines', async () => {
    const wrapper = await mountTempsForm({ props: { pk: '42' } })
    await wrapper.get('#required_users').setValue('6')
    await stageOrderline(wrapper, { product: 'Bartender', location: 'Bar', remarks: '' })

    await clickButton(wrapper, 'Submit')
    await settle()

    expect(writes()).toEqual([
      {
        method: 'patch',
        path: '/api/order/order/42/',
        query: {},
        body: {
          customer_id: '5013',
          customer_relation: 7,
          order_name: 'Acme BV',
          order_address: 'Main 1',
          order_postal: '1234AB',
          order_city: 'Gouda',
          order_country_code: 'NL',
          order_type: 'Event',
          required_users: 6,
          start_date: '2026-01-02',
          end_date: '2026-01-03',
          start_time: '08:00:00',
          order_email_extra: [],
        },
      },
      {
        method: 'patch',
        path: '/api/order/orderline/501/',
        query: {},
        body: { order: 42, product: 'Waiter', location: 'Hall A', remarks: '' },
      },
      {
        method: 'post',
        path: '/api/order/orderline/',
        query: {},
        body: { order: 42, product: 'Bartender', location: 'Bar', remarks: '' },
      },
    ])
    expect(toasts().map((t) => t.title)).toEqual(['Updated'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('an accepted order offers no accept or reject', async () => {
    const wrapper = await mountTempsForm({ props: { pk: '42' } })

    expect(wrapper.findAll('button').map((b) => b.text())).not.toContain('Reject')
    expect(wrapper.findAll('button').map((b) => b.text())).not.toContain('Save & accept')
  })

  test('save & accept on a not-accepted order patches, then accepts', async () => {
    api.get('/api/order/order/{id}/', DETAIL({ customer_order_accepted: false }))
    const wrapper = await mountTempsForm({ props: { pk: '42' } })

    await clickButton(wrapper, 'Save & accept')
    await settle()

    expect(writes().map((r) => [r.method, r.path])).toEqual([
      ['patch', '/api/order/order/42/'],
      ['patch', '/api/order/orderline/501/'],
      ['post', '/api/order/order/42/set_order_accepted/'],
    ])
    expect(toasts().map((t) => t.title)).toEqual(['Accepted', 'Updated'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('reject on a not-accepted order posts the rejection and goes back without saving', async () => {
    api.get('/api/order/order/{id}/', DETAIL({ customer_order_accepted: false }))
    const wrapper = await mountTempsForm({ props: { pk: '42' } })

    await clickButton(wrapper, 'Reject')
    await settle()

    expect(writes()).toEqual([
      { method: 'post', path: '/api/order/order/42/set_order_rejected/', query: {}, body: undefined },
    ])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })
})
