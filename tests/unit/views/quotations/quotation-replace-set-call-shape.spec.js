import { afterEach, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'

import MaterialsCreate from '@/views/quotations/quotation_form/MaterialsCreate.vue'
import Distance from '@/views/quotations/quotation_form/Distance.vue'
import Hours from '@/views/quotations/quotation_form/Hours.vue'
import QuotationLine from '@/views/quotations/quotation_form/QuotationLine.vue'

import {
  vMaterial,
  vQuotationCost,
  vQuotationLine,
  vPaginatedQuotationCostList,
  vPaginatedQuotationLineList,
} from '@/api/valibot.gen'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts } from '../../support/form-harness.js'

// Call-shape for the two quotation replace-set endpoints the cost panels and
// the chapter line editor write through.
//
// Both panels used to write one row at a time through the legacy
// `BaseModel.updateCollection` (src/models/base.ts): a POST per new row, a
// PATCH per stored row, a DELETE per removed row, aborted at the first error
// with the earlier rows already written. Each now makes one request carrying
// the whole list.
//
// The bodies are BARE ARRAYS of rows (`QuotationCostRowRequest` /
// `QuotationLineRowRequest`), which is the part of the contract a spec has to
// hold on to: the seam validates every body against the generated request
// schema, so an object wrapper or a number where a decimal string belongs
// fails here rather than in production.

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const costBase = '/api/quotation/cost/'
const linesBase = '/api/quotation/quotation-line/'
const costBulk = '/api/quotation/cost/quotation/{quotation_id}/{cost_type}/'
const linesBulk = '/api/quotation/quotation-line/chapter/{chapter_id}/'
const costBulkPath = (quotationId, costType) => `/api/quotation/cost/quotation/${quotationId}/${costType}/`
const linesBulkPath = (chapterId) => `/api/quotation/quotation-line/chapter/${chapterId}/`

const QUOTATION = 42
const CHAPTER = 5
const main = {
  getDefaultCurrency: 'EUR',
  getQuotationDefaultVat: '21',
  getQuotationDefaultHourlyRate: '50.00',
  getQuotationDefaultPricePerKm: '0.50',
  getQuotationDefaultCallOutCosts: '25.00',
  getInvoiceDefaultVat: '21',
}

// The `*_currency` companions are pinned to EUR: the panels run their rows
// through `toDinero`, which only knows EUR/USD/GBP, so a faker word here would
// fail in the fixture rather than in the assertion.
const storedCost = (overrides = {}) => fixtureFor(vQuotationCost, {
  id: 71, quotation: QUOTATION, chapter: CHAPTER, cost_type: 'distance',
  user: null, material: null,
  amount_int: 3, amount_decimal: null, amount_duration: null,
  price: '0.50', price_currency: 'EUR', vat_type: '21.00',
  vat: '0.32', vat_currency: 'EUR', total: '1.82', total_currency: 'EUR',
  ...overrides,
})
const storedLine = (overrides = {}) => fixtureFor(vQuotationLine, {
  id: 91, quotation: QUOTATION, chapter: CHAPTER, cost_type: 'distance',
  material: null, amount: '20', info: 'Distance', extra_description: '',
  price: '0.50', price_currency: 'EUR', vat_type: '21.0',
  vat: '2.10', vat_currency: 'EUR', total: '10.00', total_currency: 'EUR',
  ...overrides,
})

/** The rows the panel's own save put on the wire, in call order. */
const writes = (path) => api.requests().filter(
  (request) => request.method !== 'get' && request.path === path,
)
const perRowWrites = () => api.requests().filter(
  (request) => request.method !== 'get'
    && (request.path === costBase || request.path === linesBase),
)

const wrappers = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

/**
 * Mount one cost panel over a server that already holds `saved`.
 *
 * The panel reads its chapter's rows with `chapter=<id>&cost_type=<type>`,
 * which the legacy client and the generated list op spell the same way.
 */
