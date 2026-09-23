import { afterEach, expect, test, vi } from 'vitest'

import OfferForm from '@/views/quotations/OfferForm.vue'
import { vOffer } from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountListView, toasts } from '../../support/form-harness.js'

// The offer form used to open with three requests - the unsent offer, the
// quotation's documents, the quotation itself for its name and e-mail - and
// now opens with one: `get_unsent_offer` answers all three.

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const QUOTATION = { id: 42, quotation_id: 'Q-2026-042', quotation_name: 'Acme BV', quotation_email: 'inkoop@acme.nl' }
const DOCUMENTS = [
  { id: null, name: 'companycode-q-2026-042.pdf', is_pdf: true },
  { id: 7, name: 'tekening', is_pdf: false },
]
const storedOffer = (overrides = {}) => fixtureFor(vOffer, {
  id: 5, quotation: 42, recipients: 'a@acme.nl', subject: 'Offerte', body: 'Zie bijlage',
  is_sent: false, sent_date: null, ...overrides,
})

const wrappers = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
})

async function openForm(offer) {
  api.get('/api/quotation/offer/get_unsent_offer/', { offer, quotation: QUOTATION, documents: DOCUMENTS })
  const wrapper = await mountListView(OfferForm, { query: { quotationId: '42' } })
  wrappers.push(wrapper)
  await settle()
  return wrapper
}

test('opens with one request that carries the offer, the quotation and its documents', async () => {
  const wrapper = await openForm(storedOffer())

  expect(api.requests().map((request) => `${request.method} ${request.path}`))
    .toEqual(['get /api/quotation/offer/get_unsent_offer/'])
  expect(api.requests()[0].query).toEqual({ quotationId: '42' })
  expect(wrapper.text()).toContain('Q-2026-042 Acme BV')
  expect(wrapper.text()).toContain('tekening')
  expect(wrapper.vm.recipients).toEqual(['a@acme.nl', 'inkoop@acme.nl'])
})

test('without an unsent offer it starts a new one, addressed to the quotation', async () => {
  const wrapper = await openForm(null)

  expect(wrapper.vm.isCreate).toBe(true)
  expect(wrapper.vm.offer.quotation).toBe(42)
  // Not [''] - a blank entry that would fail the address check on send.
  expect(wrapper.vm.recipients).toEqual(['inkoop@acme.nl'])
})

test('a new offer is created, a stored one updated, through the same send', async () => {
  api.post('/api/quotation/offer/', ({ body }) => storedOffer({ ...body, id: 6, is_sent: true }))
  api.patch('/api/quotation/offer/{id}/', ({ body }) => storedOffer({ ...body, is_sent: true }))

  const created = await openForm(null)
  created.vm.offer.subject = 'Offerte'
  vi.spyOn(created.vm.$router, 'push').mockResolvedValue()
  await created.vm.submitForm()

  const stored = await openForm(storedOffer())
  vi.spyOn(stored.vm.$router, 'push').mockResolvedValue()
  await stored.vm.submitForm()

  const writes = api.requests().filter((request) => request.method !== 'get')
  expect(writes.map((request) => `${request.method} ${request.path}`))
    .toEqual(['post /api/quotation/offer/', 'patch /api/quotation/offer/5/'])
  expect(writes[0].body).toMatchObject({ quotation: 42, recipients: 'inkoop@acme.nl' })
  expect(toasts().map((toast) => toast.body).filter((body) => body === 'Quotation has been sent')).toHaveLength(2)
})
