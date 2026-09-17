import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { vTemplate } from '@/api/valibot.gen'
import TemplateList from '@/features/company/template/TemplateList.vue'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({ create: toastCreate }),
}))

const api = installApiSeam()
const endpoint = '/api/company/template/'

const routes = [
  { name: 'customer-template-add', path: '/company/templates/form', component: { template: '<div />' } },
  { name: 'customer-template-edit', path: '/company/templates/form/:pk', component: { template: '<div />' } },
]

function template(overrides = {}) {
  return fixtureFor(vTemplate, {
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
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)
const listRequests = () => api.requests().filter((request) => request.method === 'get' && request.path === endpoint)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => paginated([template()], { count: 45 }))
  api.delete(endpoint + '{id}/', noContent)
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountTemplates(options = {}) {
  return mountListView(TemplateList, {
    deep: true,
    routes,
    ...options,
  })
}

describe('TemplateList', () => {
  test('loads page one and renders every column', async () => {
    const wrapper = await mountTemplates()
    await settle()

    expect(listRequests()[0]).toMatchObject({ path: endpoint, query: { page: '1', page_size: '20' } })
    const body = wrapper.get('tbody').text()
    expect(body).toContain('Invoice 2026')
    expect(body).toContain('invoice')
    expect(body).toContain('Default invoice layout')
    expect(wrapper.get('h3').text()).toContain('Templates')
  })

  test('the name links to the edit route, which keeps its legacy name', async () => {
    const wrapper = await mountTemplates()
    await settle()

    // URLs stay stable across the migration: the company-screen form keeps
    // answering the `customer-template-*` names.
    expect(wrapper.get('tbody a').attributes('href')).toBe('/company/templates/form/14')
  })

  test('a search term is debounced onto the wire', async () => {
    const wrapper = await mountTemplates()
    await settle()

    await wrapper.get('input[aria-label="Search templates"]').setValue('invoice')
    await new Promise((resolve) => setTimeout(resolve, 350))
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({ q: 'invoice', page: '1' })
  })

  test('an empty list has an explicit empty state', async () => {
    api.get(endpoint, paginated([]))
    const wrapper = await mountTemplates()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('No templates found')
  })

  test('a load failure tells the user', async () => {
    api.get(endpoint, serverError)
    await mountTemplates()
    await settle()

    expect(bodies()).toContain('Error loading templates')
  })
})

describe('TemplateList row actions', () => {
  test('delete confirms, sends the row id and refetches', async () => {
    const wrapper = await mountTemplates()
    await settle()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)

    modal('delete-template-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'delete').path).toBe(endpoint + '14/')
    expect(listRequests()).toHaveLength(2)
    expect(bodies()).toContain('Template has been deleted')
  })

  test('a failed delete keeps the row and reports it', async () => {
    api.delete(endpoint + '{id}/', serverError)
    const wrapper = await mountTemplates()
    await settle()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-template-modal').ok()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('Invoice 2026')
    expect(bodies()).toContain('Error deleting template')
  })
})
