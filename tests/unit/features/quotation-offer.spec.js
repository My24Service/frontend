import { beforeEach, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'
import { OfferForm, validateOffer } from '@/features/quotation'
import { vOffer, vOfferQuotation } from '@/api/valibot.gen'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountListView, toasts } from '../support/form-harness.js'
import { serverError } from '../support/list-harness.js'

const api = installApiSeam()
const base = '/api/quotation/offer/'
const routes = [{name: 'quotations-sent', path: '/quotations/sent', component: {template: '<div />'}}]

const QUOTATION = fixtureFor(vOfferQuotation, {id: 42, quotation_id: 'Q-2026-042', quotation_name: 'Acme BV', quotation_email: 'inkoop@acme.nl'})
const DOCUMENTS = [
  {id: null, name: 'companycode-q-2026-042.pdf', is_pdf: true},
  {id: 7, name: 'tekening', is_pdf: false},
]
const storedOffer = (overrides = {}) => fixtureFor(vOffer, {
  id: 5, quotation: 42, recipients: 'a@acme.nl', subject: 'Offerte', body: 'Zie bijlage',
  is_sent: false, sent_date: null, ...overrides,
})
let unsent
beforeEach(() => {
  unsent = {offer: storedOffer(), quotation: QUOTATION, documents: DOCUMENTS}
  api.get(base + 'get_unsent_offer/', () => unsent)
  api.post(base, ({body}) => storedOffer({...body, id: 6, is_sent: true}))
  api.patch(base + '{id}/', ({body}) => storedOffer({...body, is_sent: true}))
})
async function openForm() {
  const wrapper = await mountListView(OfferForm, {deep: true, routes, query: {quotationId: '42'}})
  await settle()
  return wrapper
}
const tags = (wrapper) => wrapper.findAll('.b-form-tag').map((tag) => tag.text().replace(/\s*×?\s*$/, '').trim())
const writes = () => api.requests().filter((request) => ['post', 'patch'].includes(request.method))
const bodies = () => toasts().map((toast) => toast.body)
async function submit(wrapper) {
  await wrapper.findAll('button').find((b) => b.text() === 'Submit').trigger('click')
  await settle()
}

test('opens with one request that carries the offer, the quotation and its documents', async () => {
  const wrapper = await openForm()
  expect(api.requests().map((request) => `${request.method} ${request.path}`)).toEqual([`get ${base}get_unsent_offer/`])
  expect(api.requests()[0].query).toEqual({quotationId: '42'})
  expect(wrapper.get('h3').text()).toContain('Q-2026-042 Acme BV')
  expect(wrapper.get('h3').text()).toContain('resend')
  expect(wrapper.text()).toContain('tekening')
  expect(wrapper.get('#offer_subject').element.value).toBe('Offerte')
  expect(tags(wrapper)).toEqual(['a@acme.nl', 'inkoop@acme.nl'])
})
test('without an unsent offer it starts a new one addressed to the quotation, no blank tag', async () => {
  unsent = {offer: null, quotation: QUOTATION, documents: []}
  const wrapper = await openForm()
  expect(wrapper.get('h3').text()).toContain('new')
  expect(tags(wrapper)).toEqual(['inkoop@acme.nl'])
  expect(wrapper.text()).toContain('No attached documents to this quotation')
})
test('a new offer is POSTed with the quotation and the joined recipients, then opens the sent list', async () => {
  unsent = {offer: null, quotation: QUOTATION, documents: []}
  const wrapper = await openForm()
  await wrapper.get('#offer_subject').setValue('Offerte')
  await submit(wrapper)
  expect(writes().map((request) => `${request.method} ${request.path}`)).toEqual([`post ${base}`])
  expect(writes()[0].body).toEqual({quotation: 42, recipients: 'inkoop@acme.nl', subject: 'Offerte', body: ''})
  expect(bodies()).toContain('Quotation has been sent')
  expect(wrapper.vm.$route.name).toBe('quotations-sent')
})
test('a stored offer is PATCHed', async () => {
  const wrapper = await openForm()
  await submit(wrapper)
  expect(writes().map((request) => `${request.method} ${request.path}`)).toEqual([`patch ${base}5/`])
  expect(writes()[0].body).toMatchObject({quotation: 42, recipients: 'a@acme.nl,inkoop@acme.nl', subject: 'Offerte'})
})
test('an answer without is_sent is an error and does not navigate', async () => {
  api.patch(base + '{id}/', ({body}) => storedOffer({...body, is_sent: false}))
  const wrapper = await openForm()
  await submit(wrapper)
  expect(bodies()).toContain('Error sending quotation')
  expect(bodies()).not.toContain('Quotation has been sent')
  expect(wrapper.vm.$route.name).not.toBe('quotations-sent')
})
test('a failed send toasts the error', async () => {
  api.patch(base + '{id}/', serverError)
  const wrapper = await openForm()
  await submit(wrapper)
  expect(bodies()).toContain('Error sending quotation')
})
test('a blank subject is refused before anything is sent', async () => {
  const wrapper = await openForm()
  await wrapper.get('#offer_subject').setValue('  ')
  await submit(wrapper)
  expect(writes()).toHaveLength(0)
  expect(wrapper.text()).toContain('Please enter a subject')
})
test.each(['', 'invalid', 'ok@example.test,invalid'])('rejects the recipient list %j', (recipients) => {
  expect(validateOffer({quotation: 42, recipients, subject: 'Offerte', body: ''}).recipients).toBeTruthy()
})
test('keeps the generated subject maximum', () => {
  expect(validateOffer({quotation: 42, recipients: 'ok@example.test', subject: 'x'.repeat(256), body: ''}).subject).toBeTruthy()
})
test('the PDF attachment downloads the definitive PDF under the quotation number', async () => {
  api.post('/api/quotation/quotation/{id}/download_definitive_pdf/',
    () => new HttpResponse(new Uint8Array([37, 80, 68, 70]), {headers: {'Content-Type': 'application/pdf'}}))
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:pdf')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  let saved
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { saved = this.download })
  const wrapper = await openForm()
  expect(wrapper.findAll('.quotation-pdf-button')).toHaveLength(1)
  await wrapper.get('.quotation-pdf-button').trigger('click')
  await settle()
  expect(api.requests().at(-1)).toMatchObject({method: 'post', path: '/api/quotation/quotation/42/download_definitive_pdf/'})
  expect(saved).toBe('quotation-Q-2026-042.pdf')
  vi.restoreAllMocks()
})
test('a failed read toasts', async () => {
  api.get(base + 'get_unsent_offer/', serverError)
  await openForm()
  expect(bodies()).toContain('Error fetching unsent offer')
})
