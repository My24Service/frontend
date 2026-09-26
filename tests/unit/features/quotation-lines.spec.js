import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'
import { defineComponent } from 'vue'
import { ChapterPanel, QuotationLinePanel } from '@/features/quotation/form/panels'
import { vChapter, vQuotationLine } from '@/api/valibot.gen'
import { fixtureFor, paginated } from '../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../support/api-seam/index.js'
import { mountForm, toastCreate, toasts } from '../support/form-harness.js'
import { modal } from '../support/modal.js'

vi.mock('bootstrap-vue-next', async (original) => ({...(await original()), useToast: () => ({create: toastCreate})}))

const api = installApiSeam()
const QUOTATION = 42
const CHAPTER = 5
const linesBase = '/api/quotation/quotation-line/'
const linesBulk = '/api/quotation/quotation-line/chapter/{chapter_id}/'
const main = {
  getDefaultCurrency: 'EUR', getQuotationDefaultVat: 21, getInvoiceDefaultVat: 21,
  getVATTypes: [{value: 21, text: '21%'}, {value: 9, text: '9%'}],
}
const storedLine = (overrides = {}) => fixtureFor(vQuotationLine, {
  id: 91, quotation: QUOTATION, chapter: CHAPTER, cost_type: 'distance',
  material: null, material_name: null, material_identifier: null, old_material: null, location: null,
  amount: '20', info: 'Distance', extra_description: '',
  price: '0.50', price_currency: 'EUR', vat_type: '21.0',
  vat: '2.10', vat_currency: 'EUR', total: '10.00', total_currency: 'EUR',
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
const wrappers = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
})

