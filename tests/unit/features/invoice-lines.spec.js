import { afterEach, expect, test, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { HttpResponse } from 'msw'
import { InvoiceLinePanel } from '@/features/invoice'
import { vInvoiceLine, vPaginatedInvoiceLineList } from '@/api/valibot.gen'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../support/api-seam/index.js'
import { mountForm, toastCreate } from '../support/form-harness.js'

vi.mock('bootstrap-vue-next', async original => ({ ...(await original()), useToast: () => ({ create: toastCreate }) }))
const api = installApiSeam()
const base = '/api/invoice/invoice-line/'
const detail = '/api/invoice/invoice-line/{id}/'
const main = { getDefaultCurrency: 'EUR', getInvoiceDefaultVat: '21', getVATTypes: [{ value: '21', text: '21%' }, { value: '9', text: '9%' }] }
const row = (overrides = {}) => fixtureFor(vInvoiceLine, { id: 71, invoice: 42, description: 'Stored labour', amount: '2.00', price: '10.00', price_currency: 'EUR', total: '20.00', total_currency: 'EUR', vat: '4.20', vat_currency: 'EUR', vat_type: '21', ...overrides })
const Parent = defineComponent({
  components: { InvoiceLinePanel },
  props: ['invoicePk'],
  setup() {
    const panel = ref(null)
    const result = ref('')
    async function save() {
      try { await panel.value.saveCollection(42); result.value = 'Saved' }
      catch { result.value = 'Failed' }
    }
    return { panel, result, save }
  },
  template: '<InvoiceLinePanel ref="panel" :invoice-pk="invoicePk" /><button id="save" @click="save">Save</button><output>{{result}}</output>',
})
const wrappers = []
afterEach(() => { wrappers.splice(0).forEach(wrapper => wrapper.unmount()); vi.restoreAllMocks() })
async function mount(invoicePk) {
  const wrapper = mountForm(Parent, { deep: true, props: { invoicePk }, main })
  wrappers.push(wrapper)
  await settle()
  return wrapper
}
async function add(wrapper, description = 'Labour') {
  await wrapper.get('#new-invoice-line-description').setValue(description)
  await wrapper.get('#new-invoice-line-amount').setValue('2')
  await wrapper.get('#new-invoice-line-price .input-number').setValue('10')
  await wrapper.get('#invoice-submit-button').trigger('click')
  await settle()
}
async function save(wrapper) { await wrapper.get('#save').trigger('click'); await settle() }
const requests = method => api.requests().filter(request => request.method === method)

test('renders fetched lines and reads the invoice-scoped list', async () => {
  api.get(base, fixtureFor(vPaginatedInvoiceLineList, { count: 1, results: [row()], next: null, previous: null }))
  const wrapper = await mount(42)
  expect(wrapper.get('.listing-item').text()).toContain('Stored labour')
  expect(wrapper.get('.listing-item').text()).toContain('20.00')
  expect(requests('get')[0].query).toEqual({ invoice: '42' })
})

test('manual entry saves decimal money and repeated save does not duplicate it', async () => {
  api.post(base, ({ body }) => row(body))
  const wrapper = await mount()
  await add(wrapper)
  await save(wrapper)
  expect(wrapper.get('output').text()).toBe('Saved')
  expect(requests('post')[0].body).toMatchObject({ invoice: 42, description: 'Labour', amount: '2', price: '10.00', total: '20.00', vat: '4.20' })
  await save(wrapper)
  expect(requests('post')).toHaveLength(1)
})

test('partial create failure retains the saved ID and retries only the unsaved line', async () => {
  let attempts = 0
  api.post(base, ({ body }) => ++attempts === 2 ? HttpResponse.json({ detail: 'Unavailable' }, { status: 503 }) : row({ ...body, id: 70 + attempts }))
  const wrapper = await mount()
  await add(wrapper, 'First')
  await add(wrapper, 'Second')
  await save(wrapper)
  expect(wrapper.get('output').text()).toBe('Failed')
  await save(wrapper)
  expect(wrapper.get('output').text()).toBe('Saved')
  expect(requests('post').map(request => request.body.description)).toEqual(['First', 'Second', 'Second'])
})

test('removing a saved manual line persists a delete and never repeats it', async () => {
  api.post(base, ({ body }) => row(body))
  api.delete(detail, noContent())
  const wrapper = await mount()
  await add(wrapper)
  await save(wrapper)
  await wrapper.get('[aria-label="Remove invoice line"]').trigger('click')
  await save(wrapper)
  await save(wrapper)
  expect(requests('delete')).toHaveLength(1)
  expect(requests('delete')[0].path).toBe('/api/invoice/invoice-line/71/')
})
