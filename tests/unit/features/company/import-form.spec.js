import { beforeEach, describe, expect, test, vi } from 'vitest'
import { vImport } from '@/api/valibot.gen'
import ImportForm from '@/features/company/import/ImportForm.vue'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: spy } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: spy }) }
})

const api = installApiSeam()

const IMPORT_PATH = '/api/company/import/'

const IMPORT = fixtureFor(vImport, {
  id: 18,
  name: 'customers 2026',
  file: 'https://example.com/media/customers.xlsx',
  mapping: {},
  result_inserts: {},
  created: '01-01-2026',
  modified: '02-01-2026',
})

const bodies = () => toasts().map((toast) => toast.body)
const writes = () => api.requests()
  .filter((request) => ['post', 'patch'].includes(request.method))
  .filter((request) => request.path === IMPORT_PATH || request.path === IMPORT_PATH + '18/')

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
async function chooseFile(wrapper, name = 'customers.xlsx') {
  const input = wrapper.get('input[type="file"]')
  const file = new File(['fake-xlsx-bytes'], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await drain(wrapper)
}

beforeEach(() => {
  api.get('/api/company/import/{id}/', IMPORT)
  api.get('/api/company/import/get_allowed_extensions/', ['xlsx', 'csv'])
  api.post(IMPORT_PATH, ({ body }) => fixtureFor(vImport, { id: 19, ...body }))
  api.patch('/api/company/import/{id}/', ({ body }) => fixtureFor(vImport, { id: 18, ...body }))
})

function mountImport(options = {}) {
  return mountForm(ImportForm, {
    deep: true,
    props: { pk: null, route_prefix: 'company-import' },
    ...options,
  })
}

describe('ImportForm create', () => {
  test('an empty name blocks the submit', async () => {
    const wrapper = mountImport()
    await settle()

    await chooseFile(wrapper)
    await click(wrapper, 'Submit')

    expect(wrapper.text()).toContain('Please enter a name')
    expect(writes()).toHaveLength(0)
  })

  test('a disallowed extension stages nothing', async () => {
    const wrapper = mountImport()
    await settle()

    // The endpoint lists xlsx and csv; a pdf pick is silently ignored, as
    // the legacy screen did.
    await wrapper.get('#import_name').setValue('customers 2026')
    await chooseFile(wrapper, 'customers.pdf')
    await click(wrapper, 'Submit')

    expect(wrapper.text()).toContain('Please select a file')
    expect(writes()).toHaveLength(0)
  })

  test('a filled form creates and rides to the preview', async () => {
    const wrapper = mountImport()
    await settle()

    // The form reads the endpoint's accepted extensions on mount.
    expect(api.requests().filter((request) =>
      request.method === 'get' && request.path === '/api/company/import/get_allowed_extensions/')).toHaveLength(1)

    const push = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue()
    await wrapper.get('#import_name').setValue('customers 2026')
    await chooseFile(wrapper)
    await click(wrapper, 'Submit')

    const post = writes().find((request) => request.method === 'post')
    expect(post.path).toBe(IMPORT_PATH)
    expect(post.body).toEqual({ name: 'customers 2026', file: expect.stringMatching(/^data:/) })
    expect(bodies()).toContain('Import has been created')
    expect(push).toHaveBeenCalledWith({ name: 'company-import-preview', params: { pk: 19 } })
  })

  test('an unchecked box lands on the list instead', async () => {
    const wrapper = mountImport()
    await settle()

    const push = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue()
    await wrapper.get('#import_name').setValue('customers 2026')
    await chooseFile(wrapper)
    await wrapper.get('input[type="checkbox"]').setValue(false)
    await click(wrapper, 'Submit')

    expect(push).toHaveBeenCalledWith({ name: 'company-import-list' })
  })

  test('a failed create keeps the form and reports it', async () => {
    api.post(IMPORT_PATH, serverError)
    const wrapper = mountImport()
    await settle()

    await wrapper.get('#import_name').setValue('customers 2026')
    await chooseFile(wrapper)
    await click(wrapper, 'Submit')

    expect(bodies()).toContain('Error creating import')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('ImportForm edit', () => {
  test('the record fills the name', async () => {
    const wrapper = mountImport({ props: { pk: 18, route_prefix: 'company-import' } })
    await settle()

    expect(wrapper.get('#import_name').element.value).toBe('customers 2026')
  })

  test('saving without a new file sends no file key', async () => {
    const wrapper = mountImport({ props: { pk: 18, route_prefix: 'company-import' } })
    await settle()

    const push = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue()
    await wrapper.get('#import_name').setValue('customers 2026, renamed')
    await click(wrapper, 'Submit')

    // The record's own file is a URL the write endpoint rejects; an absent
    // PATCH key leaves the stored file unchanged.
    const patch = writes().find((request) => request.method === 'patch')
    expect(patch.path).toBe(IMPORT_PATH + '18/')
    expect(patch.body).toEqual({ name: 'customers 2026, renamed' })
    expect(bodies()).toContain('Import has been updated')
    expect(push).toHaveBeenCalledWith({ name: 'company-import-preview', params: { pk: 18 } })
  })
})
