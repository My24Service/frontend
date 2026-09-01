import { beforeEach, describe, expect, test, vi } from 'vitest'

import TimeRegistrationData from '@/components/TimeRegistrationData.vue'

import { mountForm, resetFakeHttp } from '../support/form-harness.js'
import { requestShapes } from '../support/request-recorder.js'

const fakeHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/services/api', () => ({ default: fakeHttp, normalClient: fakeHttp }))

vi.mock('@/api/client.gen', async () => {
  const { apiClientMock } = await import('../support/api-client-mock.js')
  return apiClientMock(fakeHttp)
})

// Call-shape characterisation for the single migrated call in
// TimeRegistrationData. commitTimeCorrection() used to call
// TimeRegistrationService.editCorrection(pk, data), which PATCHed
// `/company/time-registration/time-correction/{pk}/` with the raw data object;
// it now calls the generated companyTimeRegistrationTimeCorrectionPartialUpdate
// with `path: { id: String(pk) }` and the identical body. Path, query and body
// agree between old and new; only the id is String()-ified on the way into the
// generated op's path (the resolved URL is unchanged).

beforeEach(() => {
  resetFakeHttp(fakeHttp)
})

describe('TimeRegistrationData.commitTimeCorrection', () => {
  test('patches the time-correction action with the correction body', async () => {
    fakeHttp.patch.mockResolvedValue({ data: { result: true } })

    const wrapper = mountForm(TimeRegistrationData, { props: { user_id: 42 } })

    wrapper.vm.timeEntry = { id: 12, source: 'manual', work_correction: '00:00' }
    wrapper.vm.timeEntryCorrection = '-02:00'
    wrapper.vm.onChangeTimeCorrection() // parses the input into timeEntryParsed
    await wrapper.vm.commitTimeCorrection()

    // Note: onChangeTimeCorrection() normalises the typed '-02:00' into
    // '-2:00' before commitTimeCorrection sends it - the body pins exactly
    // what the view passes.
    expect(requestShapes(fakeHttp, { method: 'patch' })).toEqual([
      {
        method: 'patch',
        path: '/api/company/time-registration/time-correction/12/',
        query: {},
        body: {
          source: 'manual',
          work_correction: '-2:00',
          work_correction_by_user: 42,
          notify_engineer: false,
        },
      },
    ])
  })

  test('does not patch when the parsed correction equals the stored one', async () => {
    const wrapper = mountForm(TimeRegistrationData, { props: { user_id: 42 } })

    wrapper.vm.timeEntry = { id: 12, source: 'manual', work_correction: '00:00' }
    // The guard compares the parsed value against the stored value; make them
    // literally equal so the early return fires.
    wrapper.vm.timeEntryParsed = '00:00'
    await wrapper.vm.commitTimeCorrection()

    expect(requestShapes(fakeHttp, { method: 'patch' })).toEqual([])
  })
})
