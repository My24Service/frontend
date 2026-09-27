import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { RouterView } from 'vue-router'
import { QuotationList } from '@/features/quotation'
import { vQuotation, vQuotationPreliminaryResponse, vQuotationStatus, vStatuscode } from '@/api/valibot.gen'
import { fixtureFor, paginated } from '../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../support/api-seam/index.js'
import { mountListView, toasts } from '../support/form-harness.js'
import { serverError } from '../support/list-harness.js'
import { modal } from '../support/modal.js'

const api = installApiSeam()
const base = '/api/quotation/quotation/'
const modes = [
  ['quotation-list', '/quotations/quotations', base, 'Definitive quotations'],
  ['preliminary-quotations', '/quotations/preliminary', base + 'preliminary/', 'Preliminary quotations'],
  ['quotations-sent', '/quotations/sent', base + 'sent/', 'Sent quotations'],
]
const stub = {template: '<div />'}
const routes = [
  ...modes.map(([name, path]) => ({name, path, component: QuotationList})),
  {name: 'quotation-add', path: '/quotations/preliminary/form', component: stub},
  {name: 'quotation-edit', path: '/quotations/quotations/form/:pk', component: stub},
  {name: 'quotation-edit-preliminary', path: '/quotations/preliminary/form/:pk', component: stub},
  {name: 'quotation-view', path: '/quotations/quotations/view/:pk', component: stub},
  {name: 'quotations-sent-view', path: '/quotations/sent/view/:pk', component: stub},
  {name: 'quotation-send', path: '/quotations/sent/form/', component: stub},
  {name: 'order-add-quotation', path: '/orders/form/quotation/:quotation_id', component: stub},
]
let rows
// The preliminary and sent lists answer a narrower row than the plain list.
function quotation(extras = {}, schema = vQuotation) {
  return fixtureFor(schema, {
    id: 7, name: 'Roof', quotation_name: 'ACME', quotation_reference: 'REF-1', quotation_city: 'Utrecht',
    total: '121.00', vat: '21.00', preliminary: false, is_sent: false,
    last_status: 'Created', last_status_full: 'Created by Planner', statuscode_id: 1, color: '#112233',
    ...extras,
  })
}
function code(id, statuscode, extras = {}) {
  return fixtureFor(vStatuscode, {id, code_type: 'quotation', statuscode, color: '#112233',
    actions: [], roles: [], settings_key: null, settings_value: null, ...extras})
}
beforeEach(() => {
  window.history.replaceState(null, '', '/')
  rows = {
    [base]: [quotation()],
    [base + 'preliminary/']: [quotation({preliminary: true}, vQuotationPreliminaryResponse)],
    [base + 'sent/']: [quotation({is_sent: true}, vQuotationPreliminaryResponse)],
  }
  for (const [, , endpoint] of modes) api.get(endpoint, () => paginated(rows[endpoint], {count: 45}))
  api.get('/api/statuscode/statuscode/', paginated([
    code(1, 'Created', {settings_key: 'quotation_entry_status'}),
    code(2, 'Accepted', {color: '#00ff00'}),
  ]))
  api.delete(base + '{id}/', noContent)
  api.post('/api/quotation/status/', ({body}) => fixtureFor(vQuotationStatus, {id: 30, ...body}))
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountQuotations(name = 'quotation-list') {
  const wrapper = await mountListView(RouterView, {deep: true, routes})
  await wrapper.vm.$router.push({name})
  await settle()
  return wrapper
}
const listRequests = () => api.requests().filter((request) => request.method === 'get' && request.path.startsWith(base))
const bodies = () => toasts().map((toast) => toast.body)

describe('QuotationList modes and navigation', () => {
  test.each(modes)('%s loads its endpoint and renders all columns', async (name, _path, endpoint, title) => {
    const wrapper = await mountQuotations(name)
    expect(listRequests()[0]).toMatchObject({path: endpoint, query: {page: '1', page_size: '20'}})
    expect(wrapper.get('h3').text()).toContain(title)
    const text = wrapper.get('tbody').text()
    for (const value of ['Roof', 'ACME', 'REF-1', 'Utrecht', '121.00', '21.00']) expect(text).toContain(value)
  })
  test('the pills switch modes, changing the query and title', async () => {
    const wrapper = await mountQuotations()
    expect(wrapper.findAll('.nav-pills a').map((a) => a.text())).toEqual(['Definitive', 'Preliminary', 'Sent'])
    for (const [name, , endpoint, title] of modes.slice(1)) {
      await wrapper.vm.$router.push({name})
      await settle()
      expect(listRequests().at(-1).path).toBe(endpoint)
      expect(wrapper.get('h3').text()).toContain(title)
    }
  })
  test('a mode switch lands on page one of the new list', async () => {
    const wrapper = await mountQuotations('quotations-sent')
    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()
    expect(listRequests().at(-1).query.page).toBe('2')
    await wrapper.vm.$router.push({name: 'preliminary-quotations'})
    await settle()
    expect(listRequests().at(-1)).toMatchObject({path: base + 'preliminary/', query: {page: '1'}})
  })
  test('the add button leads to the new-quotation form', async () => {
    const wrapper = await mountQuotations()
    expect(wrapper.get('a.btn-primary').attributes('href')).toBe('/quotations/preliminary/form')
  })
  test('a definitive unsent row links to its view and offers order and send, not edit or delete', async () => {
    const wrapper = await mountQuotations()
    expect(wrapper.get('tbody a').attributes('href')).toBe('/quotations/quotations/view/7')
    expect(wrapper.get('a[title="Create order"]').attributes('href')).toBe('/orders/form/quotation/7')
    expect(wrapper.get('a[title="Send quotation"]').attributes('href')).toBe('/quotations/sent/form/?quotationId=7')
    expect(wrapper.find('[title="Edit"]').exists()).toBe(false)
    expect(wrapper.find('[title="Delete"]').exists()).toBe(false)
  })
  test('a sent row links to the sent view', async () => {
    const wrapper = await mountQuotations('quotations-sent')
    expect(wrapper.get('tbody a').attributes('href')).toBe('/quotations/sent/view/7')
  })
  test('a preliminary row links to its form and offers edit and delete, not order or send', async () => {
    const wrapper = await mountQuotations('preliminary-quotations')
    expect(wrapper.get('tbody a').attributes('href')).toBe('/quotations/preliminary/form/7')
    expect(wrapper.get('[title="Edit"]').attributes('href')).toBe('/quotations/quotations/form/7')
    expect(wrapper.find('[title="Delete"]').exists()).toBe(true)
    expect(wrapper.find('a[title="Create order"]').exists()).toBe(false)
    expect(wrapper.find('a[title="Send quotation"]').exists()).toBe(false)
  })
  test('a preliminary row that was sent offers neither edit nor delete', async () => {
    rows[base + 'preliminary/'] = [quotation({preliminary: true, is_sent: true}, vQuotationPreliminaryResponse)]
    const wrapper = await mountQuotations('preliminary-quotations')
    expect(wrapper.find('[title="Edit"]').exists()).toBe(false)
    expect(wrapper.find('[title="Delete"]').exists()).toBe(false)
  })
})

describe('QuotationList mutations and states', () => {
  test('reads the quotation statuscodes and disables the automatic ones', async () => {
    const wrapper = await mountQuotations()
    expect(api.requests().find((request) => request.path === '/api/statuscode/statuscode/').query)
      .toEqual({code_type: 'quotation', page: '1', page_size: '1000'})
    expect(wrapper.get('[id="7-change-status"]').element.value).toBe('Created')
    expect(wrapper.get('option[value="Created"]').element.disabled).toBe(true)
    expect(wrapper.get('option[value="Accepted"]').element.disabled).toBe(false)
  })
  test('a status pick posts a quotation status and refetches the list', async () => {
    const wrapper = await mountQuotations()
    await wrapper.get('[id="7-change-status"]').setValue('Accepted')
    await settle()
    expect(api.requests().find((request) => request.method === 'post')).toMatchObject({
      path: '/api/quotation/status/', body: {quotation: 7, status: 'Accepted'},
    })
    expect(listRequests()).toHaveLength(2)
  })
  test('a failed status pick toasts and rolls back', async () => {
    api.post('/api/quotation/status/', serverError)
    const wrapper = await mountQuotations()
    await wrapper.get('[id="7-change-status"]').setValue('Accepted')
    await settle()
    expect(wrapper.get('[id="7-change-status"]').element.value).toBe('Created')
    expect(bodies()).toContain('Error creating status')
  })
  test('delete confirms, destroys the row, refetches and toasts', async () => {
    const wrapper = await mountQuotations('preliminary-quotations')
    await wrapper.get('[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)
    modal('delete-quotation-modal').ok()
    await settle()
    expect(api.requests().find((request) => request.method === 'delete').path).toBe(base + '7/')
    expect(listRequests()).toHaveLength(2)
    expect(bodies()).toContain('Quotation has been deleted')
  })
  test('a failed delete keeps the row and toasts the error', async () => {
    api.delete(base + '{id}/', serverError)
    const wrapper = await mountQuotations('preliminary-quotations')
    await wrapper.get('[title="Delete"]').trigger('click')
    await settle()
    modal('delete-quotation-modal').ok()
    await settle()
    expect(wrapper.get('tbody').text()).toContain('Roof')
    expect(bodies()).toContain('Error deleting quotation')
  })
  test('an empty list says so', async () => {
    rows[base] = []
    const wrapper = await mountQuotations()
    expect(wrapper.get('tbody').text()).toContain('No quotations found')
  })
  test('a failed list load toasts and does not stay busy', async () => {
    api.get(base, serverError)
    const wrapper = await mountQuotations()
    expect(bodies()).toContain('Error loading quotations')
    expect(wrapper.text()).not.toContain('Loading...')
  })
})
