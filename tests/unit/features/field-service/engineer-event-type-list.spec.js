import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { EngineerEventTypeList } from '@/features/field-service'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { vEngineerEventType } from '@/api/valibot.gen'

import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts, toastCreate } from '../../support/form-harness.js'
import { fieldServiceRoutes } from '../../support/field-service-routes.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({create: toastCreate}),
}))

/**
 * Characterisation of the engineer-event-type list, written against the LEGACY
 * screen before it moves into `src/features/field-service/engineer-event/`.
 *
 * The wire is the page alone on the mount — the legacy `BaseModel.list` asks
 * for `page` and nothing else — and `q` once the screen's search modal has
 * been answered. The endpoint declares `page`, `page_size` and `q`, so the
 * seam judges the whole of it; the converted screen runs on the table kit,
 * which asks for the page size too.
 */
const api = installApiSeam()

const ENDPOINT = '/api/company/engineer-event-type/'

function tenantOf(companycode) {
  return {
    currentLanguage: 'nl',
    memberInfo: {
      companycode,
      has_branches: false,
      has_api_users: false,
      member_type: 'maintenance',
    },
    profile: {family: 'default', flavour: 'maintenance', modules: [], module_parts: {}},
  }
}

function type(overrides = {}) {
  return fixtureFor(vEngineerEventType, {
    id: 7,
    event_type: 'door open',
    measure_last_event_type: 'measure',
    statuscode: 3,
    statuscode_view: null,
    ...overrides,
  })
}

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(ENDPOINT, () => paginated([type()], {count: 1}))
  api.delete(ENDPOINT + '{id}/', noContent)
})

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

async function mountList({companycode = 'acme'} = {}) {
  const wrapper = mountForm(EngineerEventTypeList, {
    deep: true,
    routes: fieldServiceRoutes,
    main: tenantOf(companycode),
  })
  await settle()
  return wrapper
}

const reads = () => api.requests().filter((request) => request.method === 'get' && request.path === ENDPOINT)

describe('EngineerEventTypeList', () => {
  test('opens on page one', async () => {
    await mountList()

    expect(reads()[0].query).toEqual({page: '1', page_size: '20'})
  })

  test('renders the event type of its row, and links it to its editor', async () => {
    const wrapper = await mountList()

    expect(wrapper.text()).toContain('door open')
    expect(wrapper.find('tbody a[href="/company/engineer-users/event-types/form/7"]').exists()).toBe(true)
  })

  test('the search field commits its term to q after the debounce', async () => {
    const wrapper = await mountList()

    await wrapper.get('input[aria-label="Search event types"]').setValue('door')
    // 300 ms, the table kit's own debounce.
    await new Promise((resolve) => setTimeout(resolve, 400))

    expect(reads().at(-1).query).toMatchObject({q: 'door', page: '1'})
  })

  test('the engineer pills are rendered for every tenant', async () => {
    // The legacy row was hidden unless the tenant's companycode was 'grm'; the
    // Slice README's ledger records the removal.
    for (const companycode of ['acme', 'grm']) {
      const wrapper = await mountList({companycode})
      expect(wrapper.get('.pills-small').text()).toContain('Event types')
    }
  })

  test('a delete confirms, sends the row id and reloads the list', async () => {
    const wrapper = await mountList()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-event-type-modal').ok()
    await settle()

    expect(api.requests().filter((request) => request.method === 'delete')).toEqual([
      {method: 'delete', path: ENDPOINT + '7/', query: {}},
    ])
    expect(toasts().map((toast) => toast.body)).toContain('Event type has been deleted')
    expect(reads().length).toBe(2)
  })

  test('a load failure tells the user', async () => {
    api.get(ENDPOINT, serverError)
    await mountList()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading event types')
  })
})
