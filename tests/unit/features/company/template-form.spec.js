import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'
import {
  vInvoiceAutocomplete,
  vQuotationAutocompleteRow,
  vTemplate,
} from '@/api/valibot.gen'
import TemplateForm from '@/features/company/template/TemplateForm.vue'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: spy } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: spy }) }
})

const api = installApiSeam()

const TEMPLATE_PATH = '/api/company/template/'
const PREVIEW_PATH = '/api/company/template/preview_template_pdf/'

const TEMPLATE = fixtureFor(vTemplate, {
  id: 14,
  name: 'Invoice 2026',
  description: 'Default invoice layout',
  template_type: 'invoice',
  file: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,AAAA',
  filename: 'invoice.docx',
  url: '/media/templates/invoice.docx',
  is_active: true,
  created: '01-01-2026',
  modified: '02-01-2026',
})

const INVOICES = [
  fixtureFor(vInvoiceAutocomplete, {
    id: 8,
    uuid: '00000000-0000-4000-8000-000000000021',
    invoice_id: 'INV-8',
    name: 'Ketel storing',
    address: 'Voorstraat 1',
    postal: '9711 AA',
    city: 'Groningen',
    value: 'INV-8 (Ketel storing)',
  }),
]

const QUOTATIONS = [
  fixtureFor(vQuotationAutocompleteRow, { name: 'Offerte Ketel', uuid: '00000000-0000-4000-8000-000000000022' }),
]

const multiselectStub = {
  props: ['options'],
  emits: ['select', 'search-change'],
  template: '<div />',
}

const bodies = () => toasts().map((toast) => toast.body)
const writes = () => api.requests()
  .filter((request) => ['post', 'patch'].includes(request.method))
  .filter((request) => request.path === TEMPLATE_PATH || request.path === TEMPLATE_PATH + '14/')

/** Let every request a submit sets off come back. */
async function drain(wrapper) {
  for (let i = 0; i < 4; i++) {
    await settle()
    await wrapper.vm.$nextTick()
  }
}

async function click(wrapper, label) {
  await wrapper.findAll('button').find((button) => button.text() === label).trigger('click')
  await drain(wrapper)
}

/** Pick a file the way the browser's picker does: a `change` event. */
async function chooseFile(wrapper, name = 'invoice.docx') {
  const input = wrapper.get('input[type="file"]')
  const file = new File(['fake-docx-bytes'], name, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await drain(wrapper)
}

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 550))
  await settle()
}

function picker(wrapper) {
  return wrapper.findAllComponents(multiselectStub)[0]
}

let createUrl
let openUrl

beforeEach(() => {
  api.get('/api/company/template/{id}/', TEMPLATE)
  api.post(TEMPLATE_PATH, ({ body }) => fixtureFor(vTemplate, { id: 15, ...body }))
  api.patch('/api/company/template/{id}/', ({ body }) => fixtureFor(vTemplate, { id: 14, ...body }))
  api.get('/api/invoice/invoice/autocomplete/', INVOICES)
  api.get('/api/quotation/quotation/autocomplete/', QUOTATIONS)
  api.post(PREVIEW_PATH, () => new HttpResponse(new Uint8Array([37, 80, 68, 70]), {
    headers: { 'Content-Type': 'application/pdf' },
  }))

  createUrl = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:preview')
  openUrl = vi.spyOn(window, 'open').mockImplementation(() => null)
})
afterEach(() => {
  vi.restoreAllMocks()
})

function mountTemplate(options = {}) {
  return mountForm(TemplateForm, {
    deep: true,
    props: { pk: null },
    routes: [
      { name: 'company-templates', path: '/company/templates', component: { template: '<div />' } },
    ],
    stubs: { VueMultiselect: multiselectStub },
    ...options,
  })
}

