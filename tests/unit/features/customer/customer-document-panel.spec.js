import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import DocumentPanel from '@/features/customer/document/DocumentPanel.vue'
import { vPaginatedCustomerDocumentList } from '@/api/valibot.gen'

import { companyLogoPng } from '../../fixtures/member-demo-tenant.js'
import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts } from '../../support/form-harness.js'

enableAutoUnmount(afterEach)

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const DOC_ITEM = itemSchemaOf(vPaginatedCustomerDocumentList)

const STORED = () =>
  fixtureFor(DOC_ITEM, {
    id: 9,
    customer: 5,
    name: 'Manual.pdf',
    description: 'The manual',
    file: 'https://tenant.example/media/documents/manual.pdf',
    filename: 'manual.pdf',
    url: 'https://tenant.example/media/documents/manual.pdf',
    user_can_view: true,
  })

const DOCUMENTS = () => paginated([STORED()])

function fileBytes() {
  return Uint8Array.from(atob(companyLogoPng), (character) => character.charCodeAt(0))
}

async function chooseFiles(wrapper, filenames) {
  const input = wrapper.get('input[type="file"]')
  const files = filenames.map(
    (filename) => new File([fileBytes()], filename, { type: 'image/png' }),
  )
  Object.defineProperty(input.element, 'files', { value: files, configurable: true })
  await input.trigger('change')
  await settle()
  await wrapper.vm.$nextTick()
}

async function chooseReplacementFile(wrapper, filenames) {
  const inputs = wrapper.findAll('input[type="file"]')
  const input = inputs[inputs.length - 1]
  const files = filenames.map(
    (filename) => new File([fileBytes()], filename, { type: 'image/png' }),
  )
  Object.defineProperty(input.element, 'files', { value: files, configurable: true })
  await input.trigger('change')
  await settle()
  await wrapper.vm.$nextTick()
}

async function mountPanel({ isView = false } = {}) {
  const wrapper = mountForm(DocumentPanel, {
    deep: true,
    props: { customer: { id: 5 }, isView },
  })
  await settle()
  return wrapper
}

function saveButton(wrapper) {
  const button = wrapper.findAll('button').find((candidate) => candidate.text().includes('Save changes'))
  expect(button, 'no Save changes button on the screen').toBeDefined()
  return button
}

beforeEach(() => {
  api.get('/api/customer/document/', DOCUMENTS())
  api.post('/api/customer/document/', fixtureFor(DOC_ITEM, { id: 12, customer: 5 }))
  api.patch('/api/customer/document/{id}/', STORED())
  api.delete('/api/customer/document/{id}/', noContent)
})

describe('DocumentPanel, loading', () => {
  test('asks for the customer documents, page one', async () => {
    await mountPanel()

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/customer/document/', query: { customer: '5', page: '1' } },
    ])
  })

  test('shows a row per document, with edit and delete icons in edit mode', async () => {
    const wrapper = await mountPanel()

    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.text()).toContain('Manual.pdf')
    expect(wrapper.findAll('button[title="Edit"]')).toHaveLength(1)
    expect(wrapper.findAll('button[title="Delete"]')).toHaveLength(1)
  })

  test('the read-only variant shows no icons and no add button', async () => {
    const wrapper = await mountPanel({ isView: true })

    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.findAll('button[title="Edit"]')).toHaveLength(0)
    expect(wrapper.findAll('button[title="Delete"]')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('Add document(s)')
  })

  test('an empty collection in edit mode opens the add form by itself', async () => {
    api.get('/api/customer/document/', paginated([]))

    const wrapper = await mountPanel()

    expect(wrapper.text()).toContain('Add document(s)')
  })

  test('tells the user when the documents cannot be loaded', async () => {
    api.get('/api/customer/document/', new (await import('msw')).HttpResponse(null, { status: 500 }))

    await mountPanel()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading documents')
  })
})

