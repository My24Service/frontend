import { beforeEach, describe, expect, test, vi } from 'vitest'
import { vImportedRow, vImportResult } from '@/api/valibot.gen'
import ImportPreview from '@/features/company/import/ImportPreview.vue'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: spy } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: spy }) }
})

const api = installApiSeam()

const PREVIEW_PATH = '/api/company/import/18/preview/'
const DO_PATH = '/api/company/import/18/do/'

function customerRow(overrides = {}) {
  return fixtureFor(vImportedRow, {
    id: 101,
    name: 'Acme BV',
    import_created: true,
    address: 'Voorstraat 1',
    postal: '9711 AA',
    city: 'Groningen',
    country_code: 'NL',
    tel: '050-1234567',
    ...overrides,
  })
}

const PREVIEW = fixtureFor(vImportResult, {
  customers: {
    errors: [],
    import: [customerRow(), customerRow({ id: 102, name: 'Beta BV', import_created: false })],
  },
})

const bodies = () => toasts().map((toast) => toast.body)

beforeEach(() => {
  api.get('/api/company/import/{id}/preview/', PREVIEW)
  api.get('/api/company/import/get_lookup_fields/', { customers: ['name', 'city'] })
  api.post('/api/company/import/{id}/do/', () => fixtureFor(vImportResult, {
    customers: { errors: [], import: [] },
  }))
})

function mountPreview(options = {}) {
  return mountForm(ImportPreview, {
    deep: true,
    props: { pk: 18, route_prefix: 'company-import' },
    main: { getMemberHasBranches: false },
    ...options,
  })
}

describe('ImportPreview', () => {
  test('renders one pill per sheet with its rows and modes', async () => {
    const wrapper = mountPreview()
    await settle()

    // Both reads fire: the preview and the lookup fields behind its labels.
    const reads = api.requests().filter((request) => request.method === 'get').map((request) => request.path)
    expect(reads).toContain('/api/company/import/18/preview/')
    expect(reads).toContain('/api/company/import/get_lookup_fields/')
    const body = wrapper.text()
    expect(body).toContain('2 entries')
    expect(body).toContain('Acme BV')
    expect(body).toContain('insert')
    expect(body).toContain('update')
    expect(body).toContain('name, city')
  })

  test('importing confirms, posts do and rides to the list', async () => {
    const wrapper = mountPreview()
    await settle()

    const push = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue()
    await wrapper.findAll('button').find((button) => button.text() === 'Import all').trigger('click')
    await settle()
    modal('import-all-modal').ok()
    for (let i = 0; i < 4; i++) {
      await settle()
      await wrapper.vm.$nextTick()
    }

    expect(api.requests().find((request) => request.method === 'post').path).toBe(DO_PATH)
    expect(bodies()).toContain('Data has been imported')
    expect(push).toHaveBeenCalledWith({ name: 'company-import-list' })
  })

  test('a failed import keeps the preview and reports it', async () => {
    api.post('/api/company/import/{id}/do/', serverError)
    const wrapper = mountPreview()
    await settle()

    await wrapper.findAll('button').find((button) => button.text() === 'Import all').trigger('click')
    await settle()
    modal('import-all-modal').ok()
    for (let i = 0; i < 4; i++) {
      await settle()
      await wrapper.vm.$nextTick()
    }

    expect(bodies()).toContain('Error importing data')
    expect(wrapper.text()).toContain('Acme BV')
  })

  test('cancelling the import sends no mutation', async () => {
    const wrapper = mountPreview()
    await settle()

    await wrapper.findAll('button').find((button) => button.text() === 'Import all').trigger('click')
    await settle()
    modal('import-all-modal').cancel()
    for (let i = 0; i < 4; i++) {
      await settle()
      await wrapper.vm.$nextTick()
    }

    expect(api.requests().filter((request) => request.method === 'post')).toHaveLength(0)
  })

  test('cancel rides to the list without importing', async () => {
    const wrapper = mountPreview()
    await settle()

    const push = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue()
    await wrapper.findAll('button').find((button) => button.text() === 'Cancel').trigger('click')
    await settle()

    expect(api.requests().filter((request) => request.method === 'post')).toHaveLength(0)
    expect(push).toHaveBeenCalledWith({ name: 'company-import-list' })
  })

  test('a failed preview read tells the user', async () => {
    api.get('/api/company/import/{id}/preview/', serverError)
    mountPreview()
    await settle()

    expect(bodies()).toContain('Error loading import preview')
  })
})
