import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { RouterView } from 'vue-router'
import { invoiceInvoiceDetailRetrieveQueryKey } from '@/api/@tanstack/vue-query.gen'
import { InvoiceList } from '@/features/invoice'
import { vInvoice, vInvoicePreliminaryResponse, vInvoiceStatus, vStatuscode } from '@/api/valibot.gen'
import { fixtureFor, paginated } from '../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../support/api-seam/index.js'
import { mountListView, createTestQueryClient, toastCreate, toasts } from '../support/form-harness.js'
import { serverError } from '../support/list-harness.js'
import { modal } from '../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({create: toastCreate}),
}))

const api = installApiSeam()
const base = '/api/invoice/invoice/'
const modes = [
  ['invoice-list', '/invoices/invoices', base, 'Definitive invoices'],
  ['preliminary-invoices', '/invoices/preliminary', base + 'preliminary/', 'Preliminary invoices'],
  ['invoices-sent', '/invoices/sent', base + 'sent/', 'Sent invoices'],
]
const uuid = '00000000-0000-4000-8000-000000000011'
const orderUuid = '00000000-0000-4000-8000-000000000012'
const routes = [
  ...modes.map(([name, path]) => ({name, path, component: InvoiceList})),
  {name: 'invoice-edit', path: '/invoices/preliminary/form/:pk/order/:uuid', component: {template: '<div />'}},
  {name: 'invoice-view', path: '/invoices/invoices/view/:uuid', component: {template: '<div />'}},
  {name: 'invoice-send', path: '/invoices/sent/form/', component: {template: '<div />'}},
]
let status = 'Created'
let history = 'Created by Planner on Monday'
let statusId = 1
let rowColor = '#112233'
function invoice(preliminary = false) {
  return fixtureFor(preliminary ? vInvoicePreliminaryResponse : vInvoice, {
    id: 11, invoice_id: 'INV-11', uuid, order: 42, order_uuid: orderUuid,
    created_by_fullname: 'Planner', term_of_payment_days: 30,
    total: '121.00', vat: '21.00', preliminary,
    last_status: status, last_status_full: history,
    statuscode_id: statusId, color: rowColor,
  })
}
function code(id, statuscode, extras = {}) {
  return fixtureFor(vStatuscode, {id, code_type: 'invoice', statuscode, color: '#112233',
    actions: [], roles: [], settings_key: null, settings_value: null, ...extras})
}
beforeEach(() => {
  window.history.replaceState(null, '', '/')
  status = 'Created'
  history = 'Created by Planner on Monday'
  statusId = 1
  rowColor = '#112233'
  for (const [name, , endpoint] of modes) api.get(endpoint, () => paginated([invoice(name === 'preliminary-invoices')], {count: 45}))
  api.get('/api/statuscode/statuscode/', paginated([
    code(1, 'Created', {settings_key: 'invoice_entry_status'}),
    code(2, 'Paid', {color: '#00ff00'}),
    code(3, 'Sent', {roles: ['invoice_sent_status']}),
  ]))
  api.delete(base + '{id}/', noContent)
  api.post('/api/invoice/invoice-status/', ({body}) => {
    status = body.status
    history = body.status + ' by Planner on Tuesday'
    // the refetch carries the resolved row, as the server would send it
    statusId = body.status === 'Paid' ? 2 : null
    rowColor = body.status === 'Paid' ? '#00ff00' : '#ccc'
    return fixtureFor(vInvoiceStatus, {id: 30, ...body})
  })
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountInvoice(name = 'invoice-list', queryClient) {
  const wrapper = await mountListView(RouterView, {deep: true, routes, queryClient})
  await wrapper.vm.$router.push({name})
  await settle()
  return wrapper
}
const listRequests = () => api.requests().filter((request) => request.method === 'get' && request.path.startsWith(base))
const bodies = () => toasts().map((toast) => toast.body)
async function search(wrapper, value) {
  await wrapper.get('input[aria-label="Search invoices"]').setValue(value)
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

describe('InvoiceList modes and navigation', () => {
  test.each(modes)('%s loads its endpoint and renders all columns', async (name, _path, endpoint, title) => {
    const wrapper = await mountInvoice(name)
    expect(listRequests()[0]).toMatchObject({path: endpoint, query: {page: '1', page_size: '20'}})
    expect(wrapper.get('h3').text()).toContain(title)
    expect(wrapper.get('tbody').text()).toContain('INV-11')
    expect(wrapper.get('tbody').text()).toContain('Planner')
    expect(wrapper.get('tbody').text()).toContain('121.00')
    expect(wrapper.get('tbody').text()).toContain('21.00')
    expect(wrapper.findAll('th.sortable-header')).toHaveLength(0)
  })
  test('switching modes while mounted changes the query and title', async () => {
    const wrapper = await mountInvoice()
    for (const [name, , endpoint, title] of modes.slice(1)) {
      await wrapper.vm.$router.push({name})
      await settle()
      expect(listRequests().at(-1).path).toBe(endpoint)
      expect(wrapper.get('h3').text()).toContain(title)
    }
  })
  test.each(modes)('%s preserves search and pagination on the wire', async (name, _path, endpoint) => {
    const wrapper = await mountInvoice(name)
    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()
    expect(listRequests().at(-1)).toMatchObject({path: endpoint, query: {page: '2', page_size: '20'}})
    await search(wrapper, 'invoice & paid')
    expect(listRequests().at(-1)).toMatchObject({path: endpoint, query: {q: 'invoice & paid', page: '1', page_size: '20'}})
    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()
    expect(listRequests().at(-1).query).toEqual({q: 'invoice & paid', page: '2', page_size: '20'})
  })
  test('switching from sent page two resets before requesting a smaller preliminary list', async () => {
    const wrapper = await mountInvoice('invoices-sent')
    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()
    expect(listRequests().at(-1).query.page).toBe('2')
    api.get(base + 'preliminary/', ({query}) => query.page === '1'
      ? paginated([invoice(true)], {count: 1}) : serverError())
    await wrapper.vm.$router.push({name: 'preliminary-invoices'})
    await settle()
    const requests = listRequests().filter((request) => request.path === base + 'preliminary/')
    expect(requests.map((request) => request.query.page)).toEqual(['1'])
    expect(wrapper.get('.page-status').text()).toContain('1 / 1')
    expect(bodies()).not.toContain('Error loading invoices')
  })
  test('an explicit destination page and search survive a mode transition', async () => {
    const wrapper = await mountInvoice('invoices-sent')
    await wrapper.vm.$router.push({name: 'preliminary-invoices', query: {page: '2', q: 'restored'}})
    await settle()
    expect(listRequests().at(-1)).toMatchObject({path: base + 'preliminary/', query: {page: '2', q: 'restored'}})
    expect(wrapper.get('input[aria-label="Search invoices"]').element.value).toBe('restored')
  })
  test('restores a shared search and page before the initial request', async () => {
    window.history.replaceState(null, '', '/#/invoices/invoices?q=invoice&page=2')
    const wrapper = await mountInvoice()
    expect(listRequests()[0].query).toEqual({q: 'invoice', page: '2', page_size: '20'})
    expect(wrapper.get('input[aria-label="Search invoices"]').element.value).toBe('invoice')
  })
  test('refresh refetches the current list', async () => {
    const wrapper = await mountInvoice()
    const before = listRequests().length
    await wrapper.get('[title="Refresh"]').trigger('click')
    await settle()
    expect(listRequests()).toHaveLength(before + 1)
  })
  test('definitive rows offer view, send and order links but no delete', async () => {
    const wrapper = await mountInvoice()
    expect(wrapper.get('tbody a').attributes('href')).toBe('/invoices/invoices/view/' + uuid)
    expect(wrapper.get('a[title="Send invoice"]').attributes('href')).toBe('/invoices/sent/form/?invoiceId=11')
    expect(wrapper.get('a[title="Order"]').attributes('href')).toBe('/orders/42')
    expect(wrapper.find('button[title="Delete"]').exists()).toBe(false)
  })
  test('preliminary rows offer edit and delete, not send', async () => {
    const wrapper = await mountInvoice('preliminary-invoices')
    expect(wrapper.get('tbody a').attributes('href')).toBe('/invoices/preliminary/form/11/order/' + orderUuid)
    expect(wrapper.find('button[title="Delete"]').exists()).toBe(true)
    expect(wrapper.find('a[title="Send invoice"]').exists()).toBe(false)
  })
})

describe('InvoiceList mutations and states', () => {
  test('preserves history, color and disabled automatic status codes', async () => {
    const wrapper = await mountInvoice()
    expect(wrapper.get('.status').attributes('title')).toBe(history)
    expect(wrapper.get('.status').attributes('style')).toContain('--status-color: #112233')
    expect(wrapper.get('[id="11-change-status"]').element.value).toBe('Created')
    expect(wrapper.get('option[value="Created"]').element.disabled).toBe(true)
    expect(wrapper.get('option[value="Sent"]').element.disabled).toBe(true)
    expect(api.requests().find((request) => request.path === '/api/statuscode/statuscode/').query)
      .toEqual({code_type: 'invoice', page: '1', page_size: '1000'})
  })
  test('status creation refetches authoritative history and color', async () => {
    const wrapper = await mountInvoice()
    await wrapper.get('[id="11-change-status"]').setValue('Paid')
    await settle()
    expect(api.requests().find((request) => request.method === 'post')).toMatchObject({
      path: '/api/invoice/invoice-status/', body: {invoice: 11, status: 'Paid'},
    })
    expect(listRequests()).toHaveLength(2)
    expect(wrapper.get('.status').attributes('title')).toBe('Paid by Planner on Tuesday')
    expect(wrapper.get('.status').attributes('style')).toContain('--status-color: #00ff00')
  })
  test('status mutation invalidates only the matching cached invoice detail', async () => {
    const queryClient = createTestQueryClient()
    const matching = invoiceInvoiceDetailRetrieveQueryKey({path: {id: uuid}})
    const unrelated = invoiceInvoiceDetailRetrieveQueryKey({path: {id: orderUuid}})
    queryClient.setQueryData(matching, {last_status: 'Created'})
    queryClient.setQueryData(unrelated, {last_status: 'Created'})
    const wrapper = await mountInvoice('invoice-list', queryClient)
    await wrapper.get('[id="11-change-status"]').setValue('Paid')
    await settle()
    expect(queryClient.getQueryState(matching).isInvalidated).toBe(true)
    expect(queryClient.getQueryState(unrelated).isInvalidated).toBe(false)
  })
  test('failed status mutation restores selection and history', async () => {
    api.post('/api/invoice/invoice-status/', serverError)
    const wrapper = await mountInvoice()
    await wrapper.get('[id="11-change-status"]').setValue('Paid')
    await settle()
    expect(wrapper.get('[id="11-change-status"]').element.value).toBe('Created')
    expect(wrapper.get('.status').attributes('title')).toBe(history)
    expect(bodies()).toContain('Error creating status')
  })
  test('delete requires confirmation, sends row id, then refetches', async () => {
    const wrapper = await mountInvoice('preliminary-invoices')
    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)
    modal('delete-invoice-modal').ok()
    await settle()
    expect(api.requests().find((request) => request.method === 'delete').path).toBe(base + '11/')
    expect(listRequests()).toHaveLength(2)
    expect(bodies()).toContain('Invoice has been deleted')
  })
  test('failed delete retains row and shows the error', async () => {
    api.delete(base + '{id}/', serverError)
    const wrapper = await mountInvoice('preliminary-invoices')
    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-invoice-modal').ok()
    await settle()
    expect(wrapper.get('tbody').text()).toContain('INV-11')
    expect(bodies()).toContain('Error deleting invoice')
  })
  test('cancelling deletion sends no mutation', async () => {
    const wrapper = await mountInvoice('preliminary-invoices')
    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-invoice-modal').cancel()
    await settle()
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)
    expect(wrapper.get('tbody').text()).toContain('INV-11')
  })
  test('delayed list loading does not end when statuscodes resolve', async () => {
    let release
    const gate = new Promise((resolve) => { release = resolve })
    api.get(base, async () => {
      await gate
      return paginated([invoice()])
    })
    const wrapper = await mountInvoice()
    try {
      expect(wrapper.get('tbody').text()).toContain('Loading...')
      expect(wrapper.find('button[aria-label="Next page"]').exists()).toBe(false)
    } finally {
      release()
      await settle()
    }
    expect(wrapper.get('tbody').text()).toContain('INV-11')
    expect(wrapper.get('tbody').text()).not.toContain('Loading...')
  })
  test('a row whose text outlived its code still selects that code', async () => {
    status = 'Paid [bank] by Planner'
    statusId = 5
    api.get('/api/statuscode/statuscode/', paginated([code(5, 'Paid [bank]')]))
    const wrapper = await mountInvoice()
    expect(wrapper.get('[id="11-change-status"]').element.value).toBe('Paid [bank]')
  })
  test('empty list has an explicit empty state', async () => {
    api.get(base, paginated([]))
    const wrapper = await mountInvoice()
    expect(wrapper.get('tbody').text()).toContain('No invoices found')
  })
  test('list load failure shows an error and does not remain busy', async () => {
    api.get(base, serverError)
    const wrapper = await mountInvoice()
    expect(bodies()).toContain('Error loading invoices')
    expect(wrapper.text()).not.toContain('Loading...')
  })
  test('status load failure leaves invoice rows visible with status text', async () => {
    api.get('/api/statuscode/statuscode/', serverError)
    const wrapper = await mountInvoice()
    expect(bodies()).toContain('Error loading statuscodes')
    expect(wrapper.get('tbody').text()).toContain('INV-11')
    expect(wrapper.get('.status').text()).toBe('Created')
  })
})
