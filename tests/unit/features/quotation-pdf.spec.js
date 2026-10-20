import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { defineComponent } from 'vue'
import { HttpResponse } from 'msw'
import { QuotationPDFViewer } from '@/features/quotation'
import { vQuotation, vQuotationDetail } from '@/api/valibot.gen'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountForm, toasts } from '../support/form-harness.js'

const api = installApiSeam()
const base = '/api/quotation/quotation/{id}/'
const quotation = (overrides = {}) => fixtureFor(vQuotation, {
  id: 42, quotation_id: 'Q-42', preliminary: false, definitive_pdf_filename: null, ...overrides,
})
const Parent = defineComponent({
  components: {QuotationPDFViewer},
  props: ['quotation', 'isView'],
  template: '<button id="open-pdf" @click="$refs.viewer.show()">View</button><QuotationPDFViewer ref="viewer" :quotation="quotation" :is-view="isView" />',
})
const pdf = () => new HttpResponse(new Uint8Array([37, 80, 68, 70]), {headers: {'Content-Type': 'application/pdf'}})
const wrappers = []
let createUrl
let revokeUrl
beforeEach(() => {
  let counter = 0
  createUrl = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'about:blank#pdf-' + ++counter)
  revokeUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  api.post(base + 'generate_preview_pdf/', pdf)
  api.post(base + 'download_definitive_pdf/', pdf)
  api.post(base + 'generate_definitive_pdf/', fixtureFor(vQuotationDetail, {
    id: 42, quotation_id: 'Q-42', preliminary: false, definitive_pdf_filename: 'companycode-q42.pdf', statuses: [],
  }))
  api.post(base + 'make_definitive/', {result: true})
})
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
  vi.restoreAllMocks()
})
async function openViewer({isView = true, overrides = {}} = {}) {
  const wrapper = mountForm(Parent, {
    deep: true,
    routes: [{name: 'quotation-view', path: '/quotations/quotations/view/:pk', component: {template: '<div />'}}],
    props: {quotation: quotation(overrides), isView},
  })
  wrappers.push(wrapper)
  await wrapper.get('#open-pdf').trigger('click')
  await settle()
  return wrapper
}
const posts = action => api.requests().filter(r => r.method === 'post' && r.path === '/api/quotation/quotation/42/' + action + '/')
const button = text => [...document.querySelectorAll('button')].find(element => element.textContent.trim() === text)
async function click(text) {
  const element = button(text)
  expect(element, text + ' must be reachable').toBeTruthy()
  element.click()
  await settle()
}

test('a definitive quotation shows its stored PDF, chrome-less', async () => {
  await openViewer()
  expect(posts('download_definitive_pdf')).toHaveLength(1)
  expect(posts('generate_preview_pdf')).toHaveLength(0)
  expect(document.querySelector('iframe').getAttribute('src')).toBe('about:blank#pdf-1#toolbar=0&navpanes=0&scrollbar=0')
  expect(document.body.textContent).toContain('Definitive PDF')
  expect(button('Recreate PDF')).toBeTruthy()
  expect(button('Make definitive')).toBeUndefined()
})
test.each([false, true])('a preliminary quotation shows a preview (isView=%s)', async isView => {
  await openViewer({isView, overrides: {preliminary: true}})
  expect(posts('generate_preview_pdf')).toHaveLength(1)
  expect(posts('download_definitive_pdf')).toHaveLength(0)
  expect(document.body.textContent).toContain('PDF preview')
  expect(button('Recreate PDF')).toBeUndefined()
  expect(Boolean(button('Make definitive'))).toBe(!isView)
})
test('generating adopts the fresh quotation, fetches the new PDF and toasts', async () => {
  await openViewer()
  expect(button('Download PDF')).toBeUndefined()
  await click('Recreate PDF')
  expect(posts('generate_definitive_pdf')).toHaveLength(1)
  expect(posts('download_definitive_pdf')).toHaveLength(2)
  expect(button('Download PDF')).toBeTruthy()
  expect(toasts().map(t => t.body)).toContain('PDF created')
})
test('a failed generate toasts the error', async () => {
  api.post(base + 'generate_definitive_pdf/', new HttpResponse(null, {status: 400}))
  await openViewer()
  await click('Recreate PDF')
  expect(toasts().map(t => t.body)).toContain('Error creating PDF')
})
test('a template error opens the error modal with the details and no viewer', async () => {
  api.post(base + 'generate_preview_pdf/', new HttpResponse(JSON.stringify({template_error: 'bad template', details: 'line 3'}), {
    status: 400, headers: {'Content-Type': 'application/json'},
  }))
  await openViewer({overrides: {preliminary: true}, isView: false})
  expect(document.body.textContent).toContain('bad template')
  expect(document.body.textContent).toContain('line 3')
  expect(document.querySelector('iframe')).toBeNull()
})
test('make definitive confirms, posts, toasts and opens the view', async () => {
  const wrapper = await openViewer({overrides: {preliminary: true}, isView: false})
  await click('Make definitive')
  expect(posts('make_definitive')).toHaveLength(0)
  document.querySelector('#quotation-definitive-modal .modal-footer .btn-primary').click()
  await settle()
  expect(posts('make_definitive')).toHaveLength(1)
  expect(toasts().map(t => t.body)).toContain('Quotation is now definitive')
  expect(wrapper.vm.$router.currentRoute.value).toMatchObject({name: 'quotation-view', params: {pk: '42'}})
})
test('a failed make definitive reports one error toast and stays', async () => {
  api.post(base + 'make_definitive/', new HttpResponse(null, {status: 500}))
  const wrapper = await openViewer({overrides: {preliminary: true}, isView: false})
  await click('Make definitive')
  document.querySelector('#quotation-definitive-modal .modal-footer .btn-primary').click()
  await settle()
  const errors = toasts().filter(t => t.variant === 'danger')
  expect(errors.map(t => t.body)).toEqual(['Error making quotation definitive'])
  expect(wrapper.vm.$router.currentRoute.value.name).not.toBe('quotation-view')
})
test('download saves the PDF under the quotation number and releases its URL', async () => {
  await openViewer({overrides: {definitive_pdf_filename: 'q.pdf'}})
  const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  let saved
  anchorClick.mockImplementation(function () { saved = this.download })
  await click('Download PDF')
  expect(posts('download_definitive_pdf')).toHaveLength(2)
  expect(saved).toBe('quotation-Q-42.pdf')
  expect(revokeUrl).toHaveBeenCalledWith(createUrl.mock.results.at(-1).value)
})
test('the preview URL outlives the iframe load and is released on reopen and unmount', async () => {
  const wrapper = await openViewer()
  const first = createUrl.mock.results[0].value
  document.querySelector('iframe').dispatchEvent(new Event('load'))
  await settle()
  expect(revokeUrl).not.toHaveBeenCalledWith(first)
  await wrapper.get('#open-pdf').trigger('click')
  await settle()
  expect(revokeUrl).toHaveBeenCalledWith(first)
  const last = createUrl.mock.results.at(-1).value
  wrapper.unmount()
  wrappers.splice(wrappers.indexOf(wrapper), 1)
  expect(revokeUrl).toHaveBeenCalledWith(last)
})
