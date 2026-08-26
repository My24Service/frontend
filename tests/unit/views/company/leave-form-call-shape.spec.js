import { beforeEach, describe, expect, test, vi } from 'vitest'

import LeaveForm from '@/views/company/time-registration/LeaveForm.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

const fakeHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/services/api', () => ({ default: fakeHttp, normalClient: fakeHttp }))

vi.mock('@/api/client.gen', async () => {
  const { apiClientMock } = await import('../../support/api-client-mock.js')
  return apiClientMock(fakeHttp)
})

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

// Call-shape characterisation for the single migrated call in LeaveForm:
// loadTotals() used to go through UserLeaveHoursService.getTotals(data), which
// POSTed `${this.url}get_totals/` (i.e. /company/user-leave-hours/admin/get_totals/)
// with `this.preInsert(data)` as the body; it now calls the generated
// companyUserLeaveHoursAdminGetTotalsCreate({ body: data, throwOnError: true }).
//
// The BaseModel CRUD calls (insert/update/detail on leaveHoursService, list on
// leaveTypeService, search on userListService) were not part of the migration
// and are out of scope here.

beforeEach(() => {
  resetFakeHttp(fakeHttp, {
    // The leave-types dropdown list that created() fires on mount. The only
    // other mount-time traffic is the get_totals POST pinned below.
    '/company/leave-type/': { results: [] },
  })
})

describe('LeaveForm loadTotals', () => {
  test('posts the leave object to the get_totals action', async () => {
    fakeHttp.post.mockResolvedValue({ data: { result: { total_hours: 2, total_minutes: 30 } } })

    const wrapper = mountForm(LeaveForm)
    await vi.waitFor(() => expect(wrapper.vm.isLoading).toBe(false))

    // The create-flow call that fires from created(): the freshly built leave,
    // which has no created/modified keys, so the old preInsert() was a no-op
    // and old and new bodies agree.
    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([
      {
        method: 'post',
        path: '/api/company/user-leave-hours/admin/get_totals/',
        query: {},
        body: expect.objectContaining({
          user: '',
          leave_type: '',
          start_date_is_whole_day: true,
          end_date_is_whole_day: true,
        }),
      },
    ])

    fakeHttp.post.mockClear()

    // REGRESSION WATCH: the old service wrapped the payload in
    // this.preInsert(data), which deleted `created`/`modified` from the object
    // (mutating it in place) before posting. The generated op forwards the
    // body untouched, so after an edit load (`leave = await detail()` returns
    // the server object with those fields) they now survive into the totals
    // request. This pins the NEW behaviour.
    const leave = {
      user: 5,
      leave_type: 3,
      start_date: '2024-01-01',
      end_date: '2024-01-02',
      created: '2024-01-01T10:00:00Z',
      modified: '2024-01-02T10:00:00Z',
    }
    await wrapper.vm.loadTotals(leave)

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([
      {
        method: 'post',
        path: '/api/company/user-leave-hours/admin/get_totals/',
        query: {},
        body: leave,
      },
    ])
  })
})
