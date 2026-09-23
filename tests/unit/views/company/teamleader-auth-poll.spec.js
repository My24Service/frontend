import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import TeamleaderSettings from '@/views/company/TeamleaderSettings.vue'
import { TeamleaderService } from '@/models/company/Teamleader'

import { mountForm } from '../../support/form-harness.js'

// After sending the user to Teamleader, the settings page re-reads its config
// every second until the tokens show up. That watch used to run forever when
// the grant never came, and kept running after the page was left.

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

let configDetail

beforeEach(() => {
  // Only the interval is faked: a faked Date stalls the harness's own timers.
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  vi.spyOn(window, 'open').mockReturnValue(null)
  vi.spyOn(TeamleaderService.prototype, 'authorize')
    .mockResolvedValue({ status: 'auth', authorization_url: 'https://teamleader.example/auth' })
  configDetail = vi.spyOn(TeamleaderService.prototype, 'configDetail')
    .mockResolvedValue({ has_tokens: false, json_data: {} })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

async function startAuthorize() {
  const wrapper = mountForm(TeamleaderSettings, {})
  await vi.waitFor(() => expect(configDetail).toHaveBeenCalled())
  configDetail.mockClear()
  await wrapper.vm.authorize()
  return wrapper
}

test('the watch stops once the tokens are there', async () => {
  const wrapper = await startAuthorize()

  await vi.advanceTimersByTimeAsync(2000)
  expect(configDetail).toHaveBeenCalledTimes(2)

  configDetail.mockResolvedValue({ has_tokens: true, json_data: {} })
  await vi.advanceTimersByTimeAsync(1000)
  await vi.advanceTimersByTimeAsync(5000)

  expect(configDetail).toHaveBeenCalledTimes(3)
  wrapper.unmount()
})

test('leaving the page stops the watch', async () => {
  const wrapper = await startAuthorize()

  await vi.advanceTimersByTimeAsync(1000)
  wrapper.unmount()
  await vi.advanceTimersByTimeAsync(5000)

  expect(configDetail).toHaveBeenCalledTimes(1)
})
