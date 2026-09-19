import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'
import TeamleaderProductChooser from '@/components/TeamleaderProductChooser.vue'
import InvoiceForm from '@/features/invoice/form/InvoiceForm.vue'
import HoursPanel from '@/features/invoice/form/panels/HoursPanel.vue'
import MaterialsPanel from '@/features/invoice/form/panels/MaterialsPanel.vue'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountForm, toastCreate } from '../support/form-harness.js'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { vProduct, vTaxRate, vPaginatedTaxRateList, vConfig, vInvoiceDataResponse, vProductList, vCustomer, vMaterial, vAssignedOrderMaterialTotals, vActivityUserTotal, vEngineer, vOrderCost, vPaginatedOrderCostList } from '@/api/valibot.gen'

vi.mock('bootstrap-vue-next', async original => ({ ...(await original()), useToast: () => ({ create: toastCreate }) }))
const api = installApiSeam()
const orderUuid = '00000000-0000-4000-8000-00000000000a'
const main = {
  getDefaultCurrency: 'EUR', getInvoiceDefaultVat: '21', getInvoiceDefaultTermOfPaymentDays: 14,
  getInvoiceDefaultHourlyRate: '50.00',
  getVATTypes: [{ value: '21', text: '21%' }],
  getModules: ['company'], getModuleParts: { company: ['teamleader'] },
}
const material = () => fixtureFor(vMaterial, {
  id: 11, name: 'Cable', identifier: 'CBL-1', price_purchase_ex: '5.00', price_selling_ex: '10.00',
  price_purchase_ex_currency: 'EUR', price_selling_ex_currency: 'EUR',
})
const bootstrap = () => fixtureFor(vInvoiceDataResponse, {
  order_pk: 42, customer_pk: 7, invoice_id: 3001, order_id: 'O-42', order_reference: 'ref-42',
  invoice_default_call_out_costs: '2.50', invoice_default_price_per_km: '0.40',
  used_materials: [fixtureFor(vAssignedOrderMaterialTotals, { id: 11, name: 'Cable', identifier: 'CBL-1', amount: 2 })],
  material_models: [material()],
  engineer_models: [fixtureFor(vEngineer, { id: 7, full_name: 'Alex Engineer' })],
  activity_totals: {
    work_total: '01:00', travel_total: '01:00', extra_work_total: '00:00', actual_work_total: '00:00', distance_total: 0,
    user_totals: [fixtureFor(vActivityUserTotal, { user_id: 7, full_name: 'Alex Engineer', work_total: '01:00:00', work_total_secs: 3600, travel_total: '01:00:00', travel_total_secs: 3600 })],
  },
})
const config = (json_data = { workhours_product_selling_price: '70.00', travel_hours_product_selling_price: 35 }) => fixtureFor(vConfig, { has_tokens: true, json_data })
const routes = [{ name: 'invoice-list', path: '/invoices', component: { template: '<div />' } }]
const bulk = '/api/order/cost/order/{order_id}/{cost_type}/'
const bulkPath = (orderId, costType) => `/api/order/cost/order/${orderId}/${costType}/`
const wrappers = []
beforeEach(() => {
  api.get('/api/invoice/invoice/data/{id}/', bootstrap())
  api.get('/api/customer/customer/{id}/', fixtureFor(vCustomer, { id: 7, name: 'Test customer' }))
  api.get('/api/order/cost/', fixtureFor(vPaginatedOrderCostList, { count: 0, results: [], next: null, previous: null }))
  // The server prices the set: rows come back with stored ids and the
  // server's own totals, which the panels adopt.
  api.post(bulk, ({ body }) => body.map(row => fixtureFor(vOrderCost, { ...row, id: 71 })))
  api.get('/api/teamleader/config/', config())
  api.get('/api/teamleader/tl-product-list/', [fixtureFor(vProductList, { id: 5, material: material(), uuid: '00000000-0000-4000-8000-000000000011', purchase_price: '5.00', selling_price: '9.00' })])
})
afterEach(() => { wrappers.splice(0).forEach(wrapper => wrapper.unmount()); vi.restoreAllMocks() })
const requests = path => api.requests().filter(request => request.path === path)
async function open({ teamleader = true, superuser = false } = {}) {
  const wrapper = mountForm(InvoiceForm, {
    deep: true, stubs: { teleport: true }, routes, props: { uuid: orderUuid },
    main: { ...main, getModuleParts: { company: teamleader ? ['teamleader'] : [] } },
    auth: { isStaff: false, isSuperuser: superuser },
  })
  wrappers.push(wrapper)
  await settle()
  return wrapper
}
async function saveCosts(panel) {
  const button = panel.findAll('button').find(button => button.text().trim() === 'Save costs')
  expect(button, 'Save costs must be rendered').toBeTruthy()
  await button.trigger('click')
  await settle()
}
const costPosts = () => api.requests().filter(request => request.method === 'post' && request.path.startsWith('/api/order/cost/order/'))
const rowOf = request => request.body[0]

