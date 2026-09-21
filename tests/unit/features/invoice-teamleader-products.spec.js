import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { defineComponent } from 'vue'
import { HttpResponse } from 'msw'
import { configuredHourlyRate, productLinkBody, useTeamleaderProducts } from '@/features/invoice'
import { ManagePricesPanel } from '@/features/invoice'
import { vMaterial, vPaginatedTaxRateList, vProduct, vProductList, vTaxRate } from '@/api/valibot.gen'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountForm, toastCreate, toasts } from '../support/form-harness.js'

vi.mock('bootstrap-vue-next', async original => ({ ...(await original()), useToast: () => ({ create: toastCreate }) }))
const api = installApiSeam()
const wrappers = []
afterEach(() => { wrappers.splice(0).forEach(wrapper => wrapper.unmount()); vi.restoreAllMocks() })

const taxId = '00000000-0000-4000-8000-000000000021'
const productId = '00000000-0000-4000-8000-000000000022'
const material = (overrides = {}) => fixtureFor(vMaterial, {
  id: 11, name: 'Cable', identifier: 'CBL-1', price_purchase: '5.00', price_selling: '10.00', ...overrides,
})
const taxRates = [fixtureFor(vTaxRate, { uuid: taxId, rate: '0.21', description: 'VAT' })]
const detail = (overrides = {}) => ({
  id: productId, name: 'Linked Cable', tax: { id: taxId },
  purchase_price: { amount: '6.00', currency: 'EUR' }, selling_price: { amount: 12, currency: 'EUR' },
  ...overrides,
})

test('productLinkBody maps the product detail onto the link request', () => {
  expect(productLinkBody({ materialId: 11, productId, detail: detail(), taxRates, currency: 'EUR' }))
    .toEqual({ material: 11, uuid: productId, purchase_price: '6.00', selling_price: '12', tax_percentage: '0.21' })
})
test.each([
  ['a missing tax', { tax: undefined }, 'Missing product tax'],
  ['a tax no rate is known for', { tax: { id: 'other' } }, 'Unknown product tax'],
  ['a missing price', { selling_price: undefined }, 'Missing product price'],
  ['a price in another currency', { purchase_price: { amount: '6.00', currency: 'USD' } }, 'Product currency does not match invoice currency'],
  ['a non-numeric price', { selling_price: { amount: 'twelve', currency: 'EUR' } }, 'Invalid product price'],
])('productLinkBody fails closed on %s', (_, overrides, message) => {
  expect(() => productLinkBody({ materialId: 11, productId, detail: detail(overrides), taxRates, currency: 'EUR' }))
    .toThrow(new Error(message))
})
test.each([
  ['70.00', { selling_price: '70.00' }],
  [35, { selling_price: '35' }],
  [' 12.5 ', { selling_price: '12.5' }],
  ['', null],
  ['   ', null],
  ['invalid', null],
  [undefined, null],
  [null, null],
  [{ amount: '1' }, null],
])('configuredHourlyRate(%j) -> %j', (value, expected) => {
  expect(configuredHourlyRate(value)).toEqual(expected)
})

// The handle the composable drives on the chooser it is handed: the order of
// the calls that open it, and that it is hidden only once a link has landed.
const main = {
  getDefaultCurrency: 'EUR', getModules: ['company'], getModuleParts: { company: ['teamleader'] },
}
function fakeChooser() {
  const calls = []
  return {
    calls,
    show: vi.fn(async () => { calls.push('show') }),
    hide: vi.fn(() => { calls.push('hide') }),
    showSearchMode: vi.fn(() => { calls.push('showSearchMode') }),
  }
}
const Host = defineComponent({
  props: ['chooser', 'materials'],
  setup(props) {
    return useTeamleaderProducts({ materials: () => props.materials, currency: 'EUR', chooser: () => props.chooser })
  },
  template: '<div>{{ tlProducts?.length }}</div>',
})
async function host({ chooser = fakeChooser(), materials = [material()] } = {}) {
  const wrapper = mountForm(Host, { main, props: { chooser, materials } })
  wrappers.push(wrapper)
  await settle()
  return { wrapper, chooser }
}
beforeEach(() => {
  api.get('/api/teamleader/config/', { has_tokens: true, json_data: {} })
  api.get('/api/teamleader/tl-product-list/', [])
  api.get('/api/teamleader/product-detail/', detail())
  api.get('/api/teamleader/tax-rate/', fixtureFor(vPaginatedTaxRateList, { count: 1, results: taxRates, next: null, previous: null }))
  api.post('/api/teamleader/tl-product-create/', ({ body }) => fixtureFor(vProduct, { ...body, id: 5 }))
})
const linkPosts = () => api.requests().filter(request => request.method === 'post' && request.path === '/api/teamleader/tl-product-create/')
const listGets = () => api.requests().filter(request => request.method === 'get' && request.path === '/api/teamleader/tl-product-list/')

