import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

// DocumentPanel, rewritten into the feature folder. These specs began as the
// characterisation of the legacy panel and now hold the rewrite to the same
// requests — with one repair: the legacy add flow was dead (it bound its file
// handler to `@input`, which b-form-file never emits), and the rewrite
// listens to `change` like LogoUploadField does at #325. Declared in the
// Slice README.
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

/**
 * The documents panel, characterised on the legacy component.
 *
 * What the panel does today:
 *
 *   - it lists `/api/customer/document/?customer=<id>&page=1` on mount;
 *   - an empty collection in edit mode auto-opens the "Add document(s)" form;
 *   - chosen files become base64 data URLs and sit in the collection as new
 *     documents; saving POSTs them one by one;
 *   - editing an existing document PATCHes it; a stored file's URL is stripped
 *     from the body (anything starting with `http`), so the stored file is
 *     never re-uploaded — a newly chosen file rides out instead;
 *   - deleting a row only marks it; "Save changes" DELETEs it;
 *   - everything is staged locally until "Save changes", which then replays
 *     creates and updates in collection order, then the deletes, and reloads.
 */

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

/** The PNG bytes the member-suite uses, so the data URL is deterministic. */
function fileBytes() {
  return Uint8Array.from(atob(companyLogoPng), (character) => character.charCodeAt(0))
}

/**
 * Choose files on the panel's file input, the way the browser's file chooser
 * does: `input.files` is defined onto the element and `change` is the event
 * `b-form-file` listens for. FileReader turns each file into a data URL.
 */
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

/** Choose a file on the EDIT form's input (the one bound to the row). */
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

/** The staged-changes footer buttons. */
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
  // The legacy panel binds filesSelected to `@input` on b-form-file, which
  // bootstrap-vue-next never emits — its BFormFile emits only
  // `update:modelValue` and `change`. Chosen files therefore never reach the
  // collection: the add flow is dead in the running application, the same
  // defect the Member form carried until #325 repaired it. These two tests pin
  // the broken behaviour; the rewrite repairs it and declares the exception.
  test('Add document(s) opens the add form, and a chosen file joins the collection', async () => {
    // The repair: the legacy panel never got here — its dead `@input`
    // binding meant chosen files joined nothing (see the header comment).
    const wrapper = await mountPanel()
    await wrapper.findAll('button').find((b) => b.text().includes('Add document(s)')).trigger('click')
    await settle()

    await chooseFiles(wrapper, ['manual.pdf'])

    // The new row sits in the table, and the staged-changes block appears.
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
    // The reload after a successful save.
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
    // The stored file's URL never rides back out.
    expect(patch.body.file).toBeUndefined()
    expect(toasts().map((toast) => toast.title)).toContain('Updated')
  })

  test('a document replaced with a new file uploads the file, not the stored URL', async () => {
    const wrapper = await mountPanel()
    await wrapper.get('button[title="Edit"]').trigger('click')
    await settle()
    // The edit form's own file input is the one that is open; the replacement
    // becomes that row's outgoing file. Commit the form, as the user does.
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