describe('QuotationLinePanel', () => {
  let stored
  beforeEach(() => {
    stored = [storedLine()]
    api.get(linesBase, () => paginated(stored))
    api.post(linesBulk, ({body}) => body.map((row, index) => storedLine({...row, id: row.id ?? 200 + index})))
  })
  const Parent = defineComponent({
    components: {QuotationLinePanel},
    props: ['isView', 'preliminary'],
    emits: ['back', 'lines-changed'],
    template: `<QuotationLinePanel ref="panel" :quotation="{id: ${QUOTATION}, preliminary}" :chapter="{id: ${CHAPTER}, name: 'Roof'}"
      :is-view="isView" @back="$emit('back')" @lines-changed="(l) => $emit('lines-changed', l)" />`,
  })
  async function openLines({isView = false, preliminary = true} = {}) {
    const wrapper = mountForm(Parent, {deep: true, main, props: {isView, preliminary}})
    wrappers.push(wrapper)
    await settle()
    return wrapper
  }
  const panel = (wrapper) => wrapper.findComponent(QuotationLinePanel)
  async function typeLine(wrapper, {amount, info, whole, cents}) {
    await wrapper.get('#new-quotation-line-amount').setValue(amount)
    await wrapper.get('#new-quotation-line-amount').trigger('blur')
    await wrapper.get('#new-quotation-line-info').setValue(info)
    if (whole !== undefined) {
      await wrapper.findAll('.input-number')[0].setValue(whole)
      await wrapper.findAll('.input-decimal')[0].setValue(cents)
    }
    await settle()
  }

  test('reads the chapter\'s lines, the whole collection, and totals them', async () => {
    const wrapper = await openLines()
    expect(api.requests().find((r) => r.path === linesBase).query).toEqual({chapter: String(CHAPTER), page: '1', page_size: '1000'})
    expect(wrapper.get('h5').text()).toContain('Roof')
    expect(wrapper.get('.line-table').text()).toContain('Distance')
    expect(wrapper.get('.line-table').text()).toContain('€10.00')
    expect(wrapper.get('.line-table').text()).toContain('(21%)')
    expect(wrapper.get('.quotation-total').text()).toContain('10.00')
  })
  test('a new line is valid with info and a non-zero amount, and previews its totals', async () => {
    const wrapper = await openLines()
    await click(wrapper, 'New quotation line')
    expect(button(wrapper, 'Add quotation line').attributes('disabled')).toBeDefined()
    await typeLine(wrapper, {amount: '2,5', info: 'Tiles', whole: '12', cents: '50'})
    expect(wrapper.get('#new-quotation-line-amount').element.value).toBe('2.5')
    expect(button(wrapper, 'Add quotation line').attributes('disabled')).toBeUndefined()
    await wrapper.get('#new-quotation-line-amount').setValue('0')
    await settle()
    expect(button(wrapper, 'Add quotation line').attributes('disabled')).toBeDefined()
  })
  test('adding stages the line; saving is ONE bulk set with ids and without quotation/chapter', async () => {
    const wrapper = await openLines()
    await click(wrapper, 'New quotation line')
    await typeLine(wrapper, {amount: '2', info: 'Tiles', whole: '12', cents: '50'})
    await click(wrapper, 'Add quotation line')
    expect(wrapper.get('.line-table').text()).toContain('not saved')
    expect(button(wrapper, 'Back to quotation and chapters').attributes('disabled')).toBeDefined()
    expect(wrapper.get('.quotation-total').text()).toContain('35.00')
    await click(wrapper, 'Save changes')
    const posts = api.requests().filter((r) => r.method === 'post')
    expect(posts).toHaveLength(1)
    expect(posts[0].path).toBe(`/api/quotation/quotation-line/chapter/${CHAPTER}/`)
    expect(posts[0].body).toHaveLength(2)
    expect(posts[0].body[0]).toMatchObject({id: 91, amount: '20', info: 'Distance', cost_type: 'distance', price_currency: 'EUR'})
    expect(posts[0].body[1]).toMatchObject({amount: '2', info: 'Tiles', cost_type: 'manual', price: '12.50', total: '25.00', vat: '5.25', vat_type: '21'})
    expect(posts[0].body[1]).not.toHaveProperty('id')
    for (const row of posts[0].body) {
      expect(row).not.toHaveProperty('quotation')
      expect(row).not.toHaveProperty('chapter')
    }
    expect(api.requests().filter((r) => ['delete', 'patch'].includes(r.method))).toEqual([])
    expect(bodies()).toContain('chapter has been updated')
    // The answer is adopted: saved, and no re-read of the list.
    expect(api.requests().filter((r) => r.method === 'get' && r.path === linesBase)).toHaveLength(1)
    expect(wrapper.get('.line-table').text()).not.toContain('not saved')
    expect(button(wrapper, 'Back to quotation and chapters').attributes('disabled')).toBeUndefined()
  })
  test('a deleted stored line is listed as to be deleted and left out of the set', async () => {
    stored = [storedLine(), storedLine({id: 92, info: 'Labour'})]
    const wrapper = await openLines()
    await wrapper.findAll('button[title="Delete"]')[1].trigger('click')
    await settle()
    expect(wrapper.get('.deleted-lines').text()).toContain('Labour')
    await click(wrapper, 'Save changes')
    const [post] = api.requests().filter((r) => r.method === 'post')
    expect(post.body.map((row) => row.id)).toEqual([91])
  })
  test('editing a stored line keeps its id', async () => {
    const wrapper = await openLines()
    await wrapper.get('button[title="Edit"]').trigger('click')
    await settle()
    expect(wrapper.get('#new-quotation-line-info').element.value).toBe('Distance')
    await wrapper.get('#new-quotation-line-info').setValue('Distance to site')
    await click(wrapper, 'Edit quotation line')
    await click(wrapper, 'Save changes')
    const [post] = api.requests().filter((r) => r.method === 'post')
    expect(post.body).toEqual([expect.objectContaining({id: 91, info: 'Distance to site', amount: '20'})])
  })
  test('discard goes back to the stored lines', async () => {
    const wrapper = await openLines()
    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    await click(wrapper, 'Discard changes')
    expect(wrapper.get('.line-table').text()).toContain('Distance')
    expect(api.requests().filter((r) => r.method === 'post')).toEqual([])
  })
  test('lines from the cost panels are staged with a toast; a type\'s lines can be removed', async () => {
    const wrapper = await openLines()
    panel(wrapper).vm.addLines([{
      cost_type: 'work_hours', info: 'Work hours', amount: '3', vat_type: 21, extra_description: '',
      price: '0.00', price_currency: 'EUR', total: '150.00', total_currency: 'EUR', vat: '31.50', vat_currency: 'EUR',
      price_dinero: null, total_dinero: (await import('@/services/money')).toDinero('150.00', 'EUR'),
      vat_dinero: (await import('@/services/money')).toDinero('31.50', 'EUR'), material: null,
    }])
    await settle()
    expect(bodies()).toContain('1 quotation line added')
    expect(wrapper.get('.line-table').text()).toContain('Work hours')
    const changed = wrapper.emitted('lines-changed').at(-1)[0]
    expect(changed.map((line) => line.cost_type)).toEqual(['distance', 'work_hours'])
    panel(wrapper).vm.removeLinesForType('distance')
    await settle()
    expect(wrapper.get('.deleted-lines').text()).toContain('Distance')
  })
  test('a refused chapter save toasts and keeps the staged lines', async () => {
    api.post(linesBulk, () => HttpResponse.json({detail: 'quotation already sent'}, {status: 400}))
    const wrapper = await openLines()
    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    await click(wrapper, 'Save changes')
    expect(bodies()).toContain('Error updating chapter')
    expect(button(wrapper, 'Save changes')).toBeTruthy()
  })
  test('the view lists the lines without controls; a definitive quotation offers no new line', async () => {
    const view = await openLines({isView: true})
    expect(view.find('button[title="Edit"]').exists()).toBe(false)
    expect(button(view, 'New quotation line')).toBeUndefined()
    const definitive = await openLines({preliminary: false})
    expect(button(definitive, 'New quotation line')).toBeUndefined()
  })
  test('back returns to the chapters', async () => {
    const wrapper = await openLines()
    await click(wrapper, 'Back to quotation and chapters')
    expect(wrapper.emitted('back')).toHaveLength(1)
  })
})

