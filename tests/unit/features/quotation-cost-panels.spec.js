import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'
import { defineComponent, ref } from 'vue'
import { provideCostPanelContext } from '@/features/costing'
import {
  CallOutCostsPanel,
  DistancePanel,
  HoursPanel,
  MaterialsPanel,
  QuotationCostPanel,
} from '@/features/quotation/form/panels'
import { vMaterial, vQuotationCost } from '@/api/valibot.gen'
import { fixtureFor, paginated } from '../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountForm, toastCreate, toasts } from '../support/form-harness.js'

vi.mock('bootstrap-vue-next', async (original) => ({...(await original()), useToast: () => ({create: toastCreate})}))

// The quotation cost panels: a chapter's hours, distance, call-out costs and
// materials. Carries over the legacy call-shape pins
// (quotation-replace-set-call-shape.spec.js,
// quotation-materials-create-call-shape.spec.js): ONE chapter-scoped
// replace-set per save, a bare array of rows that carry chapter, vat, total and
// the currency companions but never quotation or cost_type, and the answer
// adopted as it is, with no re-read of the list.

const api = installApiSeam()
const costBase = '/api/quotation/cost/'
const costBulk = '/api/quotation/cost/quotation/{quotation_id}/{cost_type}/'
const bulkPath = (costType) => `/api/quotation/cost/quotation/42/${costType}/`
const QUOTATION = 42
const CHAPTER = 5
const main = {
  getDefaultCurrency: 'EUR',
  getQuotationDefaultVat: 21,
  getInvoiceDefaultVat: 21,
  getQuotationDefaultHourlyRate: '50.00',
  getQuotationDefaultPricePerKm: '0.50',
  getQuotationDefaultCallOutCosts: '25.00',
  getVATTypes: [{value: 21, text: '21%'}, {value: 9, text: '9%'}],
}
const storedCost = (overrides = {}) => fixtureFor(vQuotationCost, {
  id: 71, quotation: QUOTATION, chapter: CHAPTER, cost_type: 'distance',
  user: null, user_full_name: null, material: null, material_name: null,
  amount_int: 3, amount_decimal: null, amount_duration: null, amount_duration_read: null, amount_duration_secs: null,
  price: '0.50', price_currency: 'EUR', vat_type: '21.00',
  vat: '0.32', vat_currency: 'EUR', total: '1.50', total_currency: 'EUR',
  ...overrides,
})
const MultiselectStub = defineComponent({
  props: ['options'],
  emits: ['select', 'search-change'],
  template: `<div class="multiselect-stub">
    <input class="material-search" @input="$emit('search-change', $event.target.value)" />
    <button v-for="option in options" :key="option.id" type="button" class="pick" @click="$emit('select', option)">{{ option.name }}</button>
  </div>`,
})
function context(overrides = {}) {
  return {
    parentPk: ref(QUOTATION),
    engineers: ref([]),
    lines: ref([]),
    linesCreated: vi.fn(),
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
  template: '<component :is="panel" v-bind="panelProps" />',
})
const wrappers = []
let records
beforeEach(() => {
  records = []
  api.get(costBase, () => paginated(records))
  api.post(costBulk, ({body}) => body.map((row, index) => storedCost({...row, id: row.id ?? 100 + index})))
})
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
})
async function openPanel({panel = 'DistancePanel', props = {}, saved = [], form = context()} = {}) {
  records = saved
  const wrapper = mountForm(Parent, {
    deep: true, main,
    props: {panel, panelProps: {chapterId: CHAPTER, ...props}, context: form},
    stubs: {VueMultiselect: MultiselectStub},
  })
  wrappers.push(wrapper)
  await settle()
  return wrapper
}
const button = (wrapper, text) => wrapper.findAll('button').find((b) => b.text().trim() === text)
async function click(wrapper, text) {
  const target = button(wrapper, text)
  expect(target, text + ' must be reachable').toBeTruthy()
  await target.trigger('click')
  await settle()
}
const writes = () => api.requests().filter((request) => request.method === 'post' && request.path.startsWith('/api/quotation/cost/quotation/'))
const listReads = () => api.requests().filter((request) => request.method === 'get' && request.path === costBase)
const bodies = () => toasts().map((toast) => toast.body)
const rows = (wrapper) => wrapper.findAll('.cost_row')
async function setAmount(wrapper, value, row = 0) {
  const input = rows(wrapper)[row].find('input[type="number"]')
  await input.setValue(value)
  await input.trigger('blur')
  await settle()
}
async function selectRate(wrapper, value) {
  await wrapper.get('input[type="radio"][value="' + value + '"]').setValue()
  await settle()
}

