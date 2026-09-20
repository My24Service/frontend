import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import moment from 'moment'
import { vLeaveHoursTotals, vLeaveType, vUserLeaveHours, vUserSelectRow } from '@/api/valibot.gen'
import LeaveForm from '@/features/workforce/leave/LeaveForm.vue'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { workforceRoutes } from '../../support/workforce-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({ create: toastCreate }),
}))

const api = installApiSeam()
const resource = '/api/company/user-leave-hours/admin/'
const leaveTypes = '/api/company/leave-type/'

// The form seeds its window from `moment()` at mount, so the expectation is
// built the same way rather than frozen to the day the spec was written.
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

function leaveType(overrides = {}) {
  return fixtureFor(vLeaveType, {id: 3, name: 'Vakantie', counts_as_leave: true, ...overrides})
}

function leaveRecord(overrides = {}) {
  return fixtureFor(vUserLeaveHours, {
    id: 5,
    user: 7,
    username: 'jjansen',
    full_name: 'Jan Jansen',
    start_date: '01-02-2026',
    start_date_iso: '2026-02-01',
    start_date_hours: 9,
    start_date_minutes: 0,
    end_date: '02-02-2026',
    end_date_iso: '2026-02-02',
    end_date_hours: 17,
    end_date_minutes: 30,
    start_date_is_whole_day: false,
    end_date_is_whole_day: false,
    leave_type: 3,
    leave_type_name: 'Vakantie',
    description: 'Zomervakantie',
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(leaveTypes, () => paginated([leaveType()], {count: 1}))
  api.post(resource + 'get_totals/', fixtureFor(vLeaveHoursTotals, {
    result: {total_hours: 2, total_minutes: 30},
  }))
  api.get('/api/company/user-list/', () => [
    fixtureFor(vUserSelectRow, {id: 7, name: 'Jan Jansen', email: 'jan@example.com'}),
  ])
  api.get(resource + '{id}/', leaveRecord())
  api.post(resource, leaveRecord({id: 6}))
  api.patch(resource + '{id}/', leaveRecord())
})
afterEach(() => window.history.replaceState(null, '', '/'))

function mountLeave(pk = null) {
  return mountForm(LeaveForm, {
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

describe('LeaveForm create', () => {
  test('posts the leave its window describes', async () => {
    const wrapper = mountLeave()
    await settle()

    await pickUser(wrapper)
    await wrapper.get('#leave_type').setValue('3')
    await wrapper.get('#leave_description').setValue('Zomervakantie')
    await settle()
    await submit(wrapper)
    await settle()

    expect(api.requests()).toEqual([
      // The leave-type picker asks for the whole collection: a dropdown cannot
      // page, and the API's ceiling is 1000.
      {method: 'get', path: leaveTypes, query: {page: '1', page_size: '1000'}},
      // The totals probe, on mount, before anything is picked.
      {
        method: 'post',
        path: resource + 'get_totals/',
        query: {},
        body: {
          start_date: TODAY,
          end_date: TODAY,
          start_date_is_whole_day: true,
          end_date_is_whole_day: true,
        },
      },
      {method: 'get', path: '/api/company/user-list/', query: {q: 'jansen'}},
      // Picking a leave type re-probes: the legacy probe never did, so its
      // number stayed stale until a date or a time was touched.
      {
        method: 'post',
        path: resource + 'get_totals/',
        query: {},
        body: {
          start_date: TODAY,
          end_date: TODAY,
          start_date_is_whole_day: true,
          end_date_is_whole_day: true,
          leave_type: 3,
        },
      },
      {
        method: 'post',
        path: resource,
        query: {},
        body: {
          user: 7,
          leave_type: 3,
          description: 'Zomervakantie',
          start_date: TODAY,
          end_date: TODAY,
          start_date_is_whole_day: true,
          end_date_is_whole_day: true,
        },
      },
    ])
    expect(bodies()).toContain('Leave has been created')
    expect(routerGo()).toHaveBeenCalled()
    expect(wrapper.get('#total_time').element.value).toBe('2 hours 30 minutes')
  })

  test('a submit without a user or a leave type is refused', async () => {
    const wrapper = mountLeave()
    await settle()

    await submit(wrapper)
    await settle()

    expect(api.requests().filter((request) => request.method === 'post' && request.path === resource)).toHaveLength(0)
    const copy = wrapper.text()
    expect(copy).toContain('Please select a user')
    expect(copy).toContain('Please select a leave type')
  })

  test('a time rides as hours and minutes once a day is not whole', async () => {
    const wrapper = mountLeave()
    await settle()

    await wrapper.get('#leave_start_date_is_whole_day').setValue(false)
    await wrapper.get('#start_time').setValue('08:15')
    await settle()

    const probe = api.requests().filter((request) => request.path === resource + 'get_totals/').at(-1)
    expect(probe.body).toMatchObject({start_date_hours: 8, start_date_minutes: 15})
  })

  test('a malformed time blocks the submit', async () => {
    const wrapper = mountLeave()
    await settle()

    await pickUser(wrapper)
    await wrapper.get('#leave_type').setValue('3')
    await wrapper.get('#leave_start_date_is_whole_day').setValue(false)
    await wrapper.get('#start_time').setValue('25:99')
    await submit(wrapper)
    await settle()

    expect(api.requests().filter((request) => request.method === 'post' && request.path === resource)).toHaveLength(0)
    expect(wrapper.text()).toContain('Please enter a valid start time HH:mm')
  })

  test('a failed create tells the user', async () => {
    api.post(resource, serverError)
    const wrapper = mountLeave()
    await settle()

    await pickUser(wrapper)
    await wrapper.get('#leave_type').setValue('3')
    await submit(wrapper)
    await settle()

    expect(bodies()).toContain('Error creating leave')
  })
})

describe('LeaveForm edit', () => {
  test('loads the record and patches its window back', async () => {
    const wrapper = mountLeave(5)
    await settle()

    await submit(wrapper)
    await settle()

    expect(api.requests()).toEqual([
      {method: 'get', path: leaveTypes, query: {page: '1', page_size: '1000'}},
      {
        method: 'post',
        path: resource + 'get_totals/',
        query: {},
        body: {
          start_date: TODAY,
          end_date: TODAY,
          start_date_is_whole_day: true,
          end_date_is_whole_day: true,
        },
      },
      {method: 'get', path: resource + '5/', query: {}},
      // The record's own window, once it lands.
      {
        method: 'post',
        path: resource + 'get_totals/',
        query: {},
        body: {
          start_date: '2026-02-01',
          end_date: '2026-02-02',
          start_date_is_whole_day: false,
          end_date_is_whole_day: false,
          leave_type: 3,
          description: 'Zomervakantie',
          start_date_hours: 9,
          start_date_minutes: 0,
          end_date_hours: 17,
          end_date_minutes: 30,
        },
      },
      {
        method: 'patch',
        path: resource + '5/',
        query: {},
        body: {
          user: 7,
          leave_type: 3,
          description: 'Zomervakantie',
          start_date: '2026-02-01',
          end_date: '2026-02-02',
          start_date_is_whole_day: false,
          end_date_is_whole_day: false,
          start_date_hours: 9,
          start_date_minutes: 0,
          end_date_hours: 17,
          end_date_minutes: 30,
        },
      },
    ])
    expect(bodies()).toContain('Leave has been updated')
  })

  test('the loaded times read as hh:mm', async () => {
    const wrapper = mountLeave(5)
    await settle()

    expect(wrapper.get('#start_time').element.value).toBe('09:00')
    expect(wrapper.get('#end_time').element.value).toBe('17:30')
    // The user picker is a create-only field; the record's own user rides the
    // window instead.
    expect(wrapper.find('#user_name').exists()).toBe(false)
  })

  test('a failed load tells the user', async () => {
    api.get(resource + '{id}/', serverError)
    mountLeave(5)
    await settle()

    expect(bodies()).toContain('Error loading leave')
  })
})
