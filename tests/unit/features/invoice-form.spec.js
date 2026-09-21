import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'
import { InvoiceForm } from '@/features/invoice'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountForm, toastCreate, toasts } from '../support/form-harness.js'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { vInvoiceDataResponse, vInvoice, vInvoiceLine, vCustomer, vPaginatedInvoiceLineList, vPaginatedOrderCostList } from '@/api/valibot.gen'

vi.mock('bootstrap-vue-next', async original => ({ ...(await original()), useToast: () => ({ create: toastCreate }) }))
const api = installApiSeam()
const BOOT = '/api/invoice/invoice/data/{id}/'
const INVOICE = '/api/invoice/invoice/'
const DETAIL = '/api/invoice/invoice/{id}/'
const LINES = '/api/invoice/invoice-line/'
const orderUuid = '00000000-0000-4000-8000-00000000000a'
const invoice = overrides => fixtureFor(vInvoice, { id: 901, order: 42, order_uuid: orderUuid, invoice_id: 'INV-901', reference: 'Saved reference', description: 'Saved description', term_of_payment_days: 30, preliminary: true, ...overrides })
const bootstrap = () => fixtureFor(vInvoiceDataResponse, {
  order_pk: 42, customer_pk: 7, invoice_id: 3001, order_id: 'O-42', order_reference: 'ref-42',
  invoice_default_call_out_costs: '2.50', invoice_default_hourly_rate: '55.00',
  invoice_default_partner_hourly_rate: null, invoice_default_price_per_km: '0.40',
  used_materials: [], material_models: [], activity: [], engineer_models: [],
  activity_totals: { work_total: '00:00', travel_total: '00:00', extra_work_total: '00:00', actual_work_total: '00:00', distance_total: 0, user_totals: [] },
})
const main = {
  getDefaultCurrency: 'EUR', getInvoiceDefaultVat: '21', getInvoiceDefaultTermOfPaymentDays: 14,
  getInvoiceDefaultHourlyRate: '55.00', getInvoiceDefaultPartnerHourlyRate: '50.00',
  getInvoiceDefaultPricePerKm: '0.40', getInvoiceDefaultCallOutCosts: '2.50',
  getVATTypes: [{ value: '21', text: '21%' }, { value: '9', text: '9%' }],
}
const wrappers = []
let savedLines
beforeEach(() => {
  savedLines = []
  toastCreate.mockClear()
  api.get(BOOT, bootstrap())
  api.get('/api/customer/customer/{id}/', fixtureFor(vCustomer, { id: 7, name: 'Test customer' }))
  api.get('/api/order/cost/', fixtureFor(vPaginatedOrderCostList, { count: 0, results: [], next: null, previous: null }))
  api.get(DETAIL, invoice())
  api.post(INVOICE, ({ body }) => invoice(body))
  api.patch(DETAIL, ({ body }) => invoice(body))
  api.post(LINES, ({ body }) => {
    const record = fixtureFor(vInvoiceLine, { ...body, id: 800 + savedLines.length, price_currency: 'EUR', total_currency: 'EUR', vat_currency: 'EUR' })
    savedLines.push(record)
    return record
  })
  api.get(LINES, () => fixtureFor(vPaginatedInvoiceLineList, { count: savedLines.length, results: savedLines, next: null, previous: null }))
})
afterEach(() => { wrappers.splice(0).forEach(wrapper => wrapper.unmount()); vi.restoreAllMocks() })
const requests = method => api.requests().filter(request => request.method === method)
const posts = path => requests('post').filter(request => request.path === path)
const routes = [
  { name: 'invoice-edit', path: '/edit/:pk/order/:uuid', component: { template: '<div />' } },
  { name: 'invoice-list', path: '/invoices', component: { template: '<div />' } },
  { name: 'order-view', path: '/orders/:pk', component: { template: '<div />' } },
]
async function open(props = {}) {
  const wrapper = mountForm(InvoiceForm, { deep: true, routes, props: { uuid: orderUuid, ...props }, main })
  wrappers.push(wrapper)
  await settle()
  return wrapper
}
async function addLine(wrapper) {
  await wrapper.get('#new-invoice-line-description').setValue('Labour')
  await wrapper.get('#new-invoice-line-amount').setValue('2')
  await wrapper.get('#new-invoice-line-price .input-number').setValue('10')
  await wrapper.get('#invoice-submit-button').trigger('click')
  await settle()
}
async function save(wrapper) { await wrapper.get('#save-invoice').trigger('click'); await settle() }

test('create flow persists the rendered line after invoice creation and navigates to edit', async () => {
  const wrapper = await open()
  await addLine(wrapper)
  await save(wrapper)
  expect(posts(INVOICE)).toHaveLength(1)
  expect(posts(INVOICE)[0].body).toMatchObject({ order: 42, total: '20.00', vat: '4.20' })
  expect(posts(LINES)).toHaveLength(1)
  expect(posts(LINES)[0].body).toMatchObject({ invoice: 901, amount: '2', price: '10.00', total: '20.00', vat: '4.20' })
  expect(wrapper.vm.$router.currentRoute.value.name).toBe('invoice-edit')
  expect(toasts().map(toast => toast.body)).toContain('Invoice has been created')
})
test('bootstrap data populates the editor header', async () => {
  const wrapper = await open()
  expect(wrapper.get('#invoice_id').element.value).toBe('3001')
  expect(wrapper.get('#invoice_reference').element.value).toBe('ref-42')
})
test('edit uses saved invoice fields rather than bootstrap defaults and patches changes', async () => {
  const wrapper = await open({ pk: '901' })
  expect(wrapper.get('#invoice_id').element.value).toBe('INV-901')
  expect(wrapper.get('#invoice_reference').element.value).toBe('Saved reference')
  expect(wrapper.get('#invoice_description').element.value).toBe('Saved description')
  expect(wrapper.get('#invoice_term_of_payment_days').element.value).toBe('30')
  await wrapper.get('#invoice_reference').setValue('Updated reference')
  await save(wrapper)
  expect(posts(INVOICE)).toHaveLength(0)
  expect(requests('patch')[0].body).toMatchObject({ reference: 'Updated reference', invoice_id: 'INV-901', description: 'Saved description', term_of_payment_days: 30 })
})
test('line failure retains the created invoice and retries without duplicate invoice POST', async () => {
  let attempts = 0
  api.post(LINES, ({ body }) => ++attempts === 1 ? HttpResponse.json({ detail: 'Unavailable' }, { status: 503 }) : fixtureFor(vInvoiceLine, { ...body, id: 88, price_currency: 'EUR', total_currency: 'EUR', vat_currency: 'EUR' }))
  const wrapper = await open()
  await addLine(wrapper)
  await save(wrapper)
  expect(wrapper.vm.$router.currentRoute.value.name).not.toBe('invoice-edit')
  expect(wrapper.findAll('.listing-item')).toHaveLength(1)
  await save(wrapper)
  expect(posts(INVOICE)).toHaveLength(1)
  expect(posts(LINES)).toHaveLength(2)
  expect(requests('patch')).toHaveLength(1)
  expect(wrapper.vm.$router.currentRoute.value.name).toBe('invoice-edit')
})
