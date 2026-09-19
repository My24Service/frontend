import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'
import { defineComponent, ref } from 'vue'
import { useCostCollection } from '@/features/invoice/form/use-cost-collection'
import { provideCostPanelContext } from '@/features/invoice/form/cost-panel-context'
import HoursPanel from '@/features/invoice/form/panels/HoursPanel.vue'
import DistancePanel from '@/features/invoice/form/panels/DistancePanel.vue'
import CallOutCostsPanel from '@/features/invoice/form/panels/CallOutCostsPanel.vue'
import MaterialsPanel from '@/features/invoice/form/panels/MaterialsPanel.vue'
import { vActivityUserTotal, vInvoiceActivityTotals, vMaterial, vAssignedOrderMaterialTotals, vEngineer, vOrderCost, vPaginatedOrderCostList } from '@/api/valibot.gen'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../support/api-seam/index.js'
import { mountForm, toastCreate, toasts } from '../support/form-harness.js'

vi.mock('bootstrap-vue-next', async (original) => ({...(await original()), useToast: () => ({create: toastCreate})}))
const api = installApiSeam()
const base = '/api/order/cost/'
const bulk = '/api/order/cost/order/{order_id}/{cost_type}/'
const bulkPath = (orderId, costType) => `/api/order/cost/order/${orderId}/${costType}/`
const storedCost = (overrides = {}) => fixtureFor(vOrderCost, {
  id: 71, order: 42, cost_type: 'work_hours', user: 7, user_full_name: 'Alex Engineer',
  amount_duration: '02:00:00', amount_duration_read: '2:00', amount_duration_secs: 7200,
  price: '50.00', price_currency: 'EUR', vat_type: '21.00',
  total: '100.00', total_currency: 'EUR', vat: '21.00', vat_currency: 'EUR', ...overrides,
})
const list = results => fixtureFor(vPaginatedOrderCostList, {count: results.length, next: null, previous: null, results})
/**
 * The server prices the set: new rows come back with stored ids and the
 * server's own totals, which the panel adopts. Totals here are canned
 * response data, never computed from the request.
 */
const priced = (total, vat) => ({body}) => body.map((row, index) => storedCost({...row, id: row.id ?? 100 + index, total, vat}))
const main = {
  getDefaultCurrency: 'EUR', getInvoiceDefaultVat: '21', getInvoiceDefaultHourlyRate: '50.00',
  getInvoiceDefaultPricePerKm: '0.50', getInvoiceDefaultCallOutCosts: '25.00',
  getVATTypes: [{value: '21', text: '21%'}, {value: '9', text: '9%'}],
}
function defaults() {
  return {
    type: 'work_hours', hours_total: '2:00',
    distance_total: 20, invoice_default_price_per_km: '0.50', invoice_default_call_out_costs: '25.00',
    user_totals: fixtureFor(vInvoiceActivityTotals, {user_totals: [fixtureFor(vActivityUserTotal, {user_id: 7, full_name: 'Alex Engineer', work_total: '02:00:00', work_total_secs: 7200, distance_to_total: 12, distance_back_total: 8, distance_total: 20})]}).user_totals,
  }
}
/**
 * What the form provides every cost panel. The two callbacks are spies so a
 * spec can see what a panel handed back the way the form would.
 */
