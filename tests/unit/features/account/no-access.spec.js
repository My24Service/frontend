import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import { NoAccessView as NoAccess } from '@/features/account'
import LoginForm from '@/components/LoginForm.vue'

import { mountForm, resetFakeHttp, toastCreate } from '../../support/form-harness.js'

/**
 * Behaviour characterisation for the access gate (src/features/account/NoAccessView.vue).
 *
 * Seams under test: the isLoggedIn branch. Logged in shows the no-access
 * copy. Logged out shows the login form (whose forgot-password link points at
 * the reset-password route). The refactor moves this view into
 * `src/features/account/` unchanged apart from the composition API.
 */

enableAutoUnmount(afterEach)

const fakeHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/services/api', () => ({ default: fakeHttp, normalClient: fakeHttp }))

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

async function flush() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

beforeEach(() => {
  resetFakeHttp(fakeHttp)
  toastCreate.mockClear()
})

describe('NoAccess view', () => {
  test('logged in explains the missing permission', async () => {
    const wrapper = mountForm(NoAccess, { deep: true, auth: { isLoggedIn: true } })
    await flush()

    expect(wrapper.text()).toContain('No access')
    expect(wrapper.findComponent(LoginForm).exists()).toBe(false)
  })

  test('logged out shows the login form', async () => {
    const wrapper = mountForm(NoAccess, { deep: true, auth: { isLoggedIn: false } })
    await flush()

    expect(wrapper.findComponent(LoginForm).exists()).toBe(true)
  })

  test('the login form offers the forgot-password route', async () => {
    const wrapper = mountForm(NoAccess, { deep: true, auth: { isLoggedIn: false } })
    await flush()

    expect(wrapper.text()).toContain('Forgot password?')
  })
})
