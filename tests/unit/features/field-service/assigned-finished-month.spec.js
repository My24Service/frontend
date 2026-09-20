import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import AssignedFinished from '@/features/field-service/dispatch/AssignedFinished.vue'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'
import { paginated } from '../../helpers/schema-fixture.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

/**
 * The month window of the assigned-finished list.
 *
 * The arrows add `month` and `year` to the request; both are declared
 * parameters of `assignedorder/finished_list/`, `month` an integer the screen
 * now sends as a number rather than as moment's `format('M')` text. The strict
 * seam is what holds that: it refuses an undeclared query parameter and the
 * generated client validates the request against the operation's own component
 * before it builds the URL.
 *
 * Kept as its own file rather than folded into `assigned-finished.spec.js`,
 * which pins what the list renders and what its first load asks for; this one
 * pins the navigator.
 */
const api = installApiSeam()

const ENDPOINT = '/api/mobile/assignedorder/finished_list/'

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  vi.useFakeTimers({toFake: ['Date']})
  vi.setSystemTime(new Date(2026, 8, 16, 9, 0, 0))
  api.get(ENDPOINT, () => paginated([], {count: 0}))
})

afterEach(() => {
  vi.useRealTimers()
  window.history.replaceState(null, '', '/')
})

async function mount() {
  const wrapper = mountForm(AssignedFinished, {
    deep: true,
    main: {getCurrentLanguage: 'nl', getOrderListMustIncludeReference: false},
  })
  await settle()
  return wrapper
}

const reads = () => api.requests().filter((request) => request.path === ENDPOINT)

describe('AssignedFinished - the month window', () => {
  test('opens on the current month without naming it', async () => {
    const wrapper = await mount()

    // `page_size` comes from the table kit and is the API's own default of 20,
    // so the response is the same page the legacy request asked for.
    expect(reads()[0]).toEqual({method: 'get', path: ENDPOINT, query: {page: '1', page_size: '20'}})
    // The Dutch abbreviation, because the screen sets moment's locale from the
    // tenant's language before it formats anything.
    expect(wrapper.vm.monthText).toBe('sep.')
    expect(wrapper.vm.year).toBe(2026)

    wrapper.unmount()
  })

  test('a month forwards asks for that month and year', async () => {
    const wrapper = await mount()

    wrapper.vm.nextMonth()
    await settle()

    expect(reads()).toHaveLength(2)
    expect(reads()[1]).toEqual({
      method: 'get',
      path: ENDPOINT,
      query: {page: '1', page_size: '20', month: '10', year: '2026'},
    })

    wrapper.unmount()
  })

  test('a month back asks for the previous one', async () => {
    const wrapper = await mount()

    wrapper.vm.backMonth()
    await settle()

    expect(reads()).toHaveLength(2)
    expect(reads()[1].query).toEqual({page: '1', page_size: '20', month: '8', year: '2026'})

    wrapper.unmount()
  })
})
