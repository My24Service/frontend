import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { useCostCollection } from '@/features/invoice/form/use-cost-collection'
import { provideCostPanelContext } from '@/features/invoice/form/cost-panel-context'
import HoursPanel from '@/features/invoice/form/panels/HoursPanel.vue'
import DistancePanel from '@/features/invoice/form/panels/DistancePanel.vue'
import CallOutCostsPanel from '@/features/invoice/form/panels/CallOutCostsPanel.vue'
import MaterialsPanel from '@/features/invoice/form/panels/MaterialsPanel.vue'
import { vActivityUserTotal, vInvoiceActivityTotals, vMaterial, vAssignedOrderMaterialTotals, vCustomer, vEngineer, vOrderCost, vPaginatedOrderCostList } from '@/api/valibot.gen'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../support/api-seam/index.js'
import { mountForm, toastCreate, toasts } from '../support/form-harness.js'

vi.mock('bootstrap-vue-next', async (original) => ({...(await original()), useToast: () => ({create: toastCreate})}))
const api = installApiSeam()
const base = '/api/order/cost/'
const detail = '/api/order/cost/{id}/'
const wrappers = []
const storedCost = (overrides = {}) => fixtureFor(vOrderCost, {
  id: 71, order: 42, cost_type: 'work_hours', user: 7, user_full_name: 'Alex Engineer',
  amount_duration: '02:00:00', amount_duration_read: '2:00', amount_duration_secs: 7200,
  use_price: 'settings', price: '50.00', price_currency: 'EUR', vat_type: '21.00',
  total: '100.00', total_currency: 'EUR', vat: '21.00', vat_currency: 'EUR', ...overrides,
})
const list = results => fixtureFor(vPaginatedOrderCostList, {count: results.length, next: null, previous: null, results})
const main = {
  getDefaultCurrency: 'EUR', getInvoiceDefaultVat: '21', getInvoiceDefaultHourlyRate: '50.00',
  getInvoiceDefaultPartnerHourlyRate: '45.00', getInvoiceDefaultPricePerKm: '0.50',
  getInvoiceDefaultCallOutCosts: '25.00',
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
    engineers: ref([fixtureFor(vEngineer, {id: 7, full_name: 'Alex Engineer', engineer: {hourly_rate: '60.00', hourly_rate_currency: 'EUR'}})]),
    customer: ref(fixtureFor(vCustomer, {id: 9, name: 'Customer Ltd', hourly_rate_engineer: '70.00', price_per_km: '0.80', price_per_km_currency: 'EUR', call_out_costs: '35.00', call_out_costs_currency: 'EUR'})),
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
beforeEach(() => {
  api.get(base, list([]))
  api.post(base, ({body}) => storedCost({...body, id: 71}))
  api.patch(detail, ({body}) => storedCost({...body, id: 71}))
  api.delete(detail, noContent())
})
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
  vi.restoreAllMocks()
})
async function openPanel({panel = 'HoursPanel', props = {}, saved = [], form = context()} = {}) {
  let records = [...saved]
  api.get(base, () => list(records))
  api.delete(detail, ({params}) => {
    records = records.filter(record => record.id !== Number(params.id))
    return noContent()
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
const requests = method => api.requests().filter(request => request.method === method)

test('stored costs GET includes order and cost type and renders the legacy table', async () => {
  const wrapper = await openPanel({saved: [storedCost()]})
  expect(requests('get')).toEqual([{method: 'get', path: base, query: {order: '42', cost_type: 'work_hours'}, body: undefined}])
  expect(wrapper.get('#costs-table').text()).toContain('Alex Engineer')
  expect(wrapper.get('#costs-table').text()).toContain('100.00')
  expect(wrapper.text()).toContain('Remove saved costs')
  expect(wrapper.text()).not.toContain('Save costs')
})
test('draft settings rate saves a generated POST body', async () => {
  const wrapper = await openPanel()
  expect(wrapper.text()).toContain('Settings')
  expect(wrapper.get('input[type="radio"][value="settings"]').element.checked).toBe(true)
  await click(wrapper, 'Save costs')
  expect(requests('post')).toHaveLength(1)
  expect(toasts().map(toast => toast.body)).toContain('Costs saved')
  expect(requests('post')[0]).toMatchObject({path: base, body: {order: 42, cost_type: 'work_hours', use_price: 'settings', price: '50.00', total: '100.00', vat: '21.00'}})
})
test('editing a duration reprices and saves the row without writing back into the user totals', async () => {
  const props = defaults()
  const wrapper = await openPanel({props})
  await wrapper.get('.material_row input[type="text"]').setValue('3:00')
  await settle()
  // The activity totals are the form's bootstrap data, shared by four panels; an edit is this panel's own.
  expect(props.user_totals[0]).toMatchObject({work_total: '02:00:00', work_total_secs: 7200})
  await click(wrapper, 'Save costs')
  expect(requests('post')[0].body).toMatchObject({amount_duration: '3:00:00', total: '150.00', vat: '31.50'})
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
  expect(requests('post')[0].body).toMatchObject({cost_type: 'travel_hours', amount_duration: '1:30:00', total: '75.00'})
})
test('VAT selection recalculates persisted costs', async () => {
  const wrapper = await openPanel()
  await wrapper.get('.material_row select').setValue('9')
  await settle()
  await click(wrapper, 'Save costs')
  expect(requests('post')[0].body).toMatchObject({vat_type: '9', vat: '9.00', total: '100.00'})
})
test('saving a stored composable collection uses PATCH rather than POST', async () => {
  const CollectionParent = defineComponent({
    setup() {
      return useCostCollection({
        context: context(), costType: () => 'work_hours',
        buildRows: () => [], rate: row => ({price: row.price, currency: row.price_currency}),
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
  expect(requests('post')).toHaveLength(0)
  expect(requests('patch')).toHaveLength(1)
  expect(requests('patch')[0]).toMatchObject({path: base + '71/', body: {vat_type: '9', vat: '9.00', total: '100.00'}})
  expect(toasts().map(toast => toast.body)).toContain('Costs saved')
})
test('remove saved costs sends DELETE for each saved id and restores the draft', async () => {
  const form = context()
  const wrapper = await openPanel({saved: [storedCost()], form})
  await click(wrapper, 'Remove saved costs')
  expect(requests('delete')).toHaveLength(1)
  expect(requests('delete')[0].path).toBe(base + '71/')
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
test('material drafts use schema prices and synchronize edited decimal quantities', async () => {
  const material = fixtureFor(vMaterial, {id: 15, name: 'Copper fitting', price_purchase_ex: '4.00', price_purchase_ex_currency: 'EUR', price_selling_ex: '6.00', price_selling_ex_currency: 'EUR'})
  const used = fixtureFor(vAssignedOrderMaterialTotals, {id: 15, name: 'Copper fitting', identifier: 'COPPER', amount: 2})
  const wrapper = await openPanel({panel: 'MaterialsPanel', props: {material_models: [material], used_materials: [used]}})
  expect(wrapper.text()).toContain('Copper fitting')
  expect(wrapper.get('input[type="radio"][value="selling"]').element.checked).toBe(true)
  await wrapper.get('.material_row input[type="number"]').setValue('2.5')
  expect(used.amount).toBe(2.5)
  await click(wrapper, 'Save costs')
  expect(requests('post')[0].body).toMatchObject({cost_type: 'used_materials', material: 15, amount_decimal: '2.5', price: '6.00', total: '15.00', vat: '3.15'})
  expect(toasts().map(toast => toast.body)).toContain('Costs saved')
})
test('call-out quantity edits serialize an integer after blur recalculation', async () => {
  const wrapper = await openPanel({panel: 'CallOutCostsPanel'})
  const input = wrapper.get('input:not([type="radio"])')
  await input.setValue('3')
  await input.trigger('blur')
  await click(wrapper, 'Save costs')
  expect(requests('post')[0].body).toMatchObject({cost_type: 'call_out_costs', amount_int: 3, total: '75.00', vat: '15.75'})
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
  ['DistancePanel', 'distance', '0.50', '10.00', 20],
  ['CallOutCostsPanel', 'call_out_costs', '25.00', '25.00', 1],
])('%s saves the settings rate and scalar amount', async (panel, costType, price, total, amount) => {
  const wrapper = await openPanel({panel})
  await click(wrapper, 'Save costs')
  expect(requests('get')[0]).toMatchObject({path: base, query: {order: '42', cost_type: costType}})
  expect(requests('post')).toHaveLength(1)
  expect(requests('post')[0].body).toMatchObject({cost_type: costType, use_price: 'settings', amount_int: amount, price, total})
})
test.each([
  ['DistancePanel', 'distance', '0.80', '16.00'],
  ['CallOutCostsPanel', 'call_out_costs', '35.00', '35.00'],
])('%s uses the selected customer rate', async (panel, costType, price, total) => {
  const wrapper = await openPanel({panel})
  await selectRate(wrapper, 'customer')
  await click(wrapper, 'Save costs')
  expect(requests('post')[0].body).toMatchObject({cost_type: costType, use_price: 'customer', price, total})
})
test.each([['settings', '50.00', '100.00'], ['customer', '70.00', '140.00']])('partner name remains visible and saves the %s rate without an engineer rate', async (rate, price, total) => {
  const props = defaults()
  props.user_totals[0] = {...props.user_totals[0], user_id: 99, is_partner: true, full_name: 'Pat Partner', partner_companycode: 'partner-co'}
  const wrapper = await openPanel({props, form: context({engineers: ref([])})})
  expect(wrapper.text()).toContain('Pat Partner (partner-co)')
  expect(wrapper.find('input[type="radio"][value="user"]').exists()).toBe(false)
  expect(wrapper.get('input[type="radio"][value="settings"]').element.checked).toBe(true)
  await selectRate(wrapper, rate)
  await click(wrapper, 'Save costs')
  expect(requests('post')[0].body).toMatchObject({user: null, use_price: rate, price, total})
})
