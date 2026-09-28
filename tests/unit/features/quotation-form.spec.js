import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { defineComponent } from 'vue'
import { RouterView } from 'vue-router'
import { QuotationForm, quotationWrite } from '@/features/quotation'
import { vChapter, vQuotation } from '@/api/valibot.gen'
import { fixtureFor, paginated } from '../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountListView, toasts } from '../support/form-harness.js'

const api = installApiSeam()
const base = '/api/quotation/quotation/'
const show = vi.fn()
const PdfStub = defineComponent({
  name: 'QuotationPDFViewer',
  props: ['quotation', 'isView'],
  setup(_, {expose}) { expose({show}) },
  template: '<div class="pdf-stub" />',
})
const customerPick = {id: 3, customer_id: 'C-3', name: 'ACME', address: 'Main 1', postal: '1000AA', city: 'Amsterdam',
  country_code: 'NL', tel: '020', mobile: null, email: 'info@acme.test', contact: 'Jan'}
const MultiselectStub = defineComponent({
  emits: ['select', 'search-change'],
  template: `<div><input class="customer-search" @input="$emit('search-change', $event.target.value)" />
    <button type="button" class="pick-customer" @click="$emit('select', pick)">pick</button></div>`,
  setup: () => ({pick: customerPick}),
})
const main = {
  getDefaultCurrency: 'EUR', getQuotationDefaultVat: 21, getInvoiceDefaultVat: 21, getQuotationDefaultExpireDays: 30,
  getCountries: [{value: 'NL', text: 'Netherlands'}], getVATTypes: [{value: 21, text: '21%'}],
}
const stub = {template: '<div />'}
const routes = [
  {name: 'quotation-add', path: '/quotations/preliminary/form', component: QuotationForm},
  {name: 'quotation-edit-preliminary', path: '/quotations/preliminary/form/:pk', component: QuotationForm, props: true},
  {name: 'quotation-detail', path: '/quotations/quotations/detail/:pk', component: QuotationForm, props: (route) => ({pk: route.params.pk, isView: true})},
  {name: 'quotation-list', path: '/quotations/quotations', component: stub},
  {name: 'preliminary-quotations', path: '/quotations/preliminary', component: stub},
  {name: 'quotation-send', path: '/quotations/sent/form', component: stub},
]
const record = (overrides = {}) => fixtureFor(vQuotation, {
  id: 7, quotation_id: 'Q-7', name: 'Roof', preliminary: true, customer_relation: 3, customer_id: 'C-3',
  quotation_name: 'ACME', quotation_address: 'Main 1', quotation_postal: '1000AA', quotation_city: 'Amsterdam',
  quotation_country_code: 'NL', quotation_email: 'info@acme.test', quotation_tel: null, quotation_mobile: null,
  quotation_contact: null, quotation_reference: 'REF', quotation_expire_days: 14, description: null,
  ...overrides,
})
const bodies = () => toasts().map((toast) => toast.body)
const button = (wrapper, text) => wrapper.findAll('button').find((b) => b.text().trim() === text)
async function click(wrapper, text) {
  const target = button(wrapper, text)
  expect(target, text + ' must be reachable').toBeTruthy()
  await target.trigger('click')
  await settle()
}
let current
beforeEach(() => {
  show.mockClear()
  current = record()
  api.get(base + '{id}/', () => current)
  api.post(base, ({body}) => record({...body, id: 8}))
  api.patch(base + '{id}/', ({body}) => (current = record({...current, ...body})))
  api.get('/api/quotation/chapter/', paginated([fixtureFor(vChapter, {id: 5, quotation: 7, name: 'Roof chapter', description: null})]))
  api.get('/api/quotation/document/', paginated([]))
  api.get('/api/quotation/quotation-line/', paginated([]))
  api.get('/api/quotation/cost/', paginated([]))
})
const wrappers = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))
async function openForm(location) {
  const wrapper = await mountListView(RouterView, {
    deep: true, routes, main, stubs: {QuotationPDFViewer: PdfStub, VueMultiselect: MultiselectStub},
  })
  wrappers.push(wrapper)
  await wrapper.vm.$router.push(location)
  await settle()
  return wrapper
}

