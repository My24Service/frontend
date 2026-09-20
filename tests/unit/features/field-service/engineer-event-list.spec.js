import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import EngineerEventList from '@/features/field-service/engineer-event/EngineerEventList.vue'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { vEngineer, vEngineerEvent } from '@/api/valibot.gen'
import my24 from '@/services/my24'

import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts, toastCreate } from '../../support/form-harness.js'
import { fieldServiceRoutes } from '../../support/field-service-routes.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({create: toastCreate}),
}))

// The list subscribes to the member websocket while mounted; under test it must
// neither fetch a room nor connect. The registered handler is kept so a test
// can deliver the engineer-event message through it.
const socket = vi.hoisted(() => ({handlers: {}, removed: []}))
vi.mock('@/services/websocket/MemberNewDataSocket', () => ({
  default: class {
    async init() {}
    setOnmessageHandler(fn) { socket.handlers.event = fn }
    removeOnmessageHandler() { socket.removed.push('event') }
    getSocket() {}
    removeSocket() {}
  },
}))

/**
 * Characterisation of the engineer-event list, written against the LEGACY
 * screen before it moves into `src/features/field-service/engineer-event/`.
 *
 * Four things this pins, each of which the conversion has to answer for:
 *
 *  - the read is the page and nothing else. The endpoint is a plain
 *    `ListCreateAPIView` on DRF's own `PageNumberPagination` — its
 *    `page_size_query_param` is unset, which is why openapi/schema.yaml
 *    declares `page` alone — so the seam refuses a `page_size`.
 *  - a row that carries a "last event duration" does not render at all.
 *    `componentMixin.displayDurationFromSeconds` (src/mixins/common.js:100)
 *    calls `moment` without importing it, so the cell throws during render and
 *    takes the table with it. `moment` is not a global anywhere in this
 *    application. The two tests below are the pair: with the duration absent
 *    the rows render, with it present they do not.
 *  - the engineer pills row is rendered only when the tenant's company code is
 *    `grm`. AGENTS.md forbids that branch and the conversion removes it; the
 *    spec pins it so the commit that does so carries a test that saw it.
 *  - the row's delete is back. The legacy action threw before it opened
 *    anything (`showDeleteModal` reached for `delete-event-type-modal` while
 *    this template's modal was `delete-event-modal`), and the endpoint had no
 *    detail route to call either. `/api/company/engineerevent/{id}/` (DELETE)
 *    exists now, and the shell's `deleteModal` owns the confirmation.
 */
const api = installApiSeam()

const ENDPOINT = '/api/company/engineerevent/'

/**
 * The tenant the pills row reads.
 *
 * Seeded as `state`, not as getters: a fresh testing pinia runs the real
 * getters, and `getMemberCompanycode`/`getMemberHasBranches` dereference
 * `state.memberInfo`, which is null until something puts a tenant there.
 */
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

function row(overrides = {}) {
  return fixtureFor(vEngineerEvent, {
    id: 11,
    engineer_name: 'Jan Jansen',
    user_id: 5,
    event_dts: '2026-09-14T08:00:00Z',
    event_type: 'door open',
    measure_last_event_type: 'measure',
    secs_since_last_measure_event_type: null,
    last_measure_event: 9,
    assigned_order: null,
    ...overrides,
  })
}

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  socket.handlers = {}
  socket.removed = []
  api.get(ENDPOINT, () => paginated([row()], {count: 1}))
  // The attach-order modal reads the engineer the event belongs to as it opens.
  api.get('/api/company/engineer/{id}/', () => fixtureFor(vEngineer, {id: 5}))
  api.delete('/api/company/engineerevent/{id}/', noContent)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function mountList({companycode = 'acme'} = {}) {
  const wrapper = mountForm(EngineerEventList, {
    deep: true,
    routes: fieldServiceRoutes,
    main: tenantOf(companycode),
  })
  await settle()
  return wrapper
}

const reads = () => api.requests().filter((request) => request.path === ENDPOINT)

describe('EngineerEventList', () => {
  test('opens on page one, and asks for nothing else', async () => {
    await mountList()

    expect(reads()).toEqual([
      {method: 'get', path: ENDPOINT, query: {page: '1'}},
    ])
  })

  test('renders the event of its row', async () => {
    const wrapper = await mountList()

    expect(wrapper.text()).toContain('Jan Jansen')
  })

  test('the duration cell reads the seconds as H:mm:ss', async () => {
    // REGRESSION. The legacy cell threw: the mixin's formatter calls moment
    // without importing it, so the column was always empty. See the header.
    api.get(ENDPOINT, () => paginated([row({secs_since_last_measure_event_type: 3661})], {count: 1}))
    const wrapper = await mountList()

    expect(wrapper.text()).toContain('Jan Jansen')
    expect(wrapper.text()).toContain('1:01:01')
  })

  test('the engineer pills are rendered for every tenant', async () => {
    // The legacy row was hidden unless the tenant's companycode was 'grm'; the
    // Slice README's ledger records the removal.
    for (const companycode of ['acme', 'grm']) {
      const wrapper = await mountList({companycode})

      const pills = wrapper.get('.pills-small')
      expect(pills.text()).toContain('List')
      expect(pills.text()).toContain('Events')
      expect(pills.text()).toContain('Event types')
    }
  })

  test('a load failure tells the user', async () => {
    api.get(ENDPOINT, serverError)
    await mountList()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading events')
  })

  test('the export downloads the whole event list', async () => {
    const download = vi.spyOn(Object.getPrototypeOf(my24), 'downloadItem').mockImplementation(() => {})
    vi.stubGlobal('confirm', () => true)
    const wrapper = await mountList()

    wrapper.vm.downloadList()

    expect(download).toHaveBeenCalledWith('/company/events-export-xls/', 'events.xlsx')
    download.mockRestore()
  })

  test('delete confirms, sends the row id and refetches', async () => {
    // REGRESSION. The legacy action threw before it opened anything - it wrote
    // a property the component never declared and reached for
    // `delete-event-type-modal` - and the view had no detail route to call.
    // The endpoint has one now, and the shell's modal owns the confirmation.
    const wrapper = await mountList()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)

    modal('delete-event-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'delete').path)
      .toBe('/api/company/engineerevent/11/')
    expect(reads()).toHaveLength(2)
    expect(toasts().map((toast) => toast.body)).toContain('Event has been deleted')
  })

  test('a row with no assigned order opens the attach-order modal', async () => {
    const wrapper = await mountList()

    const button = wrapper.findAll('button').find((candidate) => candidate.text().includes('No order, create one'))
    expect(button).toBeDefined()
    await button.trigger('click')
    await settle()

    expect(document.getElementById('attach-order-modal')).not.toBe(null)
    expect(api.requests().at(-1)).toMatchObject({method: 'get', path: '/api/company/engineer/5/'})
  })

  test('a websocket message reloads the list', async () => {
    await mountList()
    const before = reads().length

    socket.handlers.event({type: 'engineer-event'})
    await settle()

    expect(reads().length).toBe(before + 1)
  })
})
