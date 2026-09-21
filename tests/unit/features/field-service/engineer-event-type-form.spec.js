import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { EngineerEventTypeForm } from '@/features/field-service'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { vEngineerEventType, vStatuscode } from '@/api/valibot.gen'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toastCreate, toasts } from '../../support/form-harness.js'
import { fieldServiceRoutes } from '../../support/field-service-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({create: toastCreate}),
}))

/**
 * Characterisation of the engineer-event-type form, written against the LEGACY
 * screen before it moves into `src/features/field-service/engineer-event/`.
 *
 * The whole request list is pinned as a literal below. The bodies are the
 * parse's output and nothing else: `{event_type, measure_last_event_type,
 * statuscode}`, where the legacy screen posted its model's `fields` bag
 * (`{id: null, event_type}`) on a create and PATCHed the whole record back on
 * an edit — `id`, `created`, `modified`, `statuscode_view` and the three
 * counts. A blank "Measure last event type" now rides as `null` rather than as
 * a deleted key, which is what lets an edit clear it.
 *
 * The statuscode picker is the store's, not a query: `getStatuscodes` answers
 * the tenant's statuscodes as `get-initial-data` delivered them.
 */
const api = installApiSeam()

const ENDPOINT = '/api/company/engineer-event-type/'
const STATUSCODE = fixtureFor(vStatuscode, {id: 3, statuscode: 'Done'})

function type(overrides = {}) {
  return fixtureFor(vEngineerEventType, {
    id: 7,
    event_type: 'door open',
    measure_last_event_type: 'measure',
    statuscode: 3,
    statuscode_view: STATUSCODE,
    ...overrides,
  })
}

function tenant() {
  return {
    currentLanguage: 'nl',
    memberInfo: {companycode: 'acme', has_branches: false, has_api_users: false, member_type: 'maintenance'},
    profile: {family: 'default', flavour: 'maintenance', modules: [], module_parts: {}},
    statuscodes: [STATUSCODE],
  }
}

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.post(ENDPOINT, () => type())
  api.patch(ENDPOINT + '{id}/', () => type())
  api.get(ENDPOINT + '{id}/', () => type())
})

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

async function mountFormView({pk = null} = {}) {
  const wrapper = mountForm(EngineerEventTypeForm, {
    deep: true,
    routes: fieldServiceRoutes,
    props: {pk},
    main: tenant(),
  })
  await settle()
  return wrapper
}

const writes = () => api.requests().filter((request) => request.method !== 'get')

describe('EngineerEventTypeForm', () => {
  test('a create posts the type the user typed', async () => {
    const wrapper = await mountFormView()

    await wrapper.get('#event-type-event_type').setValue('door open')
    await wrapper.get('.modal-footer .btn-primary').trigger('click')
    await settle()

    expect(writes()).toEqual([
      {
        method: 'post',
        path: ENDPOINT,
        query: {},
        body: {event_type: 'door open', measure_last_event_type: null, statuscode: null},
      },
    ])
    expect(toasts().map((toast) => toast.body)).toContain('Event type has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('an empty type is refused, and nothing is sent', async () => {
    const wrapper = await mountFormView()

    await wrapper.get('.modal-footer .btn-primary').trigger('click')
    await settle()

    expect(writes()).toEqual([])
    expect(wrapper.text()).toContain('Please enter a type')
  })

  test('an edit reads the record and PATCHes it back', async () => {
    const wrapper = await mountFormView({pk: '7'})
    await settle()

    expect(api.requests()[0]).toMatchObject({method: 'get', path: ENDPOINT + '7/'})
    expect(wrapper.get('#event-type-event_type').element.value).toBe('door open')

    await wrapper.get('.modal-footer .btn-primary').trigger('click')
    await settle()

    expect(writes()[0]).toMatchObject({method: 'patch', path: ENDPOINT + '7/'})
    expect(writes()[0].body.event_type).toBe('door open')
    expect(toasts().map((toast) => toast.body)).toContain('Event type has been updated')
  })

  test('cancel goes back', async () => {
    const wrapper = await mountFormView()

    await wrapper.get('.modal-footer .btn-secondary').trigger('click')

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(writes()).toEqual([])
  })
})
