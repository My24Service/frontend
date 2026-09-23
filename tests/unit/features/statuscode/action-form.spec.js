import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ActionForm } from '@/features/statuscode'
import { vAction, vPaginatedPartnerDetailList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { statuscodeRoutes } from '../../support/statuscode-routes.js'

/**
 * The action create/edit form: what a statuscode does when an order (or a
 * quotation, invoice, leave request...) reaches it.
 *
 * Seams under test: the create with the statuscode from the route, the
 * update, the per-type action lists, the order type's partner load and Gripp
 * gate, the condition table, the delete, and the failure toasts.
 */

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const ACTION = fixtureFor(vAction, {
  id: 7,
  name: 'mail planning',
  type: 'email',
  address: 'planning@example.test',
  subject: 'Order {{ order_id }}',
  template: 'Beste planning',
  description: null,
  company_partner: null,
  json_conditions: [{ field: 'order_type', operator: '=', value: 'storing' }],
  querymode: 'or',
  statuscode: 3,
  override_status: false,
  destination: null,
  conditions: '',
})

const PARTNER = itemSchemaOf(vPaginatedPartnerDetailList)

function partnerPage() {
  return paginated([
    fixtureFor(PARTNER, { id: 21, partner: 5, partner_view: { name: 'Kerstmarktspecialist' } }),
    fixtureFor(PARTNER, { id: 22, partner: 6, partner_view: { name: 'Pedroja' } }),
  ])
}

beforeEach(() => {
  api.get('/api/statuscode/action/{id}/', ACTION)
  api.post('/api/statuscode/action/', ACTION)
  api.patch('/api/statuscode/action/{id}/', ACTION)
  api.delete('/api/statuscode/action/{id}/', noContent)
  api.get('/api/company/partner/', partnerPage())
})

async function mountActionForm({ codeType = 'quotation', fromSettings = false, pk = null, statuscodePk = null, auth = {}, main = {} } = {}) {
  const wrapper = mountForm(ActionForm, {
    deep: true,
    routes: statuscodeRoutes,
    props: { codeType, fromSettings, pk, statuscodePk },
    auth,
    main: { profile: { modules: [], module_parts: {} }, ...main },
  })
  await settle()
  return wrapper
}

async function type(wrapper, selector, value) {
  const field = wrapper.get(selector)
  await field.setValue(value)
  await field.trigger('change')
}

async function submit(wrapper) {
  await wrapper.get('header .btn-primary').trigger('click')
  await settle()
  await wrapper.vm.$nextTick()
}

function typeOptions(wrapper) {
  return wrapper.findAll('#action_type option').map((option) => option.attributes('value'))
}

function shownFeedback(wrapper) {
  return wrapper
    .findAll('.invalid-feedback')
    .filter((node) => node.classes('d-block'))
    .map((node) => node.text())
}

describe('ActionForm, creating an action', () => {
  test('opens empty as an email action, without a delete button', async () => {
    const wrapper = await mountActionForm({ statuscodePk: '3' })

    expect(wrapper.get('#action_name').element.value).toBe('')
    expect(wrapper.get('#action_type').element.value).toBe('email')
    expect(wrapper.find('header .btn-danger').exists()).toBe(false)
    expect(wrapper.text()).toContain('Create action')
  })

  test('puts the create on the wire with the statuscode from the route', async () => {
    const wrapper = await mountActionForm({ statuscodePk: '3' })

    await type(wrapper, '#action_name', 'mail sales')
    await type(wrapper, '#action_email_address', 'sales@example.test')
    await type(wrapper, '#action_email_subject', 'Offerte')
    await type(wrapper, '#action_email_body', 'Beste sales')
    await submit(wrapper)

    expect(api.requests()).toEqual([
      {
        method: 'post',
        path: '/api/statuscode/action/',
        query: {},
        body: {
          name: 'mail sales',
          type: 'email',
          address: 'sales@example.test',
          subject: 'Offerte',
          template: 'Beste sales',
          description: null,
          company_partner: null,
          json_conditions: [],
          querymode: 'or',
          statuscode: 3,
          override_status: false,
          num_days: null,
          num_days_operator: '<=',
          num_days_model_field: null,
        },
      },
    ])
    expect(toasts().map((toast) => toast.body)).toContain('Action has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('refuses an action with no name, and sends nothing', async () => {
    const wrapper = await mountActionForm({ statuscodePk: '3' })

    await submit(wrapper)

    expect(shownFeedback(wrapper)).toContain('Please enter a name')
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('tells the user when the create fails, and stays on the form', async () => {
    api.post('/api/statuscode/action/', serverError)
    const wrapper = await mountActionForm({ statuscodePk: '3' })

    await type(wrapper, '#action_name', 'mail sales')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating action')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('ActionForm, the action types per code type', () => {
  test('a quotation may notify and nothing else, and loads no partners', async () => {
    const wrapper = await mountActionForm({ codeType: 'quotation', statuscodePk: '3' })

    expect(typeOptions(wrapper)).toEqual(['email', 'send_sms', 'send_fcm'])
    expect(api.requests()).toEqual([])
  })

  test('an order offers the full set and loads the partners for the copy action', async () => {
    const wrapper = await mountActionForm({ codeType: 'order', statuscodePk: '3' })

    expect(typeOptions(wrapper)).toEqual(['email', 'email_assigned', 'copy', 'status', 'email_workorders', 'send_sms', 'send_fcm'])
    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/company/partner/', query: { page_size: '1000' } },
    ])
  })

  test('an order offers "send to Gripp" only when the tenant has the connector', async () => {
    const wrapper = await mountActionForm({
      codeType: 'order',
      statuscodePk: '3',
      main: { profile: { modules: ['company'], module_parts: { company: ['connector-gripp'] } } },
    })

    expect(typeOptions(wrapper)).toContain('send_to_gripp')
  })

  test('a superuser always sees "send to Gripp" on an order', async () => {
    const wrapper = await mountActionForm({ codeType: 'order', statuscodePk: '3', auth: { isSuperuser: true } })

    expect(typeOptions(wrapper)).toContain('send_to_gripp')
  })

  test('the copy action picks a partner and sends it', async () => {
    const wrapper = await mountActionForm({ codeType: 'order', statuscodePk: '3' })

    await type(wrapper, '#action_name', 'copy to partner')
    await wrapper.get('#action_type').setValue('copy')
    await wrapper.get('#action_partner').setValue('22')
    await submit(wrapper)

    expect(api.requests().at(-1)).toMatchObject({
      method: 'post',
      body: { type: 'copy', company_partner: 22 },
    })
  })

  test('the status action offers the override and its template', async () => {
    const wrapper = await mountActionForm({ codeType: 'order', statuscodePk: '3' })

    await type(wrapper, '#action_name', 'status back')
    await wrapper.get('#action_type').setValue('status')
    await wrapper.get('#action_status_override').setValue(true)
    await type(wrapper, '#action_status_override_template', 'Afgerond')
    await submit(wrapper)

    expect(api.requests().at(-1)).toMatchObject({
      method: 'post',
      body: { type: 'status', override_status: true, template: 'Afgerond' },
    })
  })
})

describe('ActionForm, the date trigger', () => {
  test('an order picks from its date fields, and the trigger rides the wire', async () => {
    const wrapper = await mountActionForm({ codeType: 'order', statuscodePk: '3' })

    expect(wrapper.text()).toContain('Date trigger')
    const field = wrapper.get('select#action_num_days_model_field')
    expect(field.findAll('option').slice(1).map((o) => o.element.value)).toEqual(['start_date', 'end_date'])

    await type(wrapper, '#action_name', 'herinnering')
    await field.setValue('start_date')
    await wrapper.get('#action_num_days_operator').setValue('<=')
    await type(wrapper, '#action_num_days', '14')
    await submit(wrapper)

    expect(api.requests().at(-1).body).toMatchObject({
      num_days: 14,
      num_days_operator: '<=',
      num_days_model_field: 'start_date',
    })
  })

  test('a picked date field without days is refused, and nothing is sent', async () => {
    const wrapper = await mountActionForm({ codeType: 'order', statuscodePk: '3' })

    await type(wrapper, '#action_name', 'herinnering')
    await wrapper.get('select#action_num_days_model_field').setValue('start_date')
    await submit(wrapper)

    expect(api.requests().filter((r) => r.method === 'post')).toEqual([])
  })

  test('a type without date fields offers no trigger', async () => {
    const wrapper = await mountActionForm({ codeType: 'quotation', statuscodePk: '3' })

    expect(wrapper.text()).not.toContain('Date trigger')
    expect(wrapper.find('#action_num_days').exists()).toBe(false)
  })
})

describe('ActionForm, conditions', () => {
  test('a condition typed in and added rides the wire; a removed one does not', async () => {
    const wrapper = await mountActionForm({ statuscodePk: '3' })

    await type(wrapper, '#action_name', 'mail sales')
    await type(wrapper, '#action-condition-field', 'customer_id')
    await wrapper.get('#action-condition-operator').setValue('=')
    await type(wrapper, '#action-condition-value', '42')
    await wrapper.get('button.add-condition').trigger('click')
    await type(wrapper, '#action-condition-field', 'city')
    await wrapper.get('#action-condition-operator').setValue('CONTAINS')
    await type(wrapper, '#action-condition-value', 'dam')
    await wrapper.get('button.add-condition').trigger('click')

    expect(wrapper.findAll('table.conditions tbody tr').length).toBe(2)

    await wrapper.findAll('table.conditions button[title="Delete"]')[0].trigger('click')
    await wrapper.get('#action_querymode').setValue('and')
    await submit(wrapper)

    expect(api.requests().at(-1).body).toMatchObject({
      json_conditions: [{ field: 'city', operator: 'CONTAINS', value: 'dam' }],
      querymode: 'and',
    })
  })

  test('an incomplete condition is not added — the API refuses a blank part', async () => {
    const wrapper = await mountActionForm({ statuscodePk: '3' })

    await type(wrapper, '#action-condition-field', 'city')
    await wrapper.get('button.add-condition').trigger('click')

    expect(wrapper.findAll('table.conditions tbody tr').length).toBe(0)
  })
})

describe('ActionForm, editing an action', () => {
  test('opens on the action it was given, conditions included', async () => {
    const wrapper = await mountActionForm({ pk: 7 })

    expect(wrapper.text()).toContain('mail planning')
    expect(wrapper.get('#action_name').element.value).toBe('mail planning')
    expect(wrapper.get('#action_email_address').element.value).toBe('planning@example.test')
    expect(wrapper.findAll('table.conditions tbody tr').map((row) => row.text())).toEqual(['order_type=storing'])
  })

  test('puts the update on the wire, keeping the statuscode the record came with', async () => {
    const wrapper = await mountActionForm({ pk: 7 })

    await type(wrapper, '#action_name', 'mail planning v2')
    await submit(wrapper)

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/statuscode/action/7/', query: {} },
      {
        method: 'patch',
        path: '/api/statuscode/action/7/',
        query: {},
        body: {
          name: 'mail planning v2',
          type: 'email',
          address: 'planning@example.test',
          subject: 'Order {{ order_id }}',
          template: 'Beste planning',
          description: null,
          company_partner: null,
          json_conditions: [{ field: 'order_type', operator: '=', value: 'storing' }],
          querymode: 'or',
          statuscode: 3,
          override_status: false,
          num_days: null,
          num_days_operator: '<=',
          num_days_model_field: null,
        },
      },
    ])
    expect(toasts().map((toast) => toast.body)).toContain('Action has been updated')
  })

  test('tells the user when the action cannot be fetched', async () => {
    api.get('/api/statuscode/action/{id}/', serverError)

    await mountActionForm({ pk: 7 })

    expect(toasts().map((toast) => toast.body)).toContain('Error loading action')
  })

  test('the delete button confirms, destroys and goes back', async () => {
    const wrapper = await mountActionForm({ pk: 7 })

    await wrapper.get('header .btn-danger').trigger('click')
    await settle()
    modal('delete-action-modal').ok()
    await settle()

    expect(api.requests().map((sent) => [sent.method, sent.path])).toEqual([
      ['get', '/api/statuscode/action/7/'],
      ['delete', '/api/statuscode/action/7/'],
    ])
    expect(toasts().map((toast) => toast.body)).toContain('Action has been deleted')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('tells the user when the delete fails, and stays', async () => {
    api.delete('/api/statuscode/action/{id}/', serverError)
    const wrapper = await mountActionForm({ pk: 7 })

    await wrapper.get('header .btn-danger').trigger('click')
    await settle()
    modal('delete-action-modal').ok()
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Error deleting action')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})