test('Teamleader prices reach rendered hour and material controls and persisted costs', async () => {
  const wrapper = await open()
  expect(requests('/api/teamleader/config/')).toHaveLength(1)
  expect(requests('/api/teamleader/tl-product-list/')[0].query).toEqual({ ids: '11' })
  const hours = wrapper.findAllComponents(HoursPanel)
  expect(hours).toHaveLength(2)
  for (const panel of hours) {
    expect(panel.text()).toContain('Teamleader')
    await saveCosts(panel)
  }
  const materials = wrapper.getComponent(MaterialsPanel)
  expect(materials.text()).toContain('Cable')
  expect(materials.text()).toContain('Teamleader')
  await saveCosts(materials)
  expect(costPosts().map(request => request.path)).toEqual([
    bulkPath(42, 'work_hours'), bulkPath(42, 'travel_hours'), bulkPath(42, 'used_materials'),
  ])
  // The panels send their inputs priced off the Teamleader rates; the order
  // and cost type travel in the URL and the totals come back priced.
  expect(rowOf(costPosts()[0])).toMatchObject({ price: '70.00', amount_duration: '3600' })
  expect(rowOf(costPosts()[1])).toMatchObject({ price: '35.00', amount_duration: '3600' })
  expect(rowOf(costPosts()[2])).toMatchObject({ material: 11, price: '9.00', amount_decimal: '2' })
  for (const post of costPosts()) {
    expect(post.body).toHaveLength(1)
    for (const key of ['order', 'cost_type', 'total', 'vat']) {
      expect(rowOf(post)).not.toHaveProperty(key)
    }
  }
})
test('non-Teamleader tenant retains ordinary pricing controls and makes no integration requests', async () => {
  const wrapper = await open({ teamleader: false })
  expect(requests('/api/teamleader/config/')).toHaveLength(0)
  expect(requests('/api/teamleader/tl-product-list/')).toHaveLength(0)
  const hours = wrapper.findAllComponents(HoursPanel)[0]
  expect(hours.text()).not.toContain('Teamleader')
  expect(hours.get('.input-number').element.value).toBe('50')
  await saveCosts(hours)
  const materials = wrapper.getComponent(MaterialsPanel)
  expect(materials.text()).not.toContain('Teamleader')
  expect(materials.get('.input-number').element.value).toBe('10')
  await saveCosts(materials)
  expect(costPosts().map(request => request.path)).toEqual([
    bulkPath(42, 'work_hours'), bulkPath(42, 'used_materials'),
  ])
  expect(rowOf(costPosts()[0])).toMatchObject({ price: '50.00', amount_duration: '3600' })
  expect(rowOf(costPosts()[1])).toMatchObject({ material: 11, price: '10.00', amount_decimal: '2' })
  for (const post of costPosts()) {
    for (const key of ['order', 'cost_type', 'total', 'vat']) {
      expect(rowOf(post)).not.toHaveProperty(key)
    }
  }
})
test('superuser retains the legacy module-access override', async () => {
  const wrapper = await open({ teamleader: false, superuser: true })
  expect(requests('/api/teamleader/config/')).toHaveLength(1)
  expect(wrapper.findAllComponents(HoursPanel)[0].text()).toContain('Teamleader')
})
test('missing or invalid configured rates preserve ordinary pricing instead of charging zero', async () => {
  api.get('/api/teamleader/config/', config({ workhours_product_selling_price: 'invalid' }))
  const wrapper = await open()
  for (const panel of wrapper.findAllComponents(HoursPanel)) {
    expect(panel.text()).not.toContain('Teamleader')
    await saveCosts(panel)
  }
  expect(costPosts().map(request => rowOf(request).price)).toEqual(['50.00', '50.00'])
})

const productId = '00000000-0000-4000-8000-000000000022'
const taxId = '00000000-0000-4000-8000-000000000021'
function chooserApi() {
  let linked = false
  api.get('/api/teamleader/tl-product-list/', () => linked ? [fixtureFor(vProductList, { id: 5, material: material(), uuid: productId, purchase_price: '6.00', selling_price: '12.00' })] : [])
  api.get('/api/teamleader/product-list/', [{ id: productId, name: 'Linked Cable', code: 'TL-CBL', description: 'Cable product' }])
  api.get('/api/teamleader/product-detail/', { id: productId, name: 'Linked Cable', tax: { id: taxId }, purchase_price: { amount: '6.00', currency: 'EUR' }, selling_price: { amount: '12.00', currency: 'EUR' } })
  api.get('/api/teamleader/tax-rate/', fixtureFor(vPaginatedTaxRateList, { count: 1, results: [fixtureFor(vTaxRate, { uuid: taxId, rate: '0.21', description: 'VAT' })] }))
  api.post('/api/teamleader/tl-product-create/', ({ body }) => { linked = true; return fixtureFor(vProduct, { ...body, id: 5 }) })
  api.post('/api/teamleader/tl-product-create-link/', () => { linked = true; return { is_ok: true, material: 11 } })
}
async function clickText(wrapper, text) {
  const button = wrapper.findAll('button').find(button => button.text().trim() === text)
  expect(button, text + ' must be rendered').toBeTruthy()
  await button.trigger('click')
  await settle()
}
async function searchAndSelect(wrapper) {
  const chooser = wrapper.getComponent(TeamleaderProductChooser)
  await clickText(chooser, 'Search')
  await chooser.get('#products-table tbody tr').trigger('click')
  await settle()
}

