import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { defineComponent } from 'vue'
import { HttpResponse } from 'msw'
import { InvoicePDFViewer } from '@/features/invoice'
import { vInvoice } from '@/api/valibot.gen'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountForm, toastCreate, toasts } from '../support/form-harness.js'

vi.mock('bootstrap-vue-next', async (original) => ({...(await original()), useToast: () => ({create: toastCreate})}))
const api = installApiSeam()
const base = '/api/invoice/invoice/{id}/'
const uuid = '00000000-0000-4000-8000-000000000021'
const invoice = (preliminary = false) => fixtureFor(vInvoice, {
  id: 8, uuid, invoice_id: 'INV-8', order: 42, preliminary,
  invoice_pdf_from_docx_filename: 'invoice.pdf',
})
const Parent = defineComponent({
  components: {InvoicePDFViewer},
  props: ['invoice', 'isView'],
  template: '<button id="open-pdf" @click="$refs.viewer.show()">View Invoice</button><InvoicePDFViewer ref="viewer" :invoice="invoice" :is-view="isView" />',
})
const wrappers = []
let createUrl
let revokeUrl
beforeEach(() => {
  let counter = 0
  createUrl = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'about:blank#pdf-' + ++counter)
  revokeUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  const pdf = () => new HttpResponse(new Uint8Array([37, 80, 68, 70]), {headers: {'Content-Type': 'application/pdf'}})
  api.post(base + 'generate_preview_pdf/', pdf)
  api.post(base + 'download_pdf/', pdf)
  api.post(base + 'recreate_pdf/', new HttpResponse(null, {status: 200}))
  api.post(base + 'make_definitive/', {result: true})
})
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
  vi.restoreAllMocks()
})
async function openViewer({preliminary = false, isView = true, auth = {isPlanning: true}} = {}) {
  const wrapper = mountForm(Parent, {
    deep: true,
    routes: [{name: 'invoice-view', path: '/view/:uuid', component: {template: '<div />'}}],
    props: {invoice: invoice(preliminary), isView}, auth,
  })
  wrappers.push(wrapper)
  await wrapper.get('#open-pdf').trigger('click')
  await settle()
  return wrapper
}
const posts = action => api.requests().filter(r => r.method === 'post' && r.path === '/api/invoice/invoice/8/' + action + '/')
const button = text => [...document.querySelectorAll('button')].find(element => element.textContent.trim() === text)
async function click(text) {
  const element = button(text)
  expect(element, text + ' must be reachable').toBeTruthy()
  element.click()
  await settle()
}
test('rendered recreate button fetches the replacement PDF exactly once', async () => {
  await openViewer()
  const previous = document.querySelector('iframe').src
  const downloadsBefore = posts('download_pdf').length
  await click('Recreate PDF')
  expect(posts('recreate_pdf')).toHaveLength(1)
  expect(posts('download_pdf')).toHaveLength(downloadsBefore + 1)
  expect(document.querySelector('iframe').src).not.toBe(previous)
  expect(toasts().map(t => t.body)).toContain('Invoice PDF created')
})
test.each([false, true])('preliminary preview uses preview endpoint with isView=%s', async isView => {
  await openViewer({preliminary: true, isView})
  expect(posts('generate_preview_pdf')).toHaveLength(1)
  expect(posts('download_pdf')).toHaveLength(0)
  expect(document.querySelector('iframe')).toBeTruthy()
  expect(Boolean(button('Make definitive'))).toBe(!isView)
})
test('binary template error renders backend details without a PDF', async () => {
  api.post(base + 'generate_preview_pdf/', new HttpResponse(JSON.stringify({template_error: 'bad template', details: 'line 3'}), {
    status: 400, headers: {'Content-Type': 'application/json'},
  }))
  await openViewer({preliminary: true, isView: false})
  expect(document.body.textContent).toContain('bad template')
  expect(document.body.textContent).toContain('line 3')
  expect(document.querySelector('iframe')).toBeNull()
})
test('make definitive requires rendered confirmation then navigates', async () => {
  const wrapper = await openViewer({preliminary: true, isView: false})
  await click('Make definitive')
  expect(posts('make_definitive')).toHaveLength(0)
  const confirm = document.querySelector('#invoice-definitive-modal .modal-footer .btn-primary')
  expect(confirm).toBeTruthy()
  confirm.click()
  await settle()
  expect(posts('make_definitive')).toHaveLength(1)
  expect(wrapper.vm.$router.currentRoute.value.name).toBe('invoice-view')
  expect(wrapper.vm.$router.currentRoute.value.params.uuid).toBe(uuid)
  expect(toasts().map(t => t.body)).toContain('Invoice is now definitive')
})
test('download button makes one additional request and releases download URL', async () => {
  await openViewer()
  const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  await click('Download PDF')
  expect(posts('download_pdf')).toHaveLength(2)
  expect(anchorClick).toHaveBeenCalledTimes(1)
  expect(revokeUrl).toHaveBeenCalledWith(createUrl.mock.results.at(-1).value)
})
test.each([{isCustomer: true}, {isBranchEmployee: true}])('restricted role hides management actions: %j', async auth => {
  await openViewer({auth})
  expect(button('Recreate PDF')).toBeUndefined()
  expect(button('Download PDF')).toBeUndefined()
  expect(posts('download_pdf')).toHaveLength(1)
})
test('sales role retains the existing PDF management controls', async () => {
  await openViewer({auth: {isSales: true}})
  expect(button('Recreate PDF')).toBeTruthy()
})
test('reopening and unmount release every preview URL', async () => {
  const wrapper = await openViewer()
  const first = createUrl.mock.results[0].value
  await wrapper.get('#open-pdf').trigger('click')
  await settle()
  expect(revokeUrl).toHaveBeenCalledWith(first)
  const last = createUrl.mock.results.at(-1).value
  wrapper.unmount()
  wrappers.splice(wrappers.indexOf(wrapper), 1)
  expect(revokeUrl).toHaveBeenCalledWith(last)
})
test('failed download renders a useful error without a PDF', async () => {
  api.post(base + 'download_pdf/', new HttpResponse(null, {status: 400}))
  await openViewer()
  expect(document.body.textContent).toContain('Error creating PDF')
  expect(document.querySelector('iframe')).toBeNull()
})
test('a failed make definitive reports exactly one error toast', async () => {
  api.post(base + 'make_definitive/', new HttpResponse(null, {status: 500}))
  await openViewer({preliminary: true, isView: false})
  await click('Make definitive')
  document.querySelector('#invoice-definitive-modal .modal-footer .btn-primary').click()
  await settle()
  const errors = toasts().filter(t => t.variant === 'danger')
  expect(errors).toHaveLength(1)
  expect(errors[0].body).toBe('Error making invoice definitive')
})
test('iframe load keeps the preview URL alive until unmount', async () => {
  const wrapper = await openViewer()
  const preview = createUrl.mock.results[0].value
  document.querySelector('iframe').dispatchEvent(new Event('load'))
  await settle()
  expect(revokeUrl).not.toHaveBeenCalledWith(preview)
  wrapper.unmount()
  wrappers.splice(wrappers.indexOf(wrapper), 1)
  expect(revokeUrl).toHaveBeenCalledWith(preview)
})
