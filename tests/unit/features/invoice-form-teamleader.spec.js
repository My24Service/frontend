import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import InvoiceForm from '@/features/invoice/form/InvoiceForm.vue'
import HoursPanel from '@/features/invoice/form/panels/HoursPanel.vue'
import MaterialsPanel from '@/features/invoice/form/panels/MaterialsPanel.vue'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountForm, toastCreate } from '../support/form-harness.js'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { vConfig, vInvoiceDataResponse, vProductList, vCustomer, vMaterial, vAssignedOrderMaterialTotals, vActivityUserTotal, vEngineer, vOrderCost, vPaginatedOrderCostList } from '@/api/valibot.gen'

vi.mock('bootstrap-vue-next', async original => ({ ...(await original()), useToast: () => ({ create: toastCreate }) }))
const api = installApiSeam()
const orderUuid = '00000000-0000-4000-8000-00000000000a'
const main = {
  getDefaultCurrency: 'EUR', getInvoiceDefaultVat: '21', getInvoiceDefaultTermOfPaymentDays: 14,
  getInvoiceDefaultHourlyRate: '50.00', getInvoiceDefaultPartnerHourlyRate: '45.00',
  getVATTypes: [{ value: '21', text: '21%' }],
  getModules: ['company'], getModuleParts: { company: ['teamleader'] },
}
const material = () => fixtureFor(vMaterial, {
  id: 11, name: 'Cable', identifier: 'CBL-1', price_purchase_ex: '5.00', price_selling_ex: '10.00',
  price_purchase_ex_currency: 'EUR', price_selling_ex_currency: 'EUR',
})
const bootstrap = () => fixtureFor(vInvoiceDataResponse, {
  order_pk: 42, customer_pk: 7, invoice_id: 3001, order_id: 'O-42', order_reference: 'ref-42',
  invoice_default_call_out_costs: '2.50', invoice_default_partner_hourly_rate: null, invoice_default_price_per_km: '0.40',
  used_materials: [fixtureFor(vAssignedOrderMaterialTotals, { id: 11, name: 'Cable', identifier: 'CBL-1', amount: 2 })],
  material_models: [material()],
  engineer_models: [fixtureFor(vEngineer, { id: 7, full_name: 'Alex Engineer', engineer: { hourly_rate: '60.00', hourly_rate_currency: 'EUR' } })],
  activity_totals: {
    work_total: '01:00', travel_total: '01:00', extra_work_total: '00:00', actual_work_total: '00:00', distance_total: 0,
    user_totals: [fixtureFor(vActivityUserTotal, { user_id: 7, full_name: 'Alex Engineer', work_total: '01:00:00', work_total_secs: 3600, travel_total: '01:00:00', travel_total_secs: 3600 })],
  },
})
const config = (json_data = { workhours_product_selling_price: '70.00', travel_hours_product_selling_price: 35 }) => fixtureFor(vConfig, { has_tokens: true, json_data })
const routes = [{ name: 'invoice-list', path: '/invoices', component: { template: '<div />' } }]
const wrappers = []
beforeEach(() => {
  api.get('/api/invoice/invoice/data/{id}/', bootstrap())
  api.get('/api/customer/customer/{id}/', fixtureFor(vCustomer, { id: 7, name: 'Test customer' }))
  api.get('/api/order/cost/', fixtureFor(vPaginatedOrderCostList, { count: 0, results: [], next: null, previous: null }))
  api.post('/api/order/cost/', ({ body }) => fixtureFor(vOrderCost, { ...body, id: 71 }))
  api.get('/api/teamleader/config/', config())
  api.get('/api/teamleader/tl-product-list/', [fixtureFor(vProductList, { id: 5, material: material(), uuid: '00000000-0000-4000-8000-000000000011', purchase_price: '5.00', selling_price: '9.00' })])
})
afterEach(() => { wrappers.splice(0).forEach(wrapper => wrapper.unmount()); vi.restoreAllMocks() })
const requests = path => api.requests().filter(request => request.path === path)
async function open({ teamleader = true, superuser = false } = {}) {
  const wrapper = mountForm(InvoiceForm, {
    deep: true, routes, props: { uuid: orderUuid },
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
const costPosts = () => api.requests().filter(request => request.method === 'post' && request.path === '/api/order/cost/')

test('Teamleader prices reach rendered hour and material controls and persisted costs', async () => {
  const wrapper = await open()
  expect(requests('/api/teamleader/config/')).toHaveLength(1)
  expect(requests('/api/teamleader/tl-product-list/')[0].query).toEqual({ ids: '11' })
  const hours = wrapper.findAllComponents(HoursPanel)
  expect(hours).toHaveLength(2)
  for (const panel of hours) {
    expect(panel.text()).toContain('Teamleader')
    expect(panel.find('input[type="radio"][value="settings"]').exists()).toBe(false)
    await saveCosts(panel)
  }
  const materials = wrapper.getComponent(MaterialsPanel)
  expect(materials.text()).toContain('Cable')
  expect(materials.find('input[type="radio"][value="selling"]').exists()).toBe(false)
  await saveCosts(materials)
  expect(costPosts().map(request => request.body)).toEqual([
    expect.objectContaining({ order: 42, cost_type: 'work_hours', price: '70.00', total: '70.00' }),
    expect.objectContaining({ order: 42, cost_type: 'travel_hours', price: '35.00', total: '35.00' }),
    expect.objectContaining({ order: 42, cost_type: 'used_materials', material: 11, price: '9.00', total: '18.00' }),
  ])
})
test('non-Teamleader tenant retains ordinary pricing controls and makes no integration requests', async () => {
  const wrapper = await open({ teamleader: false })
  expect(requests('/api/teamleader/config/')).toHaveLength(0)
  expect(requests('/api/teamleader/tl-product-list/')).toHaveLength(0)
  const hours = wrapper.findAllComponents(HoursPanel)[0]
  expect(hours.get('input[type="radio"][value="settings"]').element.checked).toBe(true)
  await saveCosts(hours)
  const materials = wrapper.getComponent(MaterialsPanel)
  expect(materials.get('input[type="radio"][value="selling"]').element.checked).toBe(true)
  await saveCosts(materials)
  expect(costPosts().map(request => request.body)).toEqual([
    expect.objectContaining({ order: 42, cost_type: 'work_hours', price: '50.00', total: '50.00' }),
    expect.objectContaining({ order: 42, cost_type: 'used_materials', material: 11, price: '10.00', total: '20.00' }),
  ])
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
    expect(panel.get('input[type="radio"][value="settings"]').element.checked).toBe(true)
    await saveCosts(panel)
  }
  expect(costPosts().map(request => request.body.price)).toEqual(['50.00', '50.00'])
})
