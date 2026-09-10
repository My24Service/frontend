import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import { LoginForm, useAuthStore } from '@/features/auth'

import { mountForm, resetFakeHttp, toastCreate, toasts } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Behaviour characterisation for the login form
 * (src/components/LoginForm.vue).
 *
 * Seams under test: the submit posts credentials, then runs the bootstrap
 * before anything trusts isLoggedIn, then tells the user. The redirect lives
 * one level up in TheIndex, not here. A failed login tells the user and goes
 * nowhere. Forgot-password routes into the account slice.
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

vi.mock('@/api/client.gen', async () => {
  const { apiClientMock } = await import('../../support/api-client-mock.js')
  return apiClientMock(fakeHttp)
})

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

vi.mock('vue-loading-overlay', () => ({
  useLoading: () => ({ show: () => ({ hide: vi.fn() }) }),
}))

/** Drain macrotasks so the SDK promise chain settles. */
async function flush() {
  for (let i = 0; i < 10; i++) await new Promise((resolve) => setTimeout(resolve, 0))
}

async function until(condition, { attempts = 200 } = {}) {
  for (let i = 0; i < attempts; i++) {
    if (condition()) return
    await flush()
  }
  throw new Error('condition never became true')
}

const MAIN = {
  getInitialData: vi.fn().mockResolvedValue({}),
}

function posts() {
  return requestShapes(fakeHttp, { method: 'post' })
}

beforeEach(() => {
  resetFakeHttp(fakeHttp)
  toastCreate.mockClear()
  MAIN.getInitialData.mockClear()
})

async function mountLogin() {
  const wrapper = mountForm(LoginForm, { deep: true, main: MAIN })
  await flush()
  return wrapper
}

async function submit(wrapper, username = 'jan', password = 'secret') {
  await wrapper.get('#username-input').setValue(username)
  await wrapper.get('#password-input').setValue(password)
  await wrapper.get('form').trigger('submit')
  await flush()
}

describe('LoginForm', () => {
  test('a fresh form shows empty fields with no validation state', async () => {
    const wrapper = await mountLogin()

    expect(wrapper.get('#username-input').element.value).toBe('')
    expect(wrapper.get('#password-input').element.value).toBe('')
    // Neutral until the first submit: nothing is flagged valid or invalid.
    expect(wrapper.get('#username-input').attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.get('#password-input').attributes('aria-invalid')).toBeUndefined()
  })

  test('a submit posts credentials and then runs the bootstrap', async () => {
    fakeHttp.post.mockResolvedValueOnce({ data: { token: 'jwt-abc' } })
    const wrapper = await mountLogin()
    // The harness stubs store actions. Unstub login so the wire shape is the
    // store's, not the stub's. The bootstrap stays stubbed: the ordering is
    // the contract, not the bootstrap internals.
    useAuthStore().login.mockImplementation(async (username, password) => {
      const { data } = await fakeHttp.post('/jwt-token/', { username, password, app: 'web' })
      localStorage.setItem('accessToken', data.token)
    })

    await submit(wrapper)
    await until(() => MAIN.getInitialData.mock.calls.length > 0)

    expect(posts()).toEqual([
      {
        method: 'post',
        path: '/api/jwt-token/',
        query: {},
        body: { username: 'jan', password: 'secret', app: 'web' },
      },
    ])
    expect(toasts().map((toast) => toast.body)).toContain('You are now logged in')
  })

  test('a failed login tells the user', async () => {
    const wrapper = await mountLogin()
    useAuthStore().login.mockRejectedValueOnce(new Error('boom'))

    await submit(wrapper)
    await until(() => toasts().length > 0)

    expect(toasts().map((toast) => toast.body)).toContain('Error logging you in')
  })

  test('an empty submit sends nothing and shows the required state', async () => {
    const wrapper = await mountLogin()

    await wrapper.get('form').trigger('submit')
    await flush()

    expect(posts()).toEqual([])
    expect(toasts()).toEqual([])
    // Both fields are empty, so both report invalid.
    expect(wrapper.get('#username-input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('#password-input').attributes('aria-invalid')).toBe('true')
  })

  test('a filled username with no password flags only the password', async () => {
    const wrapper = await mountLogin()

    await wrapper.get('#username-input').setValue('jan')
    await wrapper.get('form').trigger('submit')
    await flush()

    expect(posts()).toEqual([])
    // Each field carries its own verdict; the username is not the problem.
    // A valid field renders no aria-invalid at all, so the class is the signal.
    expect(wrapper.get('#username-input').classes()).toContain('is-valid')
    expect(wrapper.get('#username-input').classes()).not.toContain('is-invalid')
    expect(wrapper.get('#password-input').classes()).toContain('is-invalid')
  })

  test('a username of only spaces sends nothing', async () => {
    const wrapper = await mountLogin()

    await submit(wrapper, '   ', 'secret')
    await flush()

    expect(posts()).toEqual([])
    expect(toasts()).toEqual([])
  })

  test('a missing password sends nothing', async () => {
    const wrapper = await mountLogin()

    await submit(wrapper, 'jan', '')
    await flush()

    expect(posts()).toEqual([])
    expect(toasts()).toEqual([])
  })

  test('a failed bootstrap tells the user', async () => {
    fakeHttp.post.mockResolvedValueOnce({ data: { token: 'jwt-abc' } })
    const wrapper = await mountLogin()
    useAuthStore().login.mockImplementation(async (username, password) => {
      const { data } = await fakeHttp.post('/jwt-token/', { username, password, app: 'web' })
      localStorage.setItem('accessToken', data.token)
    })
    MAIN.getInitialData.mockRejectedValueOnce(new Error('boom'))

    await submit(wrapper)
    await until(() => toasts().length > 0)

    expect(posts()).toHaveLength(1)
    expect(toasts().map((toast) => toast.body)).toContain('Error logging you in')
  })

  test('a double submit while logging in posts once', async () => {
    // The isSubmitting guard is what keeps Enter-plus-click (or a double
    // click) from posting two logins. Hold the first request open so the
    // guard is still armed when the second submit lands.
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    fakeHttp.post.mockImplementationOnce(() => gate)
    const wrapper = await mountLogin()
    useAuthStore().login.mockImplementation(async (username, password) => {
      const { data } = await fakeHttp.post('/jwt-token/', { username, password, app: 'web' })
      localStorage.setItem('accessToken', data.token)
    })

    await wrapper.get('#username-input').setValue('jan')
    await wrapper.get('#password-input').setValue('secret')
    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')
    release({ data: { token: 'jwt-abc' } })
    await until(() => MAIN.getInitialData.mock.calls.length > 0)

    expect(posts()).toHaveLength(1)
  })

  test('forgot-password routes into the account slice', async () => {
    const wrapper = await mountLogin()
    const push = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue()

    await wrapper.get('a').trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'reset-password' })
  })
})
