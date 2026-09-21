import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import moment from 'moment'
import { vUserSelectRow, vUserSickLeave } from '@/api/valibot.gen'
import { SickLeaveForm } from '@/features/workforce'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { workforceRoutes } from '../../support/workforce-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({ create: toastCreate }),
}))

const api = installApiSeam()
const endpoint = '/api/company/user-sick-leave/admin/'

// The form seeds the start date from `moment()` at mount.
const TODAY = moment().format('YYYY-MM-DD')

const multiselectStub = {
  props: ['options', 'modelValue'],
  emits: ['select', 'search-change'],
  template: '<div class="multiselect-stub" />',
}

const datePickerStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<div class="datepicker-stub" />',
}

function sickLeave(overrides = {}) {
  return fixtureFor(vUserSickLeave, {
    id: 5,
    user: 7,
    user_full_name: 'Jan Jansen',
    full_name: 'Jan Jansen',
    created_by_fullname: 'Petra Planners',
    created_is_confirmed: false,
    // The tenant's own date_format, which this endpoint rewrites the date into,
    // beside the ISO twin the form reads the day from.
    start_date: '01-02-2026',
    start_date_iso: '2026-02-01',
    end_date: null,
    last_status_full: 'Aangemeld',
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get('/api/company/user-list/', () => [
    fixtureFor(vUserSelectRow, {id: 7, name: 'Jan Jansen', email: 'jan@example.com'}),
  ])
  api.get(endpoint + '{id}/', sickLeave())
  api.post(endpoint, sickLeave({id: 6}))
  api.patch(endpoint + '{id}/', sickLeave())
})
afterEach(() => window.history.replaceState(null, '', '/'))

function mountSick(pk = null) {
  return mountForm(SickLeaveForm, {
    deep: true,
    props: {pk},
    routes: workforceRoutes,
    stubs: {VueMultiselect: multiselectStub, VueDatePicker: datePickerStub},
  })
}

async function pickUser(wrapper) {
  wrapper.findComponent(multiselectStub).vm.$emit('search-change', 'jansen')
  await new Promise((resolve) => setTimeout(resolve, 600))
  await settle()
  wrapper.findComponent(multiselectStub).vm.$emit('select', {id: 7, name: 'Jan Jansen'})
  await wrapper.vm.$nextTick()
}

function submit(wrapper) {
  return wrapper.findAll('button').find((button) => button.text() === 'Submit').trigger('click')
}

describe('SickLeaveForm create', () => {
  test('posts the person and the day', async () => {
    const wrapper = mountSick()
    await settle()

    await pickUser(wrapper)
    await submit(wrapper)
    await settle()

    expect(api.requests()).toEqual([
      {method: 'get', path: '/api/company/user-list/', query: {q: 'jansen'}},
      {
        method: 'post',
        path: endpoint,
        query: {},
        body: {user: 7, start_date: TODAY},
      },
    ])
    expect(bodies()).toContain('Leave has been created')
    expect(routerGo()).toHaveBeenCalled()
  })

  test('a submit without a user is refused', async () => {
    const wrapper = mountSick()
    await settle()

    await submit(wrapper)
    await settle()

    expect(api.requests().filter((request) => request.method === 'post')).toHaveLength(0)
    expect(wrapper.text()).toContain('Please select a user')
  })

  test('a failed create tells the user', async () => {
    api.post(endpoint, serverError)
    const wrapper = mountSick()
    await settle()

    await pickUser(wrapper)
    await submit(wrapper)
    await settle()

    expect(bodies()).toContain('Error creating leave')
  })
})

describe('SickLeaveForm edit', () => {
  test('loads the record and patches the day back as an iso date', async () => {
    const wrapper = mountSick(5)
    await settle()

    await submit(wrapper)
    await settle()

    expect(api.requests()).toEqual([
      {method: 'get', path: endpoint + '5/', query: {}},
      {
        method: 'patch',
        path: endpoint + '5/',
        query: {},
        // `user_full_name`, `created_by` and the status fields the legacy PATCH
        // carried are gone: the parse sends only what the endpoint declares.
        body: {user: 7, start_date: '2026-02-01'},
      },
      // The write staled every read of the resource, its own detail included:
      // the form is still mounted when it invalidates, so the record refetches
      // before the form leaves.
      {method: 'get', path: endpoint + '5/', query: {}},
    ])
    expect(bodies()).toContain('Leave has been updated')
  })

  // Before the serializer carried a `start_date_iso` twin, the form could only
  // guess the day out of the display string, and a tenant whose `date_format`
  // was not one of the guesses loaded an empty date. The twin is read instead.
  test('reads the day from the ISO twin, not the tenant display string', async () => {
    api.get(endpoint + '{id}/', sickLeave({
      start_date: '1 februari 2026',
      start_date_iso: '2026-02-01',
    }))
    const wrapper = await mountSick(5)
    await settle()

    await submit(wrapper)
    await settle()

    const patch = api.requests().find((request) => request.method === 'patch')
    expect(patch.body).toEqual({user: 7, start_date: '2026-02-01'})
  })

  test('a failed load tells the user', async () => {
    api.get(endpoint + '{id}/', serverError)
    mountSick(5)
    await settle()

    expect(bodies()).toContain('Error loading sick leave')
  })
})