test('a cost panel outside a form refuses to mount', () => {
  const options = {chapterId: () => CHAPTER, costType: 'distance', defaultPrice: () => '0.50', title: () => 'Distance',
    description: () => 'distance', saved: () => '', saveError: () => ''}
  expect(() => mountForm(QuotationCostPanel, {main, props: {options, addLabel: 'Add', priceLabel: 'Price'}})).toThrow('provideCostPanelContext')
})

describe('reading and starting', () => {
  test('reads its chapter\'s costs of its type', async () => {
    await openPanel()
    expect(listReads()).toEqual([{method: 'get', path: costBase, query: {quotation: '42', chapter: '5', cost_type: 'distance'}, body: undefined}])
  })
  test.each([
    ['DistancePanel', 'Distance', 'Add distance'],
    ['CallOutCostsPanel', 'Call-out costs', 'Add call-out cost'],
    ['MaterialsPanel', 'Materials', 'Add material'],
  ])('%s without stored costs starts from one blank row', async (panel, title, addLabel) => {
    const wrapper = await openPanel({panel})
    expect(wrapper.get('summary h6').text()).toBe(title)
    expect(rows(wrapper)).toHaveLength(1)
    // The blank row is empty, so another cannot be added yet, and nothing changed.
    expect(button(wrapper, addLabel).attributes('disabled')).toBeDefined()
    expect(button(wrapper, 'Save changes').attributes('disabled')).toBeDefined()
  })
  test.each([['work_hours', 'Work hours', 'Add work hours'], ['travel_hours', 'Travel hours', 'Add travel hours']])('the %s panel titles itself', async (type, title, addLabel) => {
    const wrapper = await openPanel({panel: 'HoursPanel', props: {type}})
    expect(wrapper.get('summary h6').text()).toBe(title)
    expect(button(wrapper, addLabel)).toBeTruthy()
    expect(listReads()[0].query.cost_type).toBe(type)
  })
  test('a blank row is seeded with the tenant\'s quotation price', async () => {
    const wrapper = await openPanel({panel: 'CallOutCostsPanel'})
    expect(rows(wrapper)[0].find('.input-number').element.value).toBe('25')
    expect(rows(wrapper)[0].find('.input-decimal').element.value).toBe('00')
  })
  test('stored costs are shown editable, with their totals', async () => {
    const wrapper = await openPanel({saved: [storedCost({amount_int: 3}), storedCost({id: 72, amount_int: 7, total: '3.50', vat: '0.74'})]})
    expect(rows(wrapper)).toHaveLength(2)
    expect(rows(wrapper)[1].find('input[type="number"]').element.value).toBe('7')
    expect(wrapper.get('.total-text').text()).toContain('10')
  })
})

