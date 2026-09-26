import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { QuotationView } from '@/features/quotation'
import { vChapter, vQuotation, vQuotationDocument, vQuotationLine } from '@/api/valibot.gen'
import { fixtureFor, paginated } from '../helpers/schema-fixture.js'
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
  name: 'QuotationPDFViewer',
  props: ['quotation', 'quotationIn', 'isView'],
  setup(_, { expose }) { expose({ show }) },
  template: '<div class="pdf-stub" />',
})
const routes = [
  { path: '/quotations/sent', name: 'quotations-sent', component: { template: '<div />' } },
  { path: '/quotations/send', name: 'quotation-send', component: { template: '<div />' } },
]
const quotation = () => fixtureFor(vQuotation, {
  id: 7, quotation_id: 'Q-7', quotation_name: 'ACME', quotation_reference: 'REF-1', customer_id: 'C1',
  quotation_address: 'Street 1', quotation_country_code: 'NL', quotation_postal: '1234AB', quotation_city: 'Utrecht',
  quotation_expire_days: 30, created: '01/01/2026', modified: '02/01/2026', definitive_date: '2026-01-03',
  quotation_contact: 'Jan', total: '242.00', total_currency: 'EUR', vat: '42.00', vat_currency: 'EUR',
})
const chapter = (id, name) => fixtureFor(vChapter, { id, quotation: 7, name, description: null })
const line = (id, chapterId, info) => fixtureFor(vQuotationLine, {
  id, quotation: 7, chapter: chapterId, info, amount: '2.00', vat_type: '21',
  price: '50.00', price_currency: 'EUR', total: '100.00', total_currency: 'EUR', vat: '21.00', vat_currency: 'EUR',
})
const lines = [line(1, 10, 'Tiles'), line(2, 11, 'Gutter'), line(3, 10, 'Labour')]
beforeEach(() => {
  show.mockClear()
  api.get('/api/quotation/quotation/{id}/', quotation())
  api.get('/api/quotation/chapter/', paginated([chapter(10, 'Roof'), chapter(11, 'Gutters')]))
  api.get('/api/quotation/quotation-line/', ({ query }) => paginated(lines.filter((item) =>
    query.chapter ? String(item.chapter) === query.chapter : String(item.quotation) === query.quotation)))
  api.get('/api/quotation/document/', paginated([fixtureFor(vQuotationDocument, { id: 5, quotation: 7, name: 'plan.pdf' })]))
})
async function mountView(component = QuotationView) {
  const wrapper = mountForm(component, {
    deep: true, routes, props: { pk: '7' },
    main: {
      getMemberLogo: '/logo.png',
      getMemberInfo: { name: 'My Company', companylogo: '/logo.png', address: 'Main 1', postal: '1000AA', city: 'Amsterdam', tel: '020', email: 'info@example.com' },
      getDefaultCurrency: 'EUR',
    },
    stubs: { QuotationPDFViewer: PdfStub },
  })
  await settle()
  return wrapper
}
const normalise = (html) => html.replace(/ id="[^"]*"/g, '').replace(/ for="[^"]*"/g, '')

test('renders the legacy view\'s markup', async () => {
  // The snapshot was taken only after this view's HTML was proven byte-identical
  // to the legacy QuotationView's (since deleted), for this same fixture.
  const current = normalise((await mountView()).html())
  expect(current).toMatchSnapshot()
})
test('reads the quotation, its chapters and all its lines at once', async () => {
  await mountView()
  const gets = api.requests().filter((request) => request.method === 'get' && !request.path.startsWith('/api/quotation/document/'))
  expect(gets.map((request) => request.path).sort()).toEqual([
    '/api/quotation/chapter/', '/api/quotation/quotation-line/', '/api/quotation/quotation/7/',
  ])
  expect(gets.find((request) => request.path === '/api/quotation/chapter/').query).toEqual({ quotation: '7', page: '1', page_size: '1000' })
  expect(gets.find((request) => request.path === '/api/quotation/quotation-line/').query).toEqual({ quotation: '7', page: '1', page_size: '1000' })
})
test('groups the lines under their chapter, in chapter order', async () => {
  const wrapper = await mountView()
  expect(wrapper.findAll('h4').map((h) => h.text())).toEqual(['Roof', 'Gutters'])
  const tables = wrapper.findAll('table.table-bordered')
  expect(tables[0].findAll('tbody tr').map((tr) => tr.find('td').text())).toEqual(['Tiles', 'Labour'])
  expect(tables[1].findAll('tbody tr').map((tr) => tr.find('td').text())).toEqual(['Gutter'])
  expect(tables[0].text()).toContain('€50.00')
  expect(tables[0].text()).toContain('€100.00')
  expect(tables[0].text()).toContain('€21.00')
})
test('shows the letterhead and the customer block', async () => {
  const wrapper = await mountView()
  expect(wrapper.get('img.thumbnail').attributes('src')).toBe('/logo.png')
  for (const text of ['My Company', 'Q-7', 'REF-1', 'C1', 'NL-1234AB Utrecht', '30', '2026-01-03', 'Jan']) {
    expect(wrapper.text()).toContain(text)
  }
})
test('View PDF opens the viewer through its exposed handle', async () => {
  const wrapper = await mountView()
  await wrapper.findAll('a').find((a) => a.text().includes('View PDF')).trigger('click')
  expect(show).toHaveBeenCalledOnce()
  expect(wrapper.findComponent(PdfStub).props('quotation').id).toBe(7)
  expect(wrapper.findComponent(PdfStub).props('isView')).toBe(true)
})
test('Send quotation opens the offer form for this quotation', async () => {
  const wrapper = await mountView()
  await wrapper.findAll('button').find((b) => b.text().includes('Send quotation')).trigger('click')
  await settle()
  expect(wrapper.vm.$route.name).toBe('quotation-send')
  expect(wrapper.vm.$route.query.quotationId).toBe('7')
})
test('a failed read toasts and renders nothing', async () => {
  api.get('/api/quotation/quotation/{id}/', serverError)
  const wrapper = await mountView()
  expect(toasts().map((toast) => toast.body)).toContain('Error fetching quotation')
  expect(wrapper.find('header').exists()).toBe(false)
  expect(wrapper.find('.page-detail').exists()).toBe(false)
})
