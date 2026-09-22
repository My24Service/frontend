import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import moment from 'moment'
import { vResultResponse, vTimeRegistrationListResponse } from '@/api/valibot.gen'
import { TimeRegistration } from '@/features/workforce'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { workforceRoutes } from '../../support/workforce-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({ create: toastCreate }),
}))

const api = installApiSeam()
const endpoint = '/api/company/time-registration/'
const correction = '/api/company/time-registration/time-correction/{id}/'
const TENANT = {memberInfo: {companycode: 'acme'}}

moment.locale('nl')
const WEEK_START = moment().weekday(0)
const DATES = Array.from({length: 7}, (_, index) => WEEK_START.clone().add(index, 'days').format('YYYY-MM-DD'))

/** The endpoint's detail answer - see the note in time-registration.spec.js. */
function detailPayload(overrides = {}) {
  return fixtureFor(vTimeRegistrationListResponse, {
    full_name: 'Jan Jansen',
    totals_fields: ['work_total'],
    date_list: DATES,
    intervals: [1, 2, 3, 4, 5, 6, 7],
    totals: [
      {
        bucket: `${DATES[0]}T00:00:00Z`,
        full_name: 'Jan Jansen',
        user_id: 42,
        contract_hours_week: 40,
        interval: 1,
        work_total: {total: '8:00', interval_total: '8:00'},
      },
    ],
    workhour_data: [
      {
        id: 12,
        source: 'company',
        date: '02-02-2026',
        work_start: '08:00:00',
        work_end: '16:00:00',
        work_correction: '00:00',
        travel_to: '00:00:00',
        travel_back: '00:00:00',
        distance_to: 0,
        distance_back: 0,
        project: 'Project X',
        description: '#123',
      },
    ],
    leave_data: [],
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)
const patches = () => api.requests().filter((request) => request.method === 'patch')

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => detailPayload())
  api.patch(correction, fixtureFor(vResultResponse, {result: true}))
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function openCorrection() {
  const wrapper = await mountListView(TimeRegistration, {
    deep: true,
    props: {user_id: 42},
    routes: workforceRoutes,
    main: TENANT,
    auth: {isPlanning: true},
  })
  await settle()

  await wrapper.get('#workhours-table tbody button').trigger('click')
  await settle()
  return wrapper
}

describe('TimeRegistration correction', () => {
  test('the button opens the modal for its row', async () => {
    await openCorrection()

    expect(modal('time-correction-modal').isOpen()).toBe(true)
  })

  // REGRESSION: the legacy input carried @xxchange and @update handlers, which
  // BFormInput does not emit, so a typed correction was never parsed - the
  // preview stayed empty and the value sent was the one the modal opened with.
  test('typing a correction updates the preview', async () => {
    await openCorrection()

    modal('time-correction-modal').type('-02:30')
    await settle()

    // The modal is teleported to the document, so it is not in the wrapper.
    expect(document.getElementById('time-correction-modal').textContent).toContain('Subtract 2:30')
  })

  test('minutes normalise into hours and minutes', async () => {
    await openCorrection()

    modal('time-correction-modal').type('90')
    await settle()

    expect(document.getElementById('time-correction-modal').textContent).toContain('Add 1:30')
  })

  test('a typed value is what rides', async () => {
    await openCorrection()

    modal('time-correction-modal').type('-02:00')
    await settle()
    modal('time-correction-modal').ok()
    await settle()

    expect(patches()).toEqual([
      {
        method: 'patch',
        path: '/api/company/time-registration/time-correction/12/',
        query: {},
        body: {
          source: 'company',
          work_correction: '-2:00',
          work_correction_by_user: 42,
          notify_engineer: false,
        },
      },
    ])
  })

  // REGRESSION: the legacy guard compared the re-parsed value against the
  // stored one as strings, and the stored "00:00" re-parses to "0:00", so the
  // two never matched and confirming an untouched modal wrote a correction.
  test('an untouched correction sends nothing', async () => {
    await openCorrection()

    modal('time-correction-modal').ok()
    await settle()

    expect(patches()).toHaveLength(0)
  })

  test('a failed correction tells the user', async () => {
    api.patch(correction, serverError)
    await openCorrection()

    modal('time-correction-modal').type('-01:00')
    await settle()
    modal('time-correction-modal').ok()
    await settle()

    expect(bodies()).toContain('Error saving the correction')
  })
})
