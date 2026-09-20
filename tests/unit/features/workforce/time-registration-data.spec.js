import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import moment from 'moment'
import { vResultResponse } from '@/api/valibot.gen'
import TimeRegistrationData from '@/views/company/time-registration/TimeRegistrationData.vue'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toastCreate } from '../../support/form-harness.js'
import { modal } from '../../support/modal.js'
import { workforceRoutes } from '../../support/workforce-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({ create: toastCreate }),
}))

const api = installApiSeam()
const correction = '/api/company/time-registration/time-correction/{id}/'

moment.locale('nl')
const WEEK_START = moment().weekday(0)
const DATES = Array.from({length: 7}, (_, index) => WEEK_START.clone().add(index, 'days').format('YYYY-MM-DD'))

/** The endpoint's hand-built detail dict - see the note in time-registration.spec.js. */
function detailPayload(overrides = {}) {
  return {
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
        user_work_total: '8:00',
        user_interval_work_total: '8:00',
        interval: 1,
        work_total: {total: '8:00', interval_total: '8:00'},
      },
    ],
    workhour_data: [
      {
        id: 12,
        source: 'company',
        date: '02-02-2026',
        work_start: '08:00',
        work_end: '16:00',
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
  }
}

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.patch(correction, fixtureFor(vResultResponse, {result: true}))
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountData() {
  const wrapper = mountForm(TimeRegistrationData, {
    deep: true,
    props: {user_id: 42},
    routes: workforceRoutes,
    auth: {isPlanning: true},
  })
  await wrapper.vm.processData(detailPayload())
  await wrapper.vm.$nextTick()
  return wrapper
}

describe('TimeRegistrationData', () => {
  test('the correction button opens the modal for its row', async () => {
    const wrapper = await mountData()

    await wrapper.get('#workhours-table tbody button').trigger('click')
    await settle()

    expect(modal('time-correction-modal').isOpen()).toBe(true)
  })

  // CHARACTERISATION OF A DEFECT: the input carries `@xxchange` and `@update`
  // handlers, neither of which `BFormInput` emits, so typing a correction never
  // re-parses it. The preview under the input stays empty and the value sent is
  // the one parsed when the modal opened. Pinned as it stands; the conversion
  // wires the picker to the parse and these expectations flip.
  test('typing a correction does not update the preview', async () => {
    const wrapper = await mountData()

    await wrapper.get('#workhours-table tbody button').trigger('click')
    await settle()
    modal('time-correction-modal').type('-02:30')
    await settle()

    expect(wrapper.text()).not.toContain('Subtract 2:30')
  })

  test('confirming patches the value parsed when the modal opened, not the typed one', async () => {
    const wrapper = await mountData()

    await wrapper.get('#workhours-table tbody button').trigger('click')
    await settle()
    modal('time-correction-modal').type('-02:00')
    await settle()
    modal('time-correction-modal').ok()
    await settle()

    expect(api.requests().filter((request) => request.method === 'patch')).toEqual([
      {
        method: 'patch',
        path: '/api/company/time-registration/time-correction/12/',
        query: {},
        body: {
          source: 'company',
          work_correction: '0:00',
          work_correction_by_user: 42,
          notify_engineer: false,
        },
      },
    ])
  })

  // CHARACTERISATION OF A DEFECT: the guard compares the re-parsed value
  // against the stored one as strings, and `'00:00'` re-parses to `'0:00'`, so
  // they never match and confirming an untouched modal writes a correction.
  test('an untouched correction is sent anyway', async () => {
    const wrapper = await mountData()

    await wrapper.get('#workhours-table tbody button').trigger('click')
    await settle()
    modal('time-correction-modal').ok()
    await settle()

    expect(api.requests().filter((request) => request.method === 'patch')).toHaveLength(1)
  })
})