describe('ChapterPanel', () => {
  const chaptersBase = '/api/quotation/chapter/'
  let chapters
  beforeEach(() => {
    chapters = [fixtureFor(vChapter, {id: CHAPTER, quotation: QUOTATION, name: 'Roof', description: 'Tiles and gutters'})]
    api.get(chaptersBase, () => paginated(chapters))
    api.post(chaptersBase, ({body}) => fixtureFor(vChapter, {...body, id: 6}))
    api.patch(chaptersBase + '{id}/', ({body, params}) => fixtureFor(vChapter, {id: Number(params.id), quotation: QUOTATION, ...body}))
    api.delete(chaptersBase + '{id}/', noContent)
  })
  async function openChapters({isView = false, preliminary = true} = {}) {
    const wrapper = mountForm(ChapterPanel, {deep: true, main, props: {quotation: {id: QUOTATION, preliminary}, isView}})
    wrappers.push(wrapper)
    await settle()
    return wrapper
  }
  test('lists the quotation\'s chapters; a name opens the chapter', async () => {
    const wrapper = await openChapters()
    expect(api.requests()[0].query).toEqual({quotation: String(QUOTATION), page: '1', page_size: '1000'})
    expect(wrapper.text()).toContain('Tiles and gutters')
    await wrapper.findAll('a').find((a) => a.text() === 'Roof').trigger('click')
    expect(wrapper.emitted('chapter-loaded')[0][0]).toMatchObject({id: CHAPTER, name: 'Roof'})
  })
  test('without chapters the new-chapter form opens by itself', async () => {
    chapters = []
    const wrapper = await openChapters()
    expect(wrapper.text()).toContain('New chapter')
    expect(wrapper.find('#chapter_name').exists()).toBe(true)
  })
  test('the name is required; a new chapter is created and handed on', async () => {
    chapters = []
    const wrapper = await openChapters()
    await click(wrapper, 'Add chapter')
    expect(api.requests().filter((r) => r.method === 'post')).toEqual([])
    expect(wrapper.find('#chapter_name.is-invalid').exists()).toBe(true)
    await wrapper.get('#chapter_name').setValue('Gutters')
    await click(wrapper, 'Add chapter')
    const [post] = api.requests().filter((r) => r.method === 'post')
    expect(post.body).toEqual({quotation: QUOTATION, name: 'Gutters', description: null})
    expect(wrapper.emitted('chapter-created')[0][0]).toMatchObject({id: 6, name: 'Gutters'})
  })
  test('editing patches the chapter', async () => {
    const wrapper = await openChapters()
    await wrapper.get('button[title="Edit"]').trigger('click')
    await settle()
    expect(wrapper.get('#chapter_name').element.value).toBe('Roof')
    await wrapper.get('#chapter_name').setValue('Roofing')
    await click(wrapper, 'Edit chapter')
    const [patch] = api.requests().filter((r) => r.method === 'patch')
    expect(patch).toMatchObject({path: `${chaptersBase}${CHAPTER}/`, body: {name: 'Roofing'}})
  })
  test('delete asks first, then deletes and toasts', async () => {
    const wrapper = await openChapters()
    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((r) => r.method === 'delete')).toEqual([])
    modal('delete-chapter-modal').ok()
    await settle()
    expect(api.requests().find((r) => r.method === 'delete').path).toBe(`${chaptersBase}${CHAPTER}/`)
    expect(bodies()).toContain('Chapter has been deleted')
  })
  test('a definitive quotation or the view offers no editing', async () => {
    for (const props of [{preliminary: false}, {isView: true}]) {
      const wrapper = await openChapters(props)
      expect(wrapper.find('button[title="Edit"]').exists()).toBe(false)
      expect(button(wrapper, 'New chapter')).toBeUndefined()
    }
  })
})
