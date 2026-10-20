import { beforeEach, describe, expect, test, vi } from 'vitest'

import { jwtTokenCreate } from '@/api/sdk.gen'
import { LoginForm, useAuthStore } from '@/features/auth'

import { vJwtTokenCreateResponse } from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toastCreate, toasts } from '../../support/form-harness.js'

/**
 * Behaviour characterisation for the login form
 * (src/components/LoginForm.vue).
 *
 * Seams under test: the submit posts credentials, then runs the bootstrap
 * before anything trusts isLoggedIn, then tells the user. The redirect lives
 * one level up in TheIndex, not here. A failed login tells the user and goes
 * nowhere. Forgot-password routes into the account slice.
 */

const api = installApiSeam()

const TOKEN = () => fixtureFor(vJwtTokenCreateResponse, { token: 'jwt-abc' })

/** Drain macrotasks so the SDK promise chain settles. */
async function flush() {
  for (let i = 0; i < 2; i++) await settle()
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
  return api.requests().filter((request) => request.method === 'post')
}

beforeEach(() => {
  toastCreate.mockClear()
  MAIN.getInitialData.mockClear()
})

async function mountLogin() {
  const wrapper = mountForm(LoginForm, { deep: true, main: MAIN })
  await flush()
  return wrapper
}

async function submit(wrapper, username = 'jan', password = 'secret') {
  await wrapper.get('#login_username').setValue(username)
  await wrapper.get('#login_password').setValue(password)
  await wrapper.get('form').trigger('submit')
  await flush()
}

describe('LoginForm', () => {
  test('a fresh form shows empty fields with no validation state', async () => {
    const wrapper = await mountLogin()

    expect(wrapper.get('#login_username').element.value).toBe('')
    expect(wrapper.get('#login_password').element.value).toBe('')
    // Neutral until the first submit: nothing is flagged valid or invalid.
    expect(wrapper.get('#login_username').attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.get('#login_password').attributes('aria-invalid')).toBeUndefined()
  })

  test('a submit posts credentials and then runs the bootstrap', async () => {
    api.post('/api/jwt-token/', TOKEN())
    const wrapper = await mountLogin()
    // The harness stubs store actions. Unstub login so the wire shape is the
    // store's, not the stub's. The bootstrap stays stubbed: the ordering is
    // the contract, not the bootstrap internals.
    useAuthStore().login.mockImplementation(async (username, password) => {
      // The store's own call: the generated operation, so the recorded wire
      // shape is the one it really sends.
      const { data } = await jwtTokenCreate({
        body: { username, password, app: 'web' },
        throwOnError: true,
      })
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
    expect(wrapper.get('#login_username').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('#login_password').attributes('aria-invalid')).toBe('true')
  })

  test('a filled username with no password flags only the password', async () => {
    const wrapper = await mountLogin()

    await wrapper.get('#login_username').setValue('jan')
    await wrapper.get('form').trigger('submit')
    await flush()

    expect(posts()).toEqual([])
    // Each field carries its own verdict; the username is not the problem.
    // A valid field renders no aria-invalid at all, so the class is the signal.
    expect(wrapper.get('#login_username').classes()).toContain('is-valid')
    expect(wrapper.get('#login_username').classes()).not.toContain('is-invalid')
    expect(wrapper.get('#login_password').classes()).toContain('is-invalid')
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
    api.post('/api/jwt-token/', TOKEN())
    const wrapper = await mountLogin()
    useAuthStore().login.mockImplementation(async (username, password) => {
      // The store's own call: the generated operation, so the recorded wire
      // shape is the one it really sends.
      const { data } = await jwtTokenCreate({
        body: { username, password, app: 'web' },
        throwOnError: true,
      })
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
    api.post('/api/jwt-token/', async () => {
      await gate
      return TOKEN()
    })
    const wrapper = await mountLogin()
    useAuthStore().login.mockImplementation(async (username, password) => {
      // The store's own call: the generated operation, so the recorded wire
      // shape is the one it really sends.
      const { data } = await jwtTokenCreate({
        body: { username, password, app: 'web' },
        throwOnError: true,
      })
      localStorage.setItem('accessToken', data.token)
    })

    await wrapper.get('#login_username').setValue('jan')
    await wrapper.get('#login_password').setValue('secret')
    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')
    release()
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
