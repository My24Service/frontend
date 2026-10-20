import { beforeEach, describe, expect, test } from 'vitest'

import { NoAccessView as NoAccess } from '@/features/account'
import { LoginForm } from '@/features/auth'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toastCreate } from '../../support/form-harness.js'

/**
 * Behaviour characterisation for the access gate (src/features/account/NoAccessView.vue).
 *
 * Seams under test: the isLoggedIn branch. Logged in shows the no-access
 * copy. Logged out shows the login form (whose forgot-password link points at
 * the reset-password route). The refactor moves this view into
 * `src/features/account/` unchanged apart from the composition API.
 */

// On the seam with nothing stubbed: mounting either branch asks for nothing,
// and a request would fail the test.
installApiSeam()

beforeEach(() => {
  toastCreate.mockClear()
})

describe('NoAccess view', () => {
  test('logged in explains the missing permission', async () => {
    const wrapper = mountForm(NoAccess, { deep: true, auth: { isLoggedIn: true } })
    await settle()

    expect(wrapper.text()).toContain('No access')
    expect(wrapper.findComponent(LoginForm).exists()).toBe(false)
  })

  test('logged out shows the login form', async () => {
    const wrapper = mountForm(NoAccess, { deep: true, auth: { isLoggedIn: false } })
    await settle()

    expect(wrapper.findComponent(LoginForm).exists()).toBe(true)
  })

  test('the login form offers the forgot-password route', async () => {
    const wrapper = mountForm(NoAccess, { deep: true, auth: { isLoggedIn: false } })
    await settle()

    expect(wrapper.text()).toContain('Forgot password?')
  })
})
