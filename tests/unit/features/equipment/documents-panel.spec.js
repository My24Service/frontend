import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { vEquipmentDocument } from '@/api/valibot.gen'
import { DocumentsComponent } from '@/features/equipment'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({create: toastCreate}),
}))

const api = installApiSeam()
const endpoint = '/api/equipment/equipment-document/'

const bodies = () => toasts().map((toast) => toast.body)
const writes = () => api.requests().filter((request) => ['post', 'patch', 'delete'].includes(request.method))
const listRequests = () => api.requests().filter((request) => request.method === 'get' && request.path === endpoint)

function storedDocument() {
  // `file` comes back as an absolute URL: the request carries base64, the
  // response carries where the file now lives - which is what the panel keys
  // its "already on the server" check on.
  return fixtureFor(vEquipmentDocument, {
    id: 5,
    equipment: 11,
    name: 'handleiding.pdf',
    file: 'https://example.test/media/equipment/handleiding.pdf',
    url: 'https://example.test/media/equipment/handleiding.pdf',
  })
}

/** Pick a file the way the browser's picker does. */
async function chooseFile(wrapper, name = 'offerte.pdf') {
  const input = wrapper.get('input[type="file"]')
  const file = new File(['%PDF-1.4 test'], name, {type: 'application/pdf'})
  Object.defineProperty(input.element, 'files', {value: [file], configurable: true})
  await input.trigger('change')
  await settle()
}

beforeEach(() => {
  api.get(endpoint, () => paginated([storedDocument()]))
  api.post(endpoint, ({body}) => fixtureFor(vEquipmentDocument, {id: 6, ...body}))
  api.patch(endpoint + '{id}/', ({body}) => fixtureFor(vEquipmentDocument, {id: 5, ...body}))
  api.delete(endpoint + '{id}/', noContent)
})
afterEach(() => window.history.replaceState(null, '', '/'))

describe('DocumentsComponent on a detail page', () => {
  test('is read-only: the file and nothing that could change it', async () => {
    const wrapper = mountForm(DocumentsComponent, {
      deep: true,
      props: {kind: "equipment", equipment: {id: 11}, isView: true},
    })
    await settle()

    expect(listRequests()[0].query).toMatchObject({equipment: '11'})
    expect(wrapper.text()).toContain('handleiding.pdf')
    expect(wrapper.get('a').attributes('href')).toBe('https://example.test/media/equipment/handleiding.pdf')
    expect(wrapper.find('button[title="Edit"]').exists()).toBe(false)
    expect(wrapper.find('button[title="Delete"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Save changes')
    expect(wrapper.find('input[type="file"]').exists()).toBe(false)
  })

  test('an empty collection says so', async () => {
    api.get(endpoint, () => paginated([]))
    const wrapper = mountForm(DocumentsComponent, {
      deep: true,
      props: {kind: "equipment", equipment: {id: 11}, isView: true},
    })
    await settle()

    expect(wrapper.text()).toContain('No documents')
  })

  test('a load failure tells the user', async () => {
    api.get(endpoint, serverError)
    mountForm(DocumentsComponent, {deep: true, props: {kind: "equipment", equipment: {id: 11}, isView: true}})
    await settle()

    expect(bodies()).toContain('Error loading documents')
  })

  test('a staged row reaches the server on save, carrying its parent', async () => {
    // An empty collection is when the add form is offered - with rows already
    // there the panel shows the list, as the legacy one did.
    api.get(endpoint, () => paginated([]))
    const wrapper = mountForm(DocumentsComponent, {
      deep: true,
      props: {kind: "equipment", equipment: {id: 11}},
    })
    await settle()

    await chooseFile(wrapper)
    expect(wrapper.text()).toContain('offerte.pdf')

    await wrapper.get('button.btn-primary').trigger('click')
    await settle()

    const post = writes().find((request) => request.method === 'post')
    expect(post.path).toBe(endpoint)
    expect(post.body).toMatchObject({equipment: 11, name: 'offerte.pdf'})
    expect(String(post.body.file)).toContain('data:application/pdf')
    expect(bodies()).toContain('Documents have been updated')
  })
})

describe("DocumentsComponent as a form's panel", () => {
  /**
   * The handle a create form reaches across this seam.
   *
   * A form renders this panel before its own record exists, so the panel
   * mounts with no parent and reads nothing. The rows a user stages meanwhile
   * carry no parent either, which is why the parent is handed over afterwards
   * rather than at mount. This is the part of the panel that fails silently:
   * nothing exercises it until someone creates a record and attaches a file.
   */
  test('mounts without a parent, asks for nothing, and reports if asked to save', async () => {
    const wrapper = mountForm(DocumentsComponent, {
      deep: true,
      props: {kind: "equipment", equipment: {name: "New equipment"}},
    })
    await settle()

    expect(listRequests()).toHaveLength(0)
    expect(typeof wrapper.vm.parentCreated).toBe('function')
    expect(await wrapper.vm.parentCreated(7)).toEqual([])
    expect(writes()).toHaveLength(0)
  })

  test('parentCreated stamps a staged row with the new id and saves it', async () => {
    const wrapper = mountForm(DocumentsComponent, {
      deep: true,
      props: {kind: "equipment", equipment: {name: "New equipment"}},
    })
    await settle()

    // Staged while the record does not exist yet, so the row has no parent.
    await chooseFile(wrapper)

    // The form's create answered; this is the handover.
    await wrapper.vm.parentCreated(7)
    await settle()

    const post = writes().find((request) => request.method === 'post')
    expect(post.path).toBe(endpoint)
    expect(post.body).toMatchObject({equipment: 7, name: 'offerte.pdf'})
  })
})