async function openPanel(component, { props = {}, saved = [] } = {}) {
  api.get(costBase, paginated(saved))
  api.get('/api/inventory/material/{id}/', fixtureFor(vMaterial, {
    id: 15, name: 'Bolt', price_selling_ex: '6.00', price_selling_ex_currency: 'EUR',
  }))
  api.post(costBulk, ({ body }) => body.map((row, index) => storedCost({ ...row, id: row.id ?? 100 + index })))

  const wrapper = mountForm(component, {
    props: { chapter: { id: CHAPTER, quotation: QUOTATION }, quotationLinesParent: [], ...props },
    main,
  })
  wrappers.push(wrapper)
  await settle()
  return wrapper
}

test('the materials panel saves every row in one replace-set, not one request per row', async () => {
  const wrapper = await openPanel(MaterialsCreate, {
    saved: [storedCost({ cost_type: 'used_materials', material: 15, material_name: 'Bolt', amount_decimal: '2.00', price: '6.00' })],
  })

  // A stored row edited in place, plus a material chosen since the last save.
  wrapper.vm.costService.collection[0].amount_decimal = '4.00'
  wrapper.vm.addCost()
  const draft = wrapper.vm.costService.collection[1]
  draft.material = 22
  draft.material_name = 'Nut'
  draft.amount_decimal = '3.00'

  await wrapper.vm.saveCosts()

  expect(writes(costBulkPath(QUOTATION, 'used_materials'))).toHaveLength(1)
  const request = writes(costBulkPath(QUOTATION, 'used_materials'))[0]
  const body = request.body
  // The save is scoped to this panel's chapter, the same filter the read uses.
  // Without it the server's replace-set would delete every other chapter's
  // costs of this type, since a row absent from the list means "delete".
  expect(request.query).toEqual({ chapter: String(CHAPTER) })
  expect(Array.isArray(body)).toBe(true)
  expect(body).toHaveLength(2)
  // The stored row keeps its id; the new one has none, which is what makes it
  // a create rather than an update. Each row also carries the currency its
  // amounts are in: the server reads the companion off the raw row and keeps
  // the column's own default without it.
  expect(body[0]).toMatchObject({
    id: 71, material: 15, amount_decimal: '4.00', chapter: CHAPTER,
    price_currency: 'EUR', vat_currency: 'EUR', total_currency: 'EUR',
  })
  expect(body[1]).toMatchObject({
    material: 22, amount_decimal: '3.00', chapter: CHAPTER,
    price_currency: 'EUR', vat_currency: 'EUR', total_currency: 'EUR',
  })
  expect(body[1]).not.toHaveProperty('id')
  // The quotation and the cost type travel in the url, and this Cost model is
  // not priced by the server, so the panel's own totals are part of the row.
  for (const row of body) {
    for (const key of ['quotation', 'cost_type', 'amount_duration_read', 'amount_duration_secs']) {
      expect(row).not.toHaveProperty(key)
    }
  }
  expect(body[0]).toHaveProperty('vat_type')
  expect(body[0]).toHaveProperty('total')
  expect(toasts().map((toast) => toast.body)).toContain('Materials costs have been updated')
})

test('a row dropped from the panel is left out of the set, which is what deletes it', async () => {
  const wrapper = await openPanel(Distance, {
    saved: [
      storedCost({ id: 71, cost_type: 'distance', amount_int: 3 }),
      storedCost({ id: 72, cost_type: 'distance', amount_int: 7 }),
    ],
  })
  expect(wrapper.vm.costService.collection).toHaveLength(2)

  wrapper.vm.deleteCost(1)
  await wrapper.vm.saveCosts()

  const body = writes(costBulkPath(QUOTATION, 'distance'))[0].body
  expect(body).toHaveLength(1)
  expect(body[0]).toMatchObject({ id: 71, amount_int: 3 })
  // No DELETE: the stored row the panel dropped is simply absent from the set.
  expect(api.requests().filter((request) => request.method === 'delete')).toEqual([])
  expect(perRowWrites()).toEqual([])
  expect(toasts().map((toast) => toast.body)).toContain('Distance costs updated')
})