test('rendered existing-product selection links once and refreshes draft material pricing without losing quantity', async () => {
  chooserApi()
  const wrapper = await open()
  const materials = wrapper.getComponent(MaterialsPanel)
  await materials.get('.material_row input[type="number"]').setValue('3')
  expect(wrapper.text()).not.toContain('Prices for customer')
  await clickText(wrapper, 'Not yet linked')
  await searchAndSelect(wrapper)
  expect(requests('/api/teamleader/tl-product-create/')).toHaveLength(1)
  expect(requests('/api/teamleader/tl-product-create/')[0].body).toEqual({ material: 11, uuid: productId, purchase_price: '6.00', selling_price: '12.00', tax_percentage: '0.21' })
  expect(wrapper.findAll('button').some(button => button.text().trim() === 'View')).toBe(true)
  await saveCosts(materials)
  expect(rowOf(costPosts()[0])).toMatchObject({ material: 11, amount_decimal: '3', price: '12.00' })
  expect(rowOf(costPosts()[0])).not.toHaveProperty('total')
  await clickText(wrapper, 'View')
  expect(wrapper.getComponent(TeamleaderProductChooser).findAll('button').some(button => button.text().trim() === 'Search')).toBe(true)
})
test('failed existing-product link stays available for a rendered retry', async () => {
  chooserApi()
  let attempts = 0
  api.post('/api/teamleader/tl-product-create/', ({ body }) => ++attempts === 1 ? HttpResponse.json({ detail: 'retry' }, { status: 500 }) : fixtureFor(vProduct, { ...body, id: 5 }))
  const wrapper = await open()
  await clickText(wrapper, 'Not yet linked')
  await searchAndSelect(wrapper)
  expect(toastCreate).toHaveBeenCalled()
  await wrapper.getComponent(TeamleaderProductChooser).get('#products-table tbody tr').trigger('click')
  await settle()
  expect(attempts).toBe(2)
})
test('rendered new-product creation is persisted by the shared chooser only, then refreshes parent links', async () => {
  chooserApi()
  const wrapper = await open()
  await clickText(wrapper, 'Not yet linked')
  const chooser = wrapper.getComponent(TeamleaderProductChooser)
  await clickText(chooser, 'Add new Teamleader product')
  expect(chooser.get('#name-input').element.value).toBe('Cable')
  expect(chooser.get('#code-input').element.value).toBe('CBL-1')
  await clickText(chooser, 'Create')
  expect(requests('/api/teamleader/tl-product-create-link/')).toHaveLength(1)
  expect(requests('/api/teamleader/tl-product-create-link/')[0].body).toMatchObject({ material: 11, name: 'Cable', tax_rate_id: taxId, purchase_price: '5.00', selling_price: '10.00' })
  expect(requests('/api/teamleader/tl-product-create/')).toHaveLength(0)
  expect(wrapper.findAll('button').some(button => button.text().trim() === 'View')).toBe(true)
})

test('failed child creation keeps the draft open without a parent link POST', async () => {
  chooserApi()
  api.post('/api/teamleader/tl-product-create-link/', { is_ok: false, material: 11, error: 'Unavailable' })
  const wrapper = await open()
  await clickText(wrapper, 'Not yet linked')
  const chooser = wrapper.getComponent(TeamleaderProductChooser)
  await clickText(chooser, 'Add new Teamleader product')
  await chooser.get('#name-input').setValue('Custom cable')
  await clickText(chooser, 'Create')
  expect(chooser.get('#name-input').element.value).toBe('Custom cable')
  expect(requests('/api/teamleader/tl-product-create-link/')).toHaveLength(1)
  expect(requests('/api/teamleader/tl-product-create/')).toHaveLength(0)
  expect(requests('/api/teamleader/tl-product-list/')).toHaveLength(1)
})
test('unknown product detail fails closed without sending a link POST', async () => {
  chooserApi()
  api.get('/api/teamleader/product-detail/', {})
  const wrapper = await open()
  await clickText(wrapper, 'Not yet linked')
  await searchAndSelect(wrapper)
  expect(requests('/api/teamleader/tl-product-create/')).toHaveLength(0)
  expect(toastCreate).toHaveBeenCalled()
  expect(wrapper.getComponent(TeamleaderProductChooser).get('#products-table').text()).toContain('Linked Cable')
})