describe('DocumentPanel, adding documents', () => {
  test('Add document(s) opens the add form, and a chosen file joins the collection', async () => {
    const wrapper = await mountPanel()
    await wrapper.findAll('button').find((b) => b.text().includes('Add document(s)')).trigger('click')
    await settle()

    await chooseFiles(wrapper, ['manual.pdf'])

    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(saveButton(wrapper)).toBeDefined()
  })

  test('saving POSTs the new document with its data URL, then reloads', async () => {
    const wrapper = await mountPanel()
    await wrapper.findAll('button').find((b) => b.text().includes('Add document(s)')).trigger('click')
    await settle()
    await chooseFiles(wrapper, ['manual.pdf'])

    await saveButton(wrapper).trigger('click')
    await settle()

    const posts = api.requests().filter((request) => request.method === 'post')
    expect(posts).toHaveLength(1)
    expect(posts[0].body).toEqual({
      customer: 5,
      file: expect.stringMatching(/^data:image\/png;base64,/),
      name: 'manual.pdf',
      description: '',
      user_can_view: true,
    })
    expect(toasts().map((toast) => toast.title)).toContain('Updated')
    expect(api.requests().filter((request) => request.method === 'get')).toHaveLength(2)
  })
})

describe('DocumentPanel, editing documents', () => {
  test('edit opens the form with the row; saving PATCHes without the stored file', async () => {
    const wrapper = await mountPanel()
    await wrapper.get('button[title="Edit"]').trigger('click')
    await settle()

    expect(wrapper.text()).toContain('Edit document')
    expect(wrapper.get('#customer-document-name').element.value).toBe('Manual.pdf')

    await wrapper.get('#customer-document-name').setValue('Manual v2.pdf')
    await wrapper.findAll('button').find((b) => b.text().includes('Edit document')).trigger('click')
    await settle()
    await saveButton(wrapper).trigger('click')
    await settle()

    const patch = api.requests().find((request) => request.method === 'patch')
    expect(patch.path).toBe('/api/customer/document/9/')
    expect(patch.body).toMatchObject({ name: 'Manual v2.pdf', description: 'The manual', user_can_view: true })
    expect(patch.body.file).toBeUndefined()
    expect(toasts().map((toast) => toast.title)).toContain('Updated')
  })

  test('a document replaced with a new file uploads the file, not the stored URL', async () => {
    const wrapper = await mountPanel()
    await wrapper.get('button[title="Edit"]').trigger('click')
    await settle()
    await chooseReplacementFile(wrapper, ['replacement.pdf'])
    await wrapper.findAll('button').find((b) => b.text().includes('Edit document')).trigger('click')
    await settle()
    await saveButton(wrapper).trigger('click')
    await settle()

    const patch = api.requests().find((request) => request.method === 'patch')
    expect(patch.body.file).toEqual(expect.stringMatching(/^data:image\/png;base64,/))
    expect(patch.body.name).toBe('Manual.pdf')
  })
})

describe('DocumentPanel, edit-then-cancel', () => {
  test('cancel discards the staged rename and the replacement file', async () => {
    const wrapper = await mountPanel()
    await wrapper.get('button[title="Edit"]').trigger('click')
    await settle()

    await wrapper.get('#customer-document-name').setValue('Renamed.pdf')
    await chooseReplacementFile(wrapper, ['replacement.pdf'])
    await wrapper.findAll('button').find((b) => b.text() === 'Cancel').trigger('click')
    await settle()

    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.text()).toContain('Manual.pdf')
    expect(wrapper.text()).not.toContain('Renamed.pdf')

    expect(api.requests().some((request) => request.method === 'patch')).toBe(false)
  })

  test('commit writes the staged rename into the row', async () => {
    const wrapper = await mountPanel()
    await wrapper.get('button[title="Edit"]').trigger('click')
    await settle()

    await wrapper.get('#customer-document-name').setValue('Manual v2.pdf')
    await wrapper.findAll('button').find((b) => b.text().includes('Edit document')).trigger('click')
    await settle()

    expect(wrapper.text()).toContain('Manual v2.pdf')
  })
})

describe('DocumentPanel, deleting documents', () => {
  test('delete marks the row, and Save changes DELETEs it and reloads', async () => {
    const wrapper = await mountPanel()
    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(wrapper.findAll('tbody tr')).toHaveLength(0)
    expect(toasts().map((toast) => toast.title)).toContain('Marked for delete')

    await saveButton(wrapper).trigger('click')
    await settle()

    expect(api.requests().filter((request) => request.method === 'delete')).toEqual([
      { method: 'delete', path: '/api/customer/document/9/', query: {} },
    ])
    expect(toasts().map((toast) => toast.title)).toContain('Updated')
  })

  test('Discard changes reloads the collection untouched', async () => {
    const wrapper = await mountPanel()
    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    await wrapper.findAll('button').find((b) => b.text().includes('Discard changes')).trigger('click')
    await settle()

    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
  })
})