describe('TemplateForm create', () => {
  test('an empty submit names every missing field', async () => {
    const wrapper = mountTemplate()
    await settle()

    await click(wrapper, 'Submit')

    expect(wrapper.text()).toContain('Please enter a template name')
    expect(wrapper.text()).toContain('Please select a template type')
    expect(wrapper.text()).toContain('Please select a file')
    expect(writes()).toHaveLength(0)
  })

  test('a picked file rides the body as base64', async () => {
    const wrapper = mountTemplate()
    await settle()

    await wrapper.get('#template_name').setValue('Invoice 2027')
    await wrapper.get('#template_type').setValue('invoice')
    await chooseFile(wrapper)
    await click(wrapper, 'Submit')

    const post = writes().find((request) => request.method === 'post')
    expect(post.path).toBe(TEMPLATE_PATH)
    expect(post.body).toMatchObject({ name: 'Invoice 2027', template_type: 'invoice' })
    expect(post.body.file).toMatch(/^data:application\/vnd/)
    expect(bodies()).toContain('Template has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a failed create keeps the form and reports it', async () => {
    api.post(TEMPLATE_PATH, serverError)
    const wrapper = mountTemplate()
    await settle()

    await wrapper.get('#template_name').setValue('Invoice 2027')
    await wrapper.get('#template_type').setValue('invoice')
    await chooseFile(wrapper)
    await click(wrapper, 'Submit')

    expect(bodies()).toContain('Error creating template')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('TemplateForm view and edit', () => {
  test('the route opens the record with its download link', async () => {
    const wrapper = mountTemplate({ props: { pk: 14 } })
    await settle()

    expect(wrapper.text()).toContain('Invoice 2026')
    expect(wrapper.find('#template_name').exists()).toBe(false)

    // The stored file's download link sits on the edit form, as before.
    await click(wrapper, 'Edit template')
    expect(wrapper.get('a[href="/media/templates/invoice.docx"]').text()).toBe('invoice.docx')
  })

  test('editing renames without touching the stored file', async () => {
    const wrapper = mountTemplate({ props: { pk: 14 } })
    await settle()

    await click(wrapper, 'Edit template')
    await wrapper.get('#template_name').setValue('Invoice 2026, renamed')
    await click(wrapper, 'Submit')

    const patch = writes().find((request) => request.method === 'patch')
    expect(patch.path).toBe(TEMPLATE_PATH + '14/')
    expect(patch.body).not.toHaveProperty('file')
    expect(bodies()).toContain('Template has been updated')
    // An edit save stays on the screen rather than going back.
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('deactivating writes the false instead of dropping it', async () => {
    const wrapper = mountTemplate({ props: { pk: 14 } })
    await settle()

    // The legacy model stripped falsy values, so unchecking active silently
    // kept the stored true.
    await click(wrapper, 'Edit template')
    await wrapper.get('#template_active').setValue(false)
    await click(wrapper, 'Submit')

    const patch = writes().find((request) => request.method === 'patch')
    expect(patch.body).toMatchObject({ is_active: false })
  })

  test('a picked file replaces the stored one', async () => {
    const wrapper = mountTemplate({ props: { pk: 14 } })
    await settle()

    await click(wrapper, 'Edit template')
    await chooseFile(wrapper)
    await click(wrapper, 'Submit')

    const patch = writes().find((request) => request.method === 'patch')
    expect(patch.body.file).toMatch(/^data:application\/vnd/)
  })
})

describe('TemplateForm preview', () => {
  test('searching narrows the invoices server-side', async () => {
    const wrapper = mountTemplate({ props: { pk: 14 } })
    await settle()

    await picker(wrapper).vm.$emit('search-change', 'ketel')
    await pastDebounce()

    const reads = api.requests().filter((request) =>
      request.method === 'get' && request.path === '/api/invoice/invoice/autocomplete/')
    expect(reads.at(-1).query).toMatchObject({ q: 'ketel' })
  })

  test('a picked invoice previews through the template endpoint', async () => {
    const wrapper = mountTemplate({ props: { pk: 14 } })
    await settle()

    await picker(wrapper).vm.$emit('select', { uuid: '00000000-0000-4000-8000-000000000021', label: 'Ketel storing' })
    await drain(wrapper)
    await click(wrapper, 'Preview pdf')

    const post = api.requests().find((request) => request.method === 'post' && request.path === PREVIEW_PATH)
    expect(post.body).toEqual({
      id: 14,
      uuid: '00000000-0000-4000-8000-000000000021',
      template_type: 'invoice',
    })
    expect(createUrl).toHaveBeenCalled()
    expect(openUrl).toHaveBeenCalledWith('blob:preview', '_blank')
    expect(bodies()).not.toContain('Error downloading template')
  })
})
