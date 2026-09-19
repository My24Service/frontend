import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import InvoiceView from '@/features/invoice/detail/InvoiceView.vue'
import { vInvoiceView, vInvoiceLine } from '@/api/valibot.gen'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountForm, toasts } from '../support/form-harness.js'
import { serverError } from '../support/list-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})
enableAutoUnmount(afterEach)
const api = installApiSeam()
const show = vi.fn()
const PdfStub = defineComponent({
  props: ['invoice', 'isView'],
  setup(_, { expose }) { expose({ show }) },
  template: '<div class="pdf-stub" />',
})
const uuid = 'd73f4135-2cb8-4e3b-b4cc-53062b0ad484'
const routes = [
  { path: '/invoices', name: 'invoice-list', component: { template: '<div />' } },
  { path: '/orders/:pk', name: 'order-view', component: { template: '<div />' } },
  { path: '/send', name: 'invoice-send', component: { template: '<div />' } },
]
const detail = () => fixtureFor(vInvoiceView, {
  id: 8, uuid, invoice_id: 'INV-8', order: 42,
  total: '25.00', total_currency: 'EUR', vat: '5.25', vat_currency: 'EUR',
  invoicelines: [fixtureFor(vInvoiceLine, {
    id: 9, invoice: 8, description: 'Service visit', amount: '1.00',
    price: '25.00', price_currency: 'EUR', total: '25.00', total_currency: 'EUR',
    vat: '5.25', vat_currency: 'EUR',
  })],
})
beforeEach(() => {
  show.mockClear()
  api.get('/api/invoice/invoice-detail/{id}/', detail())
})
async function mountView(component = InvoiceView) {
  const wrapper = mountForm(component, {
    deep: true, routes, props: { uuid },
    main: { getMemberLogo: '/logo.png', getDefaultCurrency: 'EUR' },
    stubs: { InvoicePDFViewer: PdfStub },
  })
  await settle()
  return wrapper
}
test('renders exactly the legacy detail markup', async () => {
  // Captured only after comparing the legacy and migrated components byte-for-byte.
  const current = await mountView()
  expect(current.html()).toMatchSnapshot()
})
test('loads the UUID through the generated client and displays monetary lines', async () => {
  const wrapper = await mountView()
  expect(api.requests()[0]).toMatchObject({ method: 'get', path: '/api/invoice/invoice-detail/' + uuid + '/', query: {} })
  expect(wrapper.text()).toContain('INV-8')
  expect(wrapper.text()).toContain('Service visit')
  expect(wrapper.text()).toContain('€25.00')
  expect(wrapper.text()).toContain('€5.25')
  expect(wrapper.find('a[href="/orders/42"]').exists()).toBe(true)
})
test('forwards View PDF to the existing exposed modal handle', async () => {
  const wrapper = await mountView()
  await wrapper.findAll('a').find(a => a.text().includes('View PDF')).trigger('click')
  expect(show).toHaveBeenCalledOnce()
  expect(wrapper.findComponent(PdfStub).props('invoice').id).toBe(8)
  expect(wrapper.findComponent(PdfStub).props('isView')).toBe(true)
})
test('sends the current invoice id to the email route', async () => {
  const wrapper = await mountView()
  await wrapper.findAll('button').find(b => b.text().includes('Send invoice')).trigger('click')
  await settle()
  expect(wrapper.vm.$route.name).toBe('invoice-send')
  expect(wrapper.vm.$route.query.invoiceId).toBe('8')
})
test('refetches when the UUID prop changes', async () => {
  const wrapper = await mountView()
  const next = 'd73f4135-2cb8-4e3b-b4cc-53062b0ad485'
  await wrapper.setProps({ uuid: next })
  await settle()
  expect(api.requests().at(-1).path).toBe('/api/invoice/invoice-detail/' + next + '/')
})
test('reports a failed detail read without rendering an invoice', async () => {
  api.get('/api/invoice/invoice-detail/{id}/', serverError)
  const wrapper = await mountView()
  expect(toasts()).toContainEqual(expect.objectContaining({ body: 'Error loading invoice' }))
  expect(wrapper.find('.page-detail').exists()).toBe(false)
})
