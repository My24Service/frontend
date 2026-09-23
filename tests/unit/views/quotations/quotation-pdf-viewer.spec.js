import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'

import QuotationPDFViewer from '@/views/quotations/QuotationPDFViewer.vue'
import { QuotationModel } from '@/models/quotations/Quotation'
import { vQuotationDetail } from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts } from '../../support/form-harness.js'

// Generating the definitive PDF used to take four requests: generate (an empty
// 200), re-read the quotation, read its customer - which the viewer never
// showed - and fetch the PDF. Generate now answers with the quotation.

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const quotation = (overrides = {}) => fixtureFor(vQuotationDetail, {
  id: 42, preliminary: false, definitive_pdf_filename: null, statuses: [], ...overrides,
})

const wrappers = []
beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:pdf')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
})

test('generating the PDF takes the quotation from the answer and fetches the PDF', async () => {
  api.post('/api/quotation/quotation/{id}/generate_definitive_pdf/',
    quotation({ definitive_pdf_filename: 'companycode-q42.pdf' }))
  api.post('/api/quotation/quotation/{id}/download_definitive_pdf/',
    () => new HttpResponse(new Uint8Array([37, 80, 68, 70]), { headers: { 'Content-Type': 'application/pdf' } }))

  const wrapper = mountForm(QuotationPDFViewer, {
    props: { quotationIn: new QuotationModel(quotation()) },
  })
  wrappers.push(wrapper)
  await settle()

  await wrapper.vm.generatePdf()

  expect(api.requests().map((request) => `${request.method} ${request.path}`)).toEqual([
    'post /api/quotation/quotation/42/generate_definitive_pdf/',
    'post /api/quotation/quotation/42/download_definitive_pdf/',
  ])
  expect(wrapper.vm.quotation.definitive_pdf_filename).toBe('companycode-q42.pdf')
  expect(toasts().map((toast) => toast.body)).toContain('PDF created')
})
