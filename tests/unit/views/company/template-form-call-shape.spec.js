import { beforeEach, describe, expect, test, vi } from 'vitest'

import TemplateForm from '@/views/company/template/TemplateForm.vue'

import { companyTemplatePreviewTemplatePdfCreate } from '@/api/sdk.gen'

import { mountForm, resetFakeHttp, toastCreate } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Call-shape characterisation for TemplateForm's migrated PDF-preview call
 * site.
 *
 * Pre-refactor (192a67d9) previewPdf() called templateService.previewPdfTemplate()
 * (src/models/company/Template.js), which did
 * `axios.post('/company/template/preview_template_pdf/', data, headers)` with
 * data = { id, uuid, template_type }. The refactor replaced it with the
 * generated companyTemplatePreviewTemplatePdfCreate op
 * (POST /api/company/template/preview_template_pdf/) carrying the same body.
 * Path, method and body are unchanged.
 *
 * REGRESSION FOUND: the migration commit (71e87215) switched the view to the
 * op but never added the import, so previewPdf() threw a swallowed
 * ReferenceError and never reached the network. Fixed by restoring the import;
 * the second test now pins the working behaviour.
 */

const fakeHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/services/api', () => ({ default: fakeHttp, normalClient: fakeHttp }))

vi.mock('@/api/client.gen', async () => {
  const { apiClientMock } = await import('../../support/api-client-mock.js')
  return apiClientMock(fakeHttp)
})

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

/** Drain microtasks so the preview promise settles. */
async function flush() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

beforeEach(() => {
  resetFakeHttp(fakeHttp)
  toastCreate.mockClear()
})

describe('TemplateForm - previewPdf', () => {
  test('intends to POST the template data to the PDF-preview action', async () => {
    // The exact call the view at HEAD builds (minus the missing import):
    // body { id, uuid, template_type }, blob response type.
    await companyTemplatePreviewTemplatePdfCreate({
      body: {
        id: 42,
        uuid: 'u-1234',
        template_type: 'invoice',
      },
      responseType: 'blob',
      throwOnError: true,
    })

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([
      {
        method: 'post',
        path: '/api/company/template/preview_template_pdf/',
        query: {},
        body: { id: 42, uuid: 'u-1234', template_type: 'invoice' },
      },
    ])
  })

  test('posts the template data to the PDF-preview action', async () => {
    // happy-dom cannot open blob: URLs; stub window.open so previewPdf's
    // post-download step does not throw.
    vi.stubGlobal('open', vi.fn())

    const wrapper = mountForm(TemplateForm, { props: { pk: 42 } })
    wrapper.vm.result = { uuid: 'u-1234' }
    wrapper.vm.template = { template_type: 'invoice' }

    await wrapper.vm.previewPdf()
    await flush()

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([
      {
        method: 'post',
        path: '/api/company/template/preview_template_pdf/',
        query: {},
        body: { id: 42, uuid: 'u-1234', template_type: 'invoice' },
      },
    ])
  })
})
