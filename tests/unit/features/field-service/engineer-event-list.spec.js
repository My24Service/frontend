import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { config as vtConfig } from '@vue/test-utils'

import EngineerEventList from '@/views/company/EngineerEventList.vue'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { vEngineerEvent } from '@/api/valibot.gen'
import my24 from '@/services/my24'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts, toastCreate } from '../../support/form-harness.js'
import { fieldServiceRoutes } from '../../support/field-service-routes.js'
import { serverError } from '../../support/list-harness.js'

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
 *  - the row's delete action throws. `showDeleteModal` writes a data property
 *    the component never declares and then reaches for
 *    `$refs['delete-event-type-modal']`, while the modal in this template is
 *    `delete-event-modal` — so the click raises a TypeError before the modal
 *    opens. The endpoint is no help either: `/api/company/engineerevent/` is a
 *    list-and-create view with no detail route at all (my24service
 *    `apps/user/urls.py:62-67`), so there is nothing for a delete to call.
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

  test('the duration cell renders nothing, and throws', async () => {
    // Vue's default error handler rethrows on the next tick, which vitest
    // reports as an unhandled rejection and which fails the run rather than
    // this test. The cell's error *is* what is being pinned here, so it is
    // caught for the length of this one test and rethrown nowhere.
    const previous = vtConfig.global.config.errorHandler
    vtConfig.global.config.errorHandler = () => {}
    try {
      api.get(ENDPOINT, () => paginated([row({secs_since_last_measure_event_type: 3661})], {count: 1}))
      const wrapper = await mountList()

      expect(wrapper.text()).toContain('Jan Jansen')
      expect(wrapper.text()).not.toContain('1:01:01')
    } finally {
      vtConfig.global.config.errorHandler = previous
    }
  })

  test('the engineer pills are hidden for a tenant that is not grm', async () => {
    const wrapper = await mountList({companycode: 'acme'})

    expect(wrapper.find('.pills-small').exists()).toBe(false)
  })

  test('the engineer pills are rendered for grm', async () => {
    const wrapper = await mountList({companycode: 'grm'})

    const pills = wrapper.get('.pills-small')
    expect(pills.text()).toContain('List')
    expect(pills.text()).toContain('Events')
    expect(pills.text()).toContain('Event types')
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

  test('the row delete action throws before it can open a modal', async () => {
    const wrapper = await mountList()

    // The defect the conversion deletes the action over: the ref does not exist.
    expect(() => wrapper.vm.showDeleteModal(11)).toThrow(TypeError)
    expect(api.requests().some((request) => request.method === 'delete')).toBe(false)
  })

  test('a websocket message reloads the list', async () => {
    await mountList()
    const before = reads().length

    socket.handlers.event({type: 'engineer-event'})
    await settle()

    expect(reads().length).toBe(before + 1)
  })
})