test('the hours panel carries its duration string in the set', async () => {
  const wrapper = await openPanel(Hours, {
    props: { type: 'work_hours' },
    saved: [storedCost({ id: 71, cost_type: 'work_hours', amount_int: null, amount_duration: '02:00:00' })],
  })

  wrapper.vm.costService.collection[0].amount_duration = '3:00'
  await wrapper.vm.saveCosts()

  const body = writes(costBulkPath(QUOTATION, 'work_hours'))[0].body
  expect(body).toHaveLength(1)
  expect(body[0]).toMatchObject({
    id: 71, amount_duration: '3:00', chapter: CHAPTER, price_currency: 'EUR',
  })
  expect(perRowWrites()).toEqual([])
})

test('a refused set toasts an error and falls back to no per-row writes', async () => {
  const wrapper = await openPanel(Distance, {
    saved: [storedCost({ id: 71, cost_type: 'distance' })],
  })
  api.post(costBulk, () => HttpResponse.json({ detail: 'quotation already sent' }, { status: 400 }))

  await wrapper.vm.saveCosts()

  expect(toasts().map((toast) => toast.body)).toContain('Error updating distance costs')
  expect(api.requests().filter((request) => request.method === 'patch')).toEqual([])
  expect(perRowWrites()).toEqual([])
})

test('the chapter editor saves its lines in one request, ids included', async () => {
  api.get(linesBase, paginated([storedLine()]))
  api.post(linesBulk, ({ body }) => body.map((row, index) => storedLine({ ...row, id: row.id ?? 200 + index })))

  const wrapper = mountForm(QuotationLine, {
    props: { chapter: { id: CHAPTER, quotation: QUOTATION }, quotation: { preliminary: true } },
    main,
  })
  wrappers.push(wrapper)
  await settle()

  // What the cost panels emit when the user adds their rows to the quotation.
  wrapper.vm.quotationLinesCreated([{
    cost_type: 'distance', info: 'Distance', amount: 20, vat_type: 21,
    price: '0.50', price_currency: 'EUR', vat: '2.10', vat_currency: 'EUR',
    total: '10.00', total_currency: 'EUR',
  }])

  await wrapper.vm.submitQuotationLines()

  const posted = writes(linesBulkPath(CHAPTER))
  expect(posted).toHaveLength(1)
  const body = posted[0].body
  expect(Array.isArray(body)).toBe(true)
  expect(body).toHaveLength(2)
  expect(body[0]).toMatchObject({ id: 91, amount: '20', info: 'Distance' })
  expect(body[1]).toMatchObject({ amount: '20', info: 'Distance', cost_type: 'distance', total: '10.00' })
  expect(body[1]).not.toHaveProperty('id')
  // The chapter travels in the url and the quotation is inferred from it, so
  // neither belongs in a row.
  for (const row of body) {
    expect(row).not.toHaveProperty('quotation')
    expect(row).not.toHaveProperty('chapter')
  }
  expect(api.requests().filter((request) => request.method === 'delete')).toEqual([])
  expect(perRowWrites()).toEqual([])
  expect(toasts().map((toast) => toast.body)).toContain('chapter has been updated')
})

test('a refused chapter save toasts an error without a per-row retry', async () => {
  api.get(linesBase, paginated([storedLine()]))
  api.post(linesBulk, () => HttpResponse.json({ detail: 'quotation already sent' }, { status: 400 }))

  const wrapper = mountForm(QuotationLine, {
    props: { chapter: { id: CHAPTER, quotation: QUOTATION }, quotation: { preliminary: true } },
    main,
  })
  wrappers.push(wrapper)
  await settle()

  await wrapper.vm.submitQuotationLines()

  expect(toasts().map((toast) => toast.body)).toContain('Error updating chapter')
  expect(perRowWrites()).toEqual([])
})