describe('creating', () => {
  test('a new quotation starts with the customer search and no details, documents or chapters', async () => {
    const wrapper = await openForm({name: 'quotation-add'})
    expect(wrapper.get('h3').text()).toContain('new')
    expect(wrapper.find('#quotation_name').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Chapters')
    expect(api.requests().filter((r) => r.method === 'get')).toEqual([])
  })
  test('the customer search asks the autocomplete, and not for an empty term', async () => {
    api.get('/api/customer/customer/autocomplete/', [])
    const wrapper = await openForm({name: 'quotation-add'})
    await wrapper.get('.customer-search').setValue('')
    await settle()
    expect(api.requests().filter((r) => r.path === '/api/customer/customer/autocomplete/')).toEqual([])
    await wrapper.get('.customer-search').setValue('acme')
    await settle()
    expect(api.requests().filter((r) => r.path === '/api/customer/customer/autocomplete/').map((r) => r.query)).toEqual([{q: 'acme'}])
  })
  test('the customer is required', async () => {
    const wrapper = await openForm({name: 'quotation-add'})
    await click(wrapper, 'Save')
    expect(api.requests().filter((r) => r.method === 'post')).toEqual([])
    expect(wrapper.find('#quotation_quotation_name.is-invalid').exists()).toBe(true)
  })
  test('picking a customer fills the address and shows the details; save creates and opens the edit route', async () => {
    const wrapper = await openForm({name: 'quotation-add'})
    await wrapper.get('.pick-customer').trigger('click')
    await settle()
    expect(wrapper.get('#quotation_quotation_address').element.value).toBe('Main 1')
    expect(wrapper.get('#quotation_quotation_expire_days').element.value).toBe('30')
    expect(wrapper.text()).toContain('Save quotation to start adding chapters')
    await click(wrapper, 'Save')
    expect(api.requests().filter((r) => r.method === 'post')).toEqual([])
    expect(wrapper.find('#quotation_name.is-invalid').exists()).toBe(true)
    await wrapper.get('#quotation_name').setValue('Roof')
    await click(wrapper, 'Save')
    const [post] = api.requests().filter((r) => r.method === 'post')
    expect(post.body).toMatchObject({
      customer_relation: 3, customer_id: 'C-3', quotation_name: 'ACME', quotation_address: 'Main 1',
      quotation_postal: '1000AA', quotation_city: 'Amsterdam', quotation_country_code: 'NL',
      quotation_email: 'info@acme.test', quotation_contact: 'Jan', quotation_mobile: null,
      name: 'Roof', quotation_expire_days: 30,
    })
    expect(bodies()).toContain('Quotation has been created')
    expect(wrapper.vm.$route).toMatchObject({name: 'quotation-edit-preliminary', params: {pk: '8'}})
  })
})

describe('editing', () => {
  test('loads the quotation into the form, with documents and chapters', async () => {
    const wrapper = await openForm({name: 'quotation-edit-preliminary', params: {pk: 7}})
    expect(api.requests().find((r) => r.path === base + '7/')).toBeTruthy()
    expect(wrapper.get('h3').text()).toContain('ACME')
    expect(wrapper.get('#quotation_quotation_name').element.value).toBe('ACME')
    expect(wrapper.get('#quotation_name').element.value).toBe('Roof')
    expect(wrapper.get('#quotation_quotation_expire_days').element.value).toBe('14')
    expect(wrapper.text()).toContain('Roof chapter')
    expect(button(wrapper, 'Send quotation')).toBeUndefined()
  })
  test('saving patches the form fields, toasts and opens the PDF viewer', async () => {
    const wrapper = await openForm({name: 'quotation-edit-preliminary', params: {pk: 7}})
    await wrapper.get('#quotation_quotation_reference').setValue('')
    await click(wrapper, 'Save')
    const [patch] = api.requests().filter((r) => r.method === 'patch')
    expect(patch.path).toBe(base + '7/')
    // A cleared field is cleared, not dropped.
    expect(patch.body).toMatchObject({name: 'Roof', quotation_reference: null})
    expect(patch.body).not.toHaveProperty('preliminary')
    expect(bodies()).toContain('Quotation has been updated')
    expect(show).toHaveBeenCalledOnce()
  })
  test('the schema refuses a malformed e-mail', () => {
    const values = {...record(), quotation_email: 'not-an-address'}
    expect(quotationWrite.validate(values, {isCreate: false}).quotation_email).toBeTruthy()
  })
  test('a definitive quotation can be sent and not saved', async () => {
    current = record({preliminary: false})
    const wrapper = await openForm({name: 'quotation-edit-preliminary', params: {pk: 7}})
    expect(button(wrapper, 'Save')).toBeUndefined()
    await click(wrapper, 'Send quotation')
    expect(wrapper.vm.$route).toMatchObject({name: 'quotation-send', query: {quotationId: '7'}})
  })
  test('View quotation opens the PDF viewer', async () => {
    const wrapper = await openForm({name: 'quotation-edit-preliminary', params: {pk: 7}})
    await wrapper.findAll('a').find((a) => a.text().includes('View quotation')).trigger('click')
    expect(show).toHaveBeenCalledOnce()
    expect(wrapper.findComponent(PdfStub).props('quotation').id).toBe(7)
  })
  test('a chapter opens its workspace, and back returns to the quotation', async () => {
    const wrapper = await openForm({name: 'quotation-edit-preliminary', params: {pk: 7}})
    await wrapper.findAll('a').find((a) => a.text() === 'Roof chapter').trigger('click')
    await settle()
    expect(wrapper.text()).toContain('Chapter costs')
    expect(wrapper.text()).toContain('Quotation lines chapter')
    const costReads = api.requests().filter((r) => r.path === '/api/quotation/cost/')
    expect(costReads.map((r) => r.query.cost_type).sort()).toEqual(['call_out_costs', 'distance', 'travel_hours', 'used_materials', 'work_hours'])
    expect(costReads.every((r) => r.query.chapter === '5' && r.query.quotation === '7')).toBe(true)
    await click(wrapper, 'Back to quotation and chapters')
    expect(wrapper.find('#quotation_name').exists()).toBe(true)
  })
})

describe('viewing', () => {
  test('the detail route shows the customer and details read-only, no save', async () => {
    const wrapper = await openForm({name: 'quotation-detail', params: {pk: 7}})
    expect(wrapper.find('#quotation_quotation_name').exists()).toBe(false)
    expect(wrapper.findAll('p.value').map((p) => p.text())).toEqual(expect.arrayContaining(['ACME', 'Roof', 'REF', '14']))
    expect(button(wrapper, 'Save')).toBeUndefined()
    expect(button(wrapper, 'New chapter')).toBeUndefined()
    expect(wrapper.findComponent(PdfStub).props('isView')).toBe(true)
  })
})
