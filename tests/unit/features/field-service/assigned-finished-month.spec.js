import { beforeEach, describe, expect, test, vi } from 'vitest'

import AssignedFinished from '@/views/mobile/AssignedFinished.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * The month window of the assigned-finished list, characterised against the
 * LEGACY screen before it moves into
 * `src/features/field-service/dispatch/`.
 *
 * **Split out of `assigned-finished.spec.js` on purpose.** The month arrows
 * add `month` and `year` to the request, and the endpoint demonstrably reads
 * them — `finished_list` filters `order__start_date__year` / `__month` from
 * `request.GET` (my24service `apps/mobile/views.py:251-259`) — but
 * openapi/schema.yaml declares neither, so the strict seam refuses them and
 * every assertion here would fail for a reason that is not the screen's. The
 * rest of the screen, which the seam can judge, is in the sibling spec.
 *
 * The fix is the backend's: declare the two parameters, regenerate, and this
 * file folds back into the seam spec.
 */

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

const ENDPOINT = '/api/mobile/assignedorder/finished_list/'

beforeEach(() => {
  vi.useFakeTimers({toFake: ['Date']})
  vi.setSystemTime(new Date(2026, 8, 16, 9, 0, 0))
  resetFakeHttp(fakeHttp, {[ENDPOINT]: {count: 0, results: []}})
})

afterEach(() => {
  vi.useRealTimers()
})

function mount() {
  return mountForm(AssignedFinished, {
    deep: true,
    main: {getCurrentLanguage: 'nl'},
  })
}

const reads = () => requestShapes(fakeHttp, {method: 'get'}).filter((shape) => shape.path === ENDPOINT)

describe('AssignedFinished - the month window', () => {
  test('opens on the current month without naming it', async () => {
    const wrapper = mount()
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())

    expect(reads()[0]).toEqual({method: 'get', path: ENDPOINT, query: {page: '1'}, body: undefined})
    // The Dutch abbreviation, because the screen sets moment's locale from the
    // tenant's language before it formats anything.
    expect(wrapper.vm.monthText).toBe('sep.')
    expect(wrapper.vm.year).toBe(2026)

    wrapper.unmount()
  })

  test('a month forwards asks for that month and year', async () => {
    const wrapper = mount()
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())

    wrapper.vm.nextMonth()
    await vi.waitFor(() => expect(reads()).toHaveLength(2))

    expect(reads()[1]).toEqual({
      method: 'get',
      path: ENDPOINT,
      query: {page: '1', month: '10', year: '2026'},
      body: undefined,
    })

    wrapper.unmount()
  })

  test('a month back asks for the previous one', async () => {
    const wrapper = mount()
    await vi.waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())

    wrapper.vm.backMonth()
    await vi.waitFor(() => expect(reads()).toHaveLength(2))

    expect(reads()[1].query).toEqual({page: '1', month: '8', year: '2026'})

    wrapper.unmount()
  })
})