describe('editing', () => {
  test('an amount edit prices the row live and enables the save', async () => {
    const wrapper = await openPanel()
    await setAmount(wrapper, '37')
    const readonly = rows(wrapper)[0].findAll('input[disabled]').map((input) => input.element.value)
    expect(readonly).toEqual(['€3.88', '€18.50'])
    expect(button(wrapper, 'Save changes').attributes('disabled')).toBeUndefined()
    expect(button(wrapper, 'Add distance').attributes('disabled')).toBeUndefined()
  })
  test('a new row can be added once none is blank, and deleting the last leaves a blank one', async () => {
    const wrapper = await openPanel()
    await setAmount(wrapper, '5')
    await click(wrapper, 'Add distance')
    expect(rows(wrapper)).toHaveLength(2)
    await click(wrapper, 'Delete cost')
    await click(wrapper, 'Delete cost')
    expect(rows(wrapper)).toHaveLength(1)
    expect(rows(wrapper)[0].find('input[type="number"]').element.value).toBe('0')
  })
  test('hours: a typed duration prices the row by the hour', async () => {
    const wrapper = await openPanel({panel: 'HoursPanel', props: {type: 'work_hours'}})
    const [hours, minutes] = [rows(wrapper)[0].findAll('.input-number')[0], rows(wrapper)[0].findAll('.input-decimal')[0]]
    await hours.setValue('1')
    await minutes.setValue('30')
    await minutes.trigger('blur')
    await settle()
    expect(rows(wrapper)[0].findAll('input[disabled]').map((input) => input.element.value)).toEqual(['€15.75', '€75.00'])
    expect(wrapper.get('.total-text').text()).toContain('2')
  })
})

describe('saving', () => {
  test('a save is ONE chapter-scoped replace-set; a dropped stored row is simply absent', async () => {
    const wrapper = await openPanel({saved: [storedCost({id: 71, amount_int: 3}), storedCost({id: 72, amount_int: 7})]})
    await wrapper.findAll('button').filter((b) => b.text() === 'Delete cost')[1].trigger('click')
    await settle()
    await click(wrapper, 'Save changes')
    expect(writes()).toHaveLength(1)
    const [request] = writes()
    expect(request.path).toBe(bulkPath('distance'))
    // Scoped to the chapter: "absent from the list" means delete, so an
    // unscoped save would delete other chapters' rows of this type.
    expect(request.query).toEqual({chapter: String(CHAPTER)})
    expect(request.body).toHaveLength(1)
    expect(request.body[0]).toMatchObject({
      id: 71, amount_int: 3, chapter: CHAPTER, vat_type: '21.00', price: '0.50', total: '1.50', vat: '0.32',
      price_currency: 'EUR', vat_currency: 'EUR', total_currency: 'EUR',
    })
    for (const key of ['quotation', 'cost_type', 'amount_duration_read', 'amount_duration_secs']) {
      expect(request.body[0]).not.toHaveProperty(key)
    }
    expect(api.requests().filter((r) => ['delete', 'patch'].includes(r.method))).toEqual([])
    expect(bodies()).toContain('Distance costs updated')
  })
  test.each([
    ['DistancePanel', {}, 'distance', {}],
    ['CallOutCostsPanel', {}, 'call_out_costs', {}],
    ['HoursPanel', {type: 'work_hours'}, 'work_hours', {amount_int: null, amount_duration: '02:00:00', amount_duration_read: '2:00', amount_duration_secs: 7200}],
    ['MaterialsPanel', {}, 'used_materials', {amount_int: null, material: 15, material_name: 'Bolt', amount_decimal: '2.00'}],
  ])('%s adopts the saved set from the answer, without re-reading the list', async (panel, props, costType, row) => {
    const wrapper = await openPanel({panel, props, saved: [storedCost({id: 71, cost_type: costType, ...row})]})
    expect(listReads()).toHaveLength(1)
    api.post(costBulk, ({body}) => body.map((stored) => storedCost({...stored, cost_type: costType, ...row, id: 99})))
    // Something to save; the materials amount input reports on change, the others on blur.
    const input = rows(wrapper)[0].find('.cost-amount input')
    await input.trigger('change')
    await input.trigger('blur')
    await settle()
    expect(button(wrapper, 'Save changes').attributes('disabled')).toBeUndefined()
    await click(wrapper, 'Save changes')
    expect(writes()).toHaveLength(1)
    expect(listReads()).toHaveLength(1)
    expect(button(wrapper, 'Save changes').attributes('disabled')).toBeDefined()
  })
  test('the hours row carries its duration string', async () => {
    const wrapper = await openPanel({panel: 'HoursPanel', props: {type: 'work_hours'}, saved: [
      storedCost({id: 71, cost_type: 'work_hours', amount_int: null, amount_duration: '02:00:00', amount_duration_read: '2:00', amount_duration_secs: 7200, price: '50.00', total: '100.00', vat: '21.00'}),
    ]})
    const minutes = rows(wrapper)[0].findAll('.input-decimal')[0]
    const hours = rows(wrapper)[0].findAll('.input-number')[0]
    await hours.setValue('3')
    await minutes.trigger('blur')
    await settle()
    await click(wrapper, 'Save changes')
    expect(writes()[0].body[0]).toMatchObject({id: 71, amount_duration: '3:00', chapter: CHAPTER, total: '150.00', vat: '31.50'})
    expect(bodies()).toContain('Hours costs have been updated')
  })
  test('a refused set toasts the error and writes nothing per row', async () => {
    api.post(costBulk, () => HttpResponse.json({detail: 'quotation already sent'}, {status: 400}))
    const wrapper = await openPanel({saved: [storedCost()]})
    await setAmount(wrapper, '4')
    await click(wrapper, 'Save changes')
    expect(bodies()).toContain('Error updating distance costs')
    expect(api.requests().filter((r) => ['delete', 'patch'].includes(r.method) || (r.method === 'post' && r.path === costBase))).toEqual([])
  })
})