test('openProductChooser keys the chooser on the material, then puts it in search mode before showing it', async () => {
  const { wrapper, chooser } = await host()
  const opening = wrapper.vm.openProductChooser(material())
  // The chooser mounts on the tick after the material is set; nothing is called before that.
  expect(chooser.calls).toEqual([])
  await opening
  expect(wrapper.vm.chosenMaterial).toMatchObject({ id: 11 })
  expect(chooser.calls).toEqual(['showSearchMode', 'show'])
})
test('productChosen links, refetches the products and only then hides the chooser', async () => {
  const { wrapper, chooser } = await host()
  await wrapper.vm.openProductChooser(material())
  await wrapper.vm.productChosen({ id: productId })
  await settle()
  expect(linkPosts()).toHaveLength(1)
  expect(linkPosts()[0].body).toEqual({ material: 11, uuid: productId, purchase_price: '6.00', selling_price: '12', tax_percentage: '0.21' })
  expect(listGets()).toHaveLength(2)
  expect(chooser.calls).toEqual(['showSearchMode', 'show', 'hide'])
  expect(wrapper.vm.linkingProduct).toBe(false)
})
test('a failed link leaves the chooser open and reports it', async () => {
  api.post('/api/teamleader/tl-product-create/', () => HttpResponse.json({ detail: 'retry' }, { status: 500 }))
  const { wrapper, chooser } = await host()
  await wrapper.vm.openProductChooser(material())
  await wrapper.vm.productChosen({ id: productId })
  await settle()
  expect(chooser.hide).not.toHaveBeenCalled()
  expect(toasts().map(toast => toast.body)).toContain('Error linking Teamleader product')
  expect(wrapper.vm.linkingProduct).toBe(false)
})
test('productChosen without an open chooser is a no-op', async () => {
  const { wrapper, chooser } = await host()
  await wrapper.vm.productChosen({ id: productId })
  await settle()
  expect(linkPosts()).toHaveLength(0)
  expect(chooser.calls).toEqual([])
})
test('productCreatedLinked only refreshes the list and hides the chooser', async () => {
  const { wrapper, chooser } = await host()
  await wrapper.vm.productCreatedLinked()
  await settle()
  expect(linkPosts()).toHaveLength(0)
  expect(listGets()).toHaveLength(2)
  expect(chooser.calls).toEqual(['hide'])
})
test('off a Teamleader tenant nothing is requested and the products are null', async () => {
  const wrapper = mountForm(Host, { main: { ...main, getModuleParts: { company: [] } }, props: { chooser: fakeChooser(), materials: [material()] } })
  wrappers.push(wrapper)
  await settle()
  expect(api.requests()).toHaveLength(0)
  expect(wrapper.vm.tlProducts).toBeNull()
  expect(wrapper.vm.hasTeamleader).toBe(false)
})

// The panel's side of the seam: which button it shows and what it hands up.
const panelProps = (overrides = {}) => ({
  materials: [material()],
  currency: 'EUR',
  ...overrides,
})
async function panel(overrides) {
  const wrapper = mountForm(ManagePricesPanel, { deep: true, main, props: panelProps(overrides) })
  wrappers.push(wrapper)
  await settle()
  return wrapper
}
const buttons = (wrapper, text) => wrapper.findAll('button').filter(button => button.text().trim() === text)

test('with Teamleader products the material row emits the material to link instead of updating', async () => {
  const wrapper = await panel({ teamleaderProducts: [] })
  expect(buttons(wrapper, 'Update')).toHaveLength(0)
  await buttons(wrapper, 'Not yet linked')[0].trigger('click')
  expect(wrapper.emitted('linkMaterial')).toEqual([[expect.objectContaining({ id: 11 })]])
})
test('a linked material shows View and the link buttons are disabled while linking', async () => {
  const linked = fixtureFor(vProductList, { id: 5, material: material(), uuid: productId, purchase_price: '6.00', selling_price: '12.00' })
  const wrapper = await panel({ teamleaderProducts: [linked], linkingProduct: true })
  const view = buttons(wrapper, 'View')
  expect(view).toHaveLength(1)
  expect(view[0].attributes('disabled')).toBeDefined()
})
test('without Teamleader each material row has its Update button', async () => {
  const wrapper = await panel()
  expect(buttons(wrapper, 'Update')).toHaveLength(1)
  expect(buttons(wrapper, 'Not yet linked')).toHaveLength(0)
})
test('a material Update with nothing queued sends nothing', async () => {
  const wrapper = await panel()
  await buttons(wrapper, 'Update')[0].trigger('click')
  await settle()
  expect(api.requests().filter(request => request.method === 'patch')).toHaveLength(0)
})
test('a material Update patches the edited material price', async () => {
  api.patch('/api/inventory/material/{id}/', ({ body }) => material(body))
  const wrapper = await panel()
  const materialsTable = wrapper.findAll('.container-fluid').at(0)
  await materialsTable.findAll('.input-number').at(0).setValue('7')
  await settle()
  await buttons(materialsTable, 'Update')[0].trigger('click')
  await settle()
  const patches = api.requests().filter(request => request.method === 'patch')
  expect(patches).toHaveLength(1)
  expect(patches[0]).toMatchObject({ path: '/api/inventory/material/11/', body: { price_purchase: '7.00' } })
  expect(patches[0].body).not.toHaveProperty('price_selling')
})
