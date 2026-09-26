import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { vLeaveType } from '@/api/valibot.gen'
import { LeaveTypes } from '@/features/workforce'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { workforceRoutes } from '../../support/workforce-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({ create: toastCreate }),
}))

const api = installApiSeam()
const endpoint = '/api/company/leave-type/'
const modalId = 'add-edit-leave-type-modal'

function leaveType(overrides = {}) {
  return fixtureFor(vLeaveType, {
    id: 5,
    name: 'Vakantie',
    counts_as_leave: true,
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)
const lists = () => api.requests().filter((request) => request.method === 'get' && request.path === endpoint)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => paginated([leaveType()], { count: 4 }))
  // The edit modal reads the record it edits, as every resource form does.
  api.get(endpoint + '{id}/', () => leaveType())
  api.post(endpoint, fixtureFor(vLeaveType, { id: 6, name: 'Ziekte' }))
  api.patch(endpoint + '{id}/', fixtureFor(vLeaveType))
  api.delete(endpoint + '{id}/', noContent)
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountTypes(options = {}) {
  return mountListView(LeaveTypes, { deep: true, routes: workforceRoutes, ...options })
}

/** Open the add/edit modal from the header button and type a name into it. */
async function openForm(wrapper, name) {
  await wrapper.findAll('button').find((button) => button.text().includes('Add leave types')).trigger('click')
  await settle()
  modal(modalId).typeInto('#name', name)
}

describe('LeaveTypes', () => {
  test('loads page one and renders the name column', async () => {
    const wrapper = await mountTypes()
    await settle()

    expect(lists()[0]).toMatchObject({ path: endpoint, query: { page: '1' } })
    expect(wrapper.get('tbody').text()).toContain('Vakantie')
    expect(wrapper.get('h3').text()).toContain('Leave Types')
  })

  test('a load failure tells the user', async () => {
    api.get(endpoint, serverError)
    await mountTypes()
    await settle()

    expect(bodies()).toContain('Error loading leave types')
  })
})

describe('LeaveTypes create', () => {
  test('the modal opens on Create and posts what was typed', async () => {
    const wrapper = await mountTypes()
    await settle()

    await openForm(wrapper, 'Ziekte')
    expect(modal(modalId).isOpen()).toBe(true)

    modal(modalId).ok()
    await settle()

    expect(api.requests().filter((request) => request.method === 'post')).toEqual([
      { method: 'post', path: endpoint, query: {}, body: { name: 'Ziekte', counts_as_leave: true } },
    ])
    expect(bodies()).toContain('Leave type has been created')
  })

  test('a blank name blocks the submit', async () => {
    const wrapper = await mountTypes()
    await settle()

    await openForm(wrapper, '')
    modal(modalId).ok()
    await settle()

    expect(api.requests().filter((request) => request.method === 'post')).toHaveLength(0)
    expect(globalThis.document.body.textContent).toContain('Please enter a leave type name')
  })
})

describe('LeaveTypes edit', () => {
  test('the pencil opens the modal on Update and patches the row', async () => {
    const wrapper = await mountTypes()
    await settle()

    await wrapper.get('tbody .edit-icon').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.path === endpoint + '5/')).toHaveLength(1)
    modal(modalId).typeInto('#name', 'Vakantie 2026')
    modal(modalId).ok()
    await settle()

    // The legacy edit body carried the whole record back, `id` included; the
    // parse sends only what the endpoint declares.
    expect(api.requests().filter((request) => request.method === 'patch')).toEqual([
      {
        method: 'patch',
        path: endpoint + '5/',
        query: {},
        body: { name: 'Vakantie 2026', counts_as_leave: true },
      },
    ])
    expect(bodies()).toContain('Leave type has been updated')
  })

  // REGRESSION: the legacy handler hid the modal through `this.$bvModal`, a
  // global this application does not install, so the throw skipped both the
  // hide and the reload that followed it. Fails against the legacy screen.
  test('a successful save closes the modal and refetches the list', async () => {
    const wrapper = await mountTypes()
    await settle()

    await openForm(wrapper, 'Ziekte')
    modal(modalId).ok()
    await settle()

    expect(modal(modalId).isOpen()).toBe(false)
    expect(lists()).toHaveLength(2)
  })
  // The modal is one form instance serving one open after another: a cancelled
  // edit must not linger into the next open of the same row (whose record is
  // cached, so nothing refetches to overwrite it), nor into a create.
  test('reopening shows the record again, and a create after an edit starts blank', async () => {
    const wrapper = await mountTypes()
    await settle()
    const name = () => document.querySelector(`#${modalId} #name`).value

    await wrapper.get('tbody .edit-icon').trigger('click')
    await settle()
    modal(modalId).typeInto('#name', 'Half typed')
    await settle()
    modal(modalId).cancel()
    await settle()

    await wrapper.get('tbody .edit-icon').trigger('click')
    await settle()
    expect(name()).toBe('Vakantie')

    modal(modalId).cancel()
    await settle()
    await wrapper.findAll('button').find((button) => button.text().includes('Add leave types')).trigger('click')
    await settle()
    expect(name()).toBe('')
  })
})

describe('LeaveTypes delete', () => {
  test('delete confirms, sends the row id and refetches', async () => {
    const wrapper = await mountTypes()
    await settle()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-leave-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'delete').path).toBe(endpoint + '5/')
    expect(bodies()).toContain('Leave type has been deleted')
    expect(lists()).toHaveLength(2)
  })

  test('a failed delete reports it', async () => {
    api.delete(endpoint + '{id}/', serverError)
    const wrapper = await mountTypes()
    await settle()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-leave-modal').ok()
    await settle()

    expect(bodies()).toContain('Error deleting leave type')
  })
})