describe('materials', () => {
  beforeEach(() => {
    // Written out: the schema is an intersection, which fixtureFor does not fill.
    api.get('/api/inventory/material/autocomplete/', [{
      id: 22, name: 'Nut', value: 'Nut', identifier: 'N-1', price_purchase: '1.00', price_selling: '6.00',
      price_selling_alt: '0.00', image: '',
    }])
    api.get('/api/inventory/material/{id}/', fixtureFor(vMaterial, {id: 22, name: 'Nut', price_selling_ex: '6.00', price_selling_ex_currency: 'EUR'}))
  })
  test('stored rows are named from the cost list, with no material read per row', async () => {
    const wrapper = await openPanel({panel: 'MaterialsPanel', saved: [
      storedCost({id: 71, cost_type: 'used_materials', amount_int: null, material: 15, material_name: 'Bolt', amount_decimal: '2.00'}),
      storedCost({id: 72, cost_type: 'used_materials', amount_int: null, material: 16, material_name: 'Nut', amount_decimal: '1.00'}),
    ]})
    expect(api.requests().filter((r) => r.path.startsWith('/api/inventory/material/'))).toEqual([])
    expect(wrapper.findAll('input[readonly]:not([disabled])').map((input) => input.element.value)).toEqual(['Bolt', 'Nut'])
  })
  test('searching, picking and saving: the pick reads the material once and seeds its selling price', async () => {
    {
      const wrapper = await openPanel({panel: 'MaterialsPanel', saved: [
        storedCost({id: 71, cost_type: 'used_materials', amount_int: null, material: 15, material_name: 'Bolt', amount_decimal: '2.00', price: '6.00'}),
      ]})
      await click(wrapper, 'Add material')
      await wrapper.get('.material-search').setValue('nu')
      // The search is debounced half a second.
      await new Promise((resolve) => setTimeout(resolve, 550))
      await settle()
      expect(api.requests().find((r) => r.path === '/api/inventory/material/autocomplete/').query).toEqual({q: 'nu'})
      await wrapper.get('.pick').trigger('click')
      await settle()
      expect(api.requests().filter((r) => r.path === '/api/inventory/material/22/')).toHaveLength(1)
      const amount = rows(wrapper)[1].findAll('input:not([disabled])').find((input) => input.element.value === '0.00')
      await amount.setValue('3')
      await amount.trigger('change')
      await settle()
      expect(rows(wrapper)[1].findAll('input[disabled]').map((input) => input.element.value)).toEqual(['€3.78', '€18.00'])
      await click(wrapper, 'Save changes')
      const body = writes()[0].body
      expect(writes()[0].path).toBe(bulkPath('used_materials'))
      expect(body).toHaveLength(2)
      expect(body[0]).toMatchObject({id: 71, material: 15, amount_decimal: '2.00', chapter: CHAPTER})
      expect(body[1]).toMatchObject({material: 22, amount_decimal: '3', price: '6.00', total: '18.00', chapter: CHAPTER})
      expect(body[1]).not.toHaveProperty('id')
      expect(bodies()).toContain('Materials costs have been updated')
    }
  })
  test('a row nobody picked a material for is not sent', async () => {
    const wrapper = await openPanel({panel: 'MaterialsPanel', saved: [
      storedCost({id: 71, cost_type: 'used_materials', amount_int: null, material: 15, material_name: 'Bolt', amount_decimal: '2.00'}),
    ]})
    await click(wrapper, 'Add material')
    await click(wrapper, 'Delete cost')
    await click(wrapper, 'Save changes')
    expect(writes()[0].body).toEqual([])
  })
})