function context(overrides = {}) {
  return {
    orderPk: ref(42),
    engineers: ref([fixtureFor(vEngineer, {id: 7, full_name: 'Alex Engineer'})]),
    invoiceLines: ref([]),
    invoiceLinesCreated: vi.fn(),
    emptyCollectionClicked: vi.fn(),
    ...overrides,
  }
}
const Parent = defineComponent({
  components: {HoursPanel, DistancePanel, CallOutCostsPanel, MaterialsPanel},
  props: ['panel', 'panelProps', 'context'],
  setup(props) {
    provideCostPanelContext(props.context)
  },
  template: `<component :is="panel" ref="panel" v-bind="panelProps" />`,
})
const wrappers = []
beforeEach(() => {
  api.get(base, list([]))
  api.post(bulk, priced('100.00', '21.00'))
})
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
  vi.restoreAllMocks()
})
async function openPanel({panel = 'HoursPanel', props = {}, saved = [], form = context()} = {}) {
  let records = [...saved]
  api.get(base, () => list(records))
  // The mock server keeps the set: a bulk write replaces what the list serves.
  api.post(bulk, ({body}) => {
    records = body.map((row, index) => storedCost({...row, id: row.id ?? 100 + index}))
    return records
  })
  const wrapper = mountForm(Parent, {deep: true, main, props: {panel, panelProps: {...defaults(), ...props}, context: form}})
  wrappers.push(wrapper)
  await settle()
  return wrapper
}
async function click(wrapper, text) {
  const button = wrapper.findAll('button').find(button => button.text().trim() === text)
  expect(button, text + ' must be reachable').toBeTruthy()
  await button.trigger('click')
  await settle()
}
async function selectRate(wrapper, value) {
  await wrapper.get('input[type="radio"][value="' + value + '"]').setValue()
  await settle()
}
/** Type a price into a row's PriceInput; `row` is the 0-based row index. */
async function typePrice(wrapper, whole, cents, row = 0) {
  await wrapper.findAll('.input-number')[row].setValue(whole)
  await wrapper.findAll('.input-decimal')[row].setValue(cents)
  await settle()
}
const posts = () => api.requests().filter(request => request.method === 'post' && request.path.startsWith('/api/order/cost/order/'))

