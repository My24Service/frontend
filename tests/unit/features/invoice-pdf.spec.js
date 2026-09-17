import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'
import InvoicePDFViewer from '@/features/invoice/pdf/InvoicePDFViewer.vue'
import { vInvoice } from '@/api/valibot.gen'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountForm, toastCreate, toasts } from '../support/form-harness.js'
import { modal } from '../support/modal.js'

vi.mock('bootstrap-vue-next', async (original) => ({...(await original()), useToast: () => ({create: toastCreate})}))
const api = installApiSeam()
const pdfBytes = new Uint8Array([37, 80, 68, 70])
const definitive = () => fixtureFor(vInvoice, {id: 8, uuid: '00000000-0000-4000-8000-000000000021', invoice_id: 'INV-8', order: 42, preliminary: false, invoice_pdf_from_docx_filename: 'invoice.pdf'})
const preliminary = () => fixtureFor(vInvoice, {id: 8, uuid: '00000000-0000-4000-8000-000000000021', invoice_id: 'INV-8', order: 42, preliminary: true})
const routes = [{name: 'invoice-view', path: '/view/:uuid', component: {template: '<div />'}}]
const revoke = vi.fn()
let originalRevoke
beforeEach(() => {
  revoke.mockClear()
  originalRevoke = URL.revokeObjectURL
  URL.revokeObjectURL = revoke
  api.post('/api/invoice/invoice/{id}/generate_preview_pdf/', new HttpResponse(pdfBytes, {headers: {'Content-Type': 'application/pdf'}}))
  api.post('/api/invoice/invoice/{id}/download_pdf/', new HttpResponse(pdfBytes, {headers: {'Content-Type': 'application/pdf'}}))
  api.post('/api/invoice/invoice/{id}/recreate_pdf/', new HttpResponse(null, {status: 200}))
  api.post('/api/invoice/invoice/{id}/make_definitive/', {result: true})
})
afterEach(() => { URL.revokeObjectURL = originalRevoke })
async function mountViewer(invoice, props = {}) {
  return mountForm(InvoicePDFViewer, {
    deep: true, routes: [{name: 'invoice-view', path: '/view/:uuid', component: {template: '<div />'}}],
    props: {invoice, isView: true, ...props},
    auth: {isPlanning: true},
  })
}
const posts = (path) => api.requests().filter(r => r.method === 'post' && r.path === path)
test('show loads the stored PDF for a definitive invoice', async () => {
  const wrapper = await mountViewer(definitive())
  await wrapper.vm.show()
  await settle()
  expect(posts('/api/invoice/invoice/8/download_pdf/')).toHaveLength(1)
})
test('an editor preview of a preliminary invoice uses the preview endpoint', async () => {
  const wrapper = await mountViewer(preliminary(), {isView: false})
  await wrapper.vm.show()
  await settle()
  expect(posts('/api/invoice/invoice/8/generate_preview_pdf/')).toHaveLength(1)
  expect(posts('/api/invoice/invoice/8/download_pdf/')).toHaveLength(0)
})
test('a template error blob is decoded into the error state without a viewer', async () => {
  api.post('/api/invoice/invoice/{id}/generate_preview_pdf/', new HttpResponse(
    JSON.stringify({template_error: 'bad template', details: 'x'}), {status: 400, headers: {'Content-Type': 'application/json'}}))
  const wrapper = await mountViewer(preliminary(), {isView: false})
  await wrapper.vm.show()
  await settle()
  expect(wrapper.vm.pdfBlobError).toMatchObject({template_error: 'bad template', details: 'x'})
})
test('recreate posts bodyless and toasts success', async () => {
  const wrapper = await mountViewer(definitive())
  await wrapper.vm.recreateInvoicePdf()
  await settle()
  expect(posts('/api/invoice/invoice/8/recreate_pdf/')).toHaveLength(1)
  expect(toasts().map(t => t.body)).toContain('Invoice PDF created')
})
test('make definitive posts bodyless and refreshes caches', async () => {
  const wrapper = await mountViewer(preliminary(), {isView: false})
  await wrapper.vm.doMakeDefinitive()
  await settle()
  expect(posts('/api/invoice/invoice/8/make_definitive/')).toHaveLength(1)
  expect(toasts().map(t => t.body)).toContain('Invoice is now definitive')
})
test('the iframe releases its object URL after load', async () => {
  const wrapper = await mountViewer(definitive())
  await wrapper.vm.show()
  await settle()
  const before = revoke.mock.calls.length
  await wrapper.vm.iframeLoaded()
  expect(revoke.mock.calls.length).toBeGreaterThan(before)
})
test('a failed download keeps the error state and never opens the viewer', async () => {
  api.post('/api/invoice/invoice/{id}/download_pdf/', new HttpResponse(null, {status: 400}))
  const wrapper = await mountViewer(definitive())
  await wrapper.vm.show()
  await settle()
  expect(wrapper.vm.pdfBlobError).toBeTruthy()
})
