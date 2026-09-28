import { beforeEach, describe, expect, test } from 'vitest'

import { NoAccessView as NoAccess } from '@/features/account'
import { LoginForm } from '@/features/auth'

import { mountForm, resetFakeHttp, toastCreate } from '../../support/form-harness.js'
import { useFakeHttp } from '../../support/fake-http.js'

/**
 * Behaviour characterisation for the access gate (src/features/account/NoAccessView.vue).
 *
 * Seams under test: the isLoggedIn branch. Logged in shows the no-access
 * copy. Logged out shows the login form (whose forgot-password link points at
 * the reset-password route). The refactor moves this view into
 * `src/features/account/` unchanged apart from the composition API.
 */

const fakeHttp = useFakeHttp()

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