test('stored costs GET includes order and cost type and renders the legacy table', async () => {
  const wrapper = await openPanel({saved: [storedCost()]})
  expect(api.requests().filter(request => request.method === 'get')).toEqual([{method: 'get', path: base, query: {order: '42', cost_type: 'work_hours'}, body: undefined}])
  expect(wrapper.get('#costs-table').text()).toContain('Alex Engineer')
  expect(wrapper.get('#costs-table').text()).toContain('100.00')
  expect(wrapper.text()).toContain('Remove saved costs')
  expect(wrapper.text()).not.toContain('Save costs')
})
test('a draft is seeded with the tenant hourly rate and saves one bulk set without totals', async () => {
  const wrapper = await openPanel()
  expect(wrapper.get('.input-number').element.value).toBe('50')
  expect(wrapper.get('.input-decimal').element.value).toBe('00')
  await click(wrapper, 'Save costs')
  expect(posts()).toHaveLength(1)
  expect(toasts().map(toast => toast.body)).toContain('Costs saved')
  expect(posts()[0]).toMatchObject({path: bulkPath(42, 'work_hours')})
  expect(posts()[0].body).toHaveLength(1)
  // The panel sends its inputs; the order and cost type travel in the URL and
  // the totals come back priced, so none of them are in the body.
  expect(posts()[0].body[0]).toMatchObject({user: 7, amount_duration: '7200', price: '50.00', vat_type: '21'})
  expect(posts()[0].body[0]).not.toHaveProperty('id')
  for (const key of ['order', 'cost_type', 'total', 'vat']) {
    expect(posts()[0].body[0]).not.toHaveProperty(key)
  }
})
test('a save adopts the stored ids and server totals', async () => {
  const wrapper = await openPanel()
  api.get(base, list([storedCost({id: 77, total: '100.00', vat: '21.00'})]))
  await click(wrapper, 'Save costs')
  expect(wrapper.get('#costs-table').text()).toContain('100.00')
  expect(wrapper.text()).toContain('Remove saved costs')
})
test('a typed price is carried in the bulk body while totals come back from the server', async () => {
  const wrapper = await openPanel()
  await typePrice(wrapper, '62', '50')
  api.post(bulk, priced('125.00', '26.25'))
  api.get(base, list([storedCost({id: 77, price: '62.50', total: '125.00', vat: '26.25'})]))
  await click(wrapper, 'Save costs')
  expect(posts()[0].body[0]).toMatchObject({price: '62.50'})
  expect(posts()[0].body[0]).not.toHaveProperty('total')
  expect(wrapper.get('#costs-table').text()).toContain('125.00')
})
test('editing a duration saves the row without writing back into the user totals', async () => {
  const props = defaults()
  const wrapper = await openPanel({props})
  await wrapper.get('.material_row input[type="text"]').setValue('3:00')
  await settle()
  // The activity totals are the form's bootstrap data, shared by four panels; an edit is this panel's own.
  expect(props.user_totals[0]).toMatchObject({work_total: '02:00:00', work_total_secs: 7200})
  api.get(base, list([storedCost({amount_duration: '03:00:00', amount_duration_read: '3:00', amount_duration_secs: 10800, total: '150.00', vat: '31.50'})]))
  await click(wrapper, 'Save costs')
  expect(posts()[0].body[0]).toMatchObject({amount_duration: '3:00:00'})
  expect(posts()[0].body[0]).not.toHaveProperty('total')
  expect(wrapper.get('#costs-table').text()).toContain('150.00')
})
test('the edited durations feed the summary amount of a total invoice line', async () => {
  const form = context()
  const wrapper = await openPanel({form})
  await wrapper.get('.material_row input[type="text"]').setValue('3:00')
  await settle()
  api.get(base, list([storedCost({amount_duration: '03:00:00', amount_duration_read: '3:00', amount_duration_secs: 10800, total: '150.00', vat: '31.50'})]))
  await click(wrapper, 'Save costs')
  await selectRate(wrapper, 'total')
  await click(wrapper, 'Create invoice lines')
  expect(form.invoiceLinesCreated.mock.calls[0][0][0]).toMatchObject({type: 'work', amount: '3:00', description: 'Work hours'})
})
test('editing travel hours neither touches the work totals nor the travel totals it was built from', async () => {
  const props = defaults()
  props.user_totals[0].travel_total = '01:00:00'
  props.user_totals[0].travel_total_secs = 3600
  const before = JSON.parse(JSON.stringify(props.user_totals))
  const wrapper = await openPanel({props: {...props, type: 'travel_hours', hours_total: '1:00'}})
  await wrapper.get('.material_row input[type="text"]').setValue('1:30')
  await settle()
  expect(props.user_totals).toEqual(before)
  await click(wrapper, 'Save costs')
  expect(posts()[0]).toMatchObject({path: bulkPath(42, 'travel_hours')})
  expect(posts()[0].body[0]).toMatchObject({amount_duration: '1:30:00'})
  expect(posts()[0].body[0]).not.toHaveProperty('total')
})
test('VAT selection is saved without client totals and the server total is adopted', async () => {
  const wrapper = await openPanel()
  await wrapper.get('.material_row select').setValue('9')
  await settle()
  api.post(bulk, priced('100.00', '9.00'))
  api.get(base, list([storedCost({vat_type: '9', total: '100.00', vat: '9.00'})]))
  await click(wrapper, 'Save costs')
  expect(posts()[0].body[0]).toMatchObject({vat_type: '9'})
  expect(posts()[0].body[0]).not.toHaveProperty('vat')
  expect(wrapper.get('#costs-table').text()).toContain('9.00')
})
test('saving a stored collection sends one bulk set with the stored id', async () => {
  const CollectionParent = defineComponent({
    setup() {
      return useCostCollection({
        context: context(), costType: () => 'work_hours',
        buildRows: () => [],
        description: row => row.user_full_name, title: () => 'Work hours', amount: () => '2:00',
      })
    },
    template: `<div v-if="!isLoading">
      <select id="stored-vat" :value="collection[0].vat_type" @change="changeVatType(collection[0], $event.target.value)">
        <option value="21.00">21%</option><option value="9">9%</option>
      </select>
      <button @click="saveCollection">Save stored costs</button>
    </div>`,
  })
  api.get(base, list([storedCost()]))
  const wrapper = mountForm(CollectionParent, {deep: true, main})
  wrappers.push(wrapper)
  await settle()
  await wrapper.get('#stored-vat').setValue('9')
  await click(wrapper, 'Save stored costs')
  expect(posts()).toHaveLength(1)
  expect(posts()[0]).toMatchObject({path: bulkPath(42, 'work_hours')})
  expect(posts()[0].body).toHaveLength(1)
  expect(posts()[0].body[0]).toMatchObject({id: 71, vat_type: '9'})
  expect(posts()[0].body[0]).not.toHaveProperty('total')
  expect(toasts().map(toast => toast.body)).toContain('Costs saved')
})
test('a failed bulk save keeps the drafts and toasts an error', async () => {
  const wrapper = await openPanel()
  api.post(bulk, () => HttpResponse.json({detail: 'boom'}, {status: 500}))
  await click(wrapper, 'Save costs')
  expect(toasts().map(toast => toast.body)).toContain('Error saving costs')
  expect(wrapper.text()).toContain('Save costs')
})
test('remove saved costs sends one empty set and restores the draft', async () => {
  const form = context()
  const wrapper = await openPanel({saved: [storedCost()], form})
  await click(wrapper, 'Remove saved costs')
  expect(posts()).toHaveLength(1)
  expect(posts()[0]).toMatchObject({path: bulkPath(42, 'work_hours'), body: []})
  expect(wrapper.text()).toContain('Save costs')
  expect(form.emptyCollectionClicked.mock.calls).toEqual([['work']])
})
test.each(['user_totals', 'total'])('invoice emissions preserve %s amounts and totals', async option => {
  const form = context()
  const wrapper = await openPanel({saved: [storedCost()], form})
  await selectRate(wrapper, option)
  await click(wrapper, 'Create invoice lines')
  const emitted = form.invoiceLinesCreated.mock.calls
  expect(emitted).toHaveLength(1)
  const lines = emitted[0][0]
  expect(lines).toHaveLength(1)
  expect(lines[0]).toMatchObject({type: 'work', amount: '2:00', total: '100.00', vat: '21.00'})
  expect(lines[0].description).toBe(option === 'total' ? 'Work hours' : 'Work hours: Alex Engineer')
})
test('material drafts use schema prices and keep edited decimal quantities off the source rows', async () => {
  const material = fixtureFor(vMaterial, {id: 15, name: 'Copper fitting', price_purchase_ex: '4.00', price_purchase_ex_currency: 'EUR', price_selling_ex: '6.00', price_selling_ex_currency: 'EUR'})
  const used = fixtureFor(vAssignedOrderMaterialTotals, {id: 15, name: 'Copper fitting', identifier: 'COPPER', amount: 2})
  const wrapper = await openPanel({panel: 'MaterialsPanel', props: {material_models: [material], used_materials: [used]}})
  expect(wrapper.text()).toContain('Copper fitting')
  // Seeded with the selling price, not the purchase price.
  expect(wrapper.get('.input-number').element.value).toBe('6')
  await wrapper.get('.material_row input[type="number"]').setValue('2.5')
  expect(used.amount).toBe(2)
  await click(wrapper, 'Save costs')
  expect(posts()[0].body[0]).toMatchObject({material: 15, amount_decimal: '2.5', price: '6.00'})
  for (const key of ['cost_type', 'total', 'vat']) {
    expect(posts()[0].body[0]).not.toHaveProperty(key)
  }
  expect(toasts().map(toast => toast.body)).toContain('Costs saved')
})
test('fractional material quantities are summed without truncation and never written back to the source rows', async () => {
  const material = fixtureFor(vMaterial, {id: 15, name: 'Copper fitting', price_purchase_ex: '4.00', price_purchase_ex_currency: 'EUR', price_selling_ex: '6.00', price_selling_ex_currency: 'EUR'})
  const used = fixtureFor(vAssignedOrderMaterialTotals, {id: 15, name: 'Copper fitting', identifier: 'COPPER', amount: 2.5})
  const wrapper = await openPanel({panel: 'MaterialsPanel', props: {material_models: [material], used_materials: [used]}})
  expect(wrapper.get('.total-text').text()).toBe('2.5')
  await wrapper.get('.material_row input[type="number"]').setValue('3.25')
  expect(wrapper.get('.total-text').text()).toBe('3.25')
  expect(used.amount).toBe(2.5)
})
test('call-out quantity edits serialize an integer', async () => {
  const wrapper = await openPanel({panel: 'CallOutCostsPanel'})
  const input = wrapper.get('input:not(.input-number):not(.input-decimal)')
  await input.setValue('3')
  await input.trigger('blur')
  await click(wrapper, 'Save costs')
  expect(posts()[0].body[0]).toMatchObject({amount_int: 3})
  expect(posts()[0].body[0]).not.toHaveProperty('total')
})
test('none option does not emit invoice drafts', async () => {
  const form = context()
  const wrapper = await openPanel({saved: [storedCost()], form})
  await selectRate(wrapper, 'none')
  await click(wrapper, 'Create invoice lines')
  expect(form.invoiceLinesCreated).not.toHaveBeenCalled()
})
test('existing parent invoice lines suppress duplicate creation controls', async () => {
  const wrapper = await openPanel({saved: [storedCost()], form: context({invoiceLines: ref([{type: 'work'}])})})
  expect(wrapper.text()).not.toContain('Create invoice lines')
})
test('a cost panel outside a form refuses to mount', () => {
  expect(() => mountForm(HoursPanel, {main, props: defaults()})).toThrow('provideCostPanelContext')
})
test.each([
  ['DistancePanel', 'distance', '0.50', 20],
  ['CallOutCostsPanel', 'call_out_costs', '25.00', 1],
])('%s saves the settings rate and scalar amount', async (panel, costType, price, amount) => {
  const wrapper = await openPanel({panel})
  await click(wrapper, 'Save costs')
  expect(api.requests().filter(request => request.method === 'get')[0]).toMatchObject({path: base, query: {order: '42', cost_type: costType}})
  expect(posts()).toHaveLength(1)
  expect(posts()[0]).toMatchObject({path: bulkPath(42, costType)})
  expect(posts()[0].body[0]).toMatchObject({amount_int: amount, price})
  expect(posts()[0].body[0]).not.toHaveProperty('total')
})
test.each([
  ['DistancePanel', 'distance', '0', '80', '0.80'],
  ['CallOutCostsPanel', 'call_out_costs', '35', '00', '35.00'],
])('%s saves a typed price', async (panel, costType, whole, cents, price) => {
  const wrapper = await openPanel({panel})
  await typePrice(wrapper, whole, cents)
  await click(wrapper, 'Save costs')
  expect(posts()[0].body[0]).toMatchObject({price})
  expect(posts()[0].body[0]).not.toHaveProperty('total')
})
test('partner name remains visible and the row is seeded with the tenant rate without an engineer record', async () => {
  const props = defaults()
  props.user_totals[0] = {...props.user_totals[0], user_id: 99, is_partner: true, full_name: 'Pat Partner', partner_companycode: 'partner-co'}
  const wrapper = await openPanel({props, form: context({engineers: ref([])})})
  expect(wrapper.text()).toContain('Pat Partner (partner-co)')
  await click(wrapper, 'Save costs')
  expect(posts()[0].body[0]).toMatchObject({user: null, price: '50.00'})
  expect(posts()[0].body[0]).not.toHaveProperty('total')
})