describe('quotation lines', () => {
  test('"items" hands one line per cost to the form, carrying VAT rate and material', async () => {
    const form = context()
    const wrapper = await openPanel({panel: 'MaterialsPanel', form, saved: [
      storedCost({id: 71, cost_type: 'used_materials', amount_int: null, material: 15, material_name: 'Bolt', amount_decimal: '2.00', price: '6.00', total: '12.00', vat: '2.52', vat_type: '21.00'}),
    ]})
    expect(wrapper.text()).toContain('What to add as quotation lines')
    await click(wrapper, 'Create quotation lines')
    expect(form.linesCreated).toHaveBeenCalledOnce()
    expect(form.linesCreated.mock.calls[0][0]).toEqual([expect.objectContaining({
      cost_type: 'used_materials', info: 'material: Bolt', amount: '2.00', vat_type: 21,
      price: '6.00', total: '12.00', vat: '2.52', material: 15, material_name: 'Bolt', extra_description: '',
    })])
  })
  test('"total" hands one summed line at price zero, amount the whole hours', async () => {
    const form = context()
    const wrapper = await openPanel({panel: 'HoursPanel', props: {type: 'work_hours'}, form, saved: [
      storedCost({id: 71, cost_type: 'work_hours', amount_int: null, amount_duration: '02:00:00', amount_duration_read: '2:00', amount_duration_secs: 7200, price: '50.00', total: '100.00', vat: '21.00'}),
      storedCost({id: 72, cost_type: 'work_hours', amount_int: null, amount_duration: '01:00:00', amount_duration_read: '1:00', amount_duration_secs: 3600, price: '50.00', total: '50.00', vat: '10.50'}),
    ]})
    await selectRate(wrapper, 'total')
    await click(wrapper, 'Create quotation lines')
    expect(form.linesCreated.mock.calls[0][0]).toEqual([expect.objectContaining({
      cost_type: 'work_hours', info: 'Work hours', amount: '3', price: '0.00', total: '150.00', vat: '31.50', material: null,
    })])
  })
  test('"none" hands nothing', async () => {
    const form = context()
    const wrapper = await openPanel({form, saved: [storedCost()]})
    await selectRate(wrapper, 'none')
    await click(wrapper, 'Create quotation lines')
    expect(form.linesCreated).not.toHaveBeenCalled()
  })
  test('once the chapter has lines of this type the costs are read-only and the lines can be removed', async () => {
    const form = context({lines: ref([{type: 'distance'}])})
    const wrapper = await openPanel({form, saved: [storedCost()]})
    expect(wrapper.find('#costs-table').exists()).toBe(true)
    expect(rows(wrapper)).toHaveLength(0)
    expect(wrapper.find('summary svg').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('What to add as quotation lines')
    await click(wrapper, 'Remove quotation lines')
    expect(form.emptyCollectionClicked).toHaveBeenCalledWith('distance')
    // Removing the lines keeps the costs.
    expect(writes()).toEqual([])
  })
  test('the view shows the costs read-only, open, without controls', async () => {
    const wrapper = await openPanel({props: {isView: true}, saved: [storedCost()]})
    expect(wrapper.get('details').attributes('open')).toBeDefined()
    expect(wrapper.find('#costs-table').exists()).toBe(true)
    expect(button(wrapper, 'Save changes')).toBeUndefined()
    expect(wrapper.text()).not.toContain('What to add as quotation lines')
  })
})
