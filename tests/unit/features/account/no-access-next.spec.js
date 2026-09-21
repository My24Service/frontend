import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import { NoAccessView } from '@/features/account'
import { useAuthStore } from '@/features/auth'
import { useAuthToken } from '@/features/auth'

import { mountListView, resetFakeHttp, toastCreate } from '../../support/form-harness.js'

/**
 * Return-to-next behaviour for the access gate
 * (src/features/account/NoAccessView.vue).
 *
 * Seams under test: the guard sends denied users to the no-access route
 * with a next query holding the denied path (see src/router/index.js);
 * this view owns reading next back and sending the user there once
 * isLoggedIn flips. Only a same-origin path is honored - an absolute URL,
 * a protocol-relative value, or anything without a single leading slash
 * keeps the current behaviour (stay put), never an off-site redirect.
 *
 * The mount goes through mountListView: the view reads its next value from
 * the route, so the router and its query have to exist before setup runs.
 * The login is driven through the real form the way
 * tests/unit/features/auth/login-form.spec.js does it.
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

vi.mock('vue-loading-overlay', () => ({
  useLoading: () => ({ show: () => ({ hide: vi.fn() }) }),
}))

/** Drain macrotasks so the login chain, the watcher, and the router settle. */
async function flush() {
  for (let i = 0; i !== 10; i++) await new Promise((resolve) => setTimeout(resolve, 0))
}

async function until(condition, { attempts = 200 } = {}) {
  for (let i = 0; i !== attempts; i++) {
    if (condition()) return
    await flush()
  }
  throw new Error('condition never became true')
}

const MAIN = {
  getInitialData: vi.fn().mockResolvedValue({}),
}

beforeEach(() => {
  resetFakeHttp(fakeHttp)
  toastCreate.mockClear()
  MAIN.getInitialData.mockClear()
})

function currentPath(wrapper) {
  return wrapper.vm.$router.currentRoute.value.path
}

async function mountGate(next) {
  const query = next === undefined ? {} : { next }
  const wrapper = await mountListView(NoAccessView, { deep: true, main: MAIN, query })
  await flush()
  return wrapper
}

/** Drive the real login form: type credentials, submit, flip isLoggedIn. */
async function loginThroughForm(wrapper) {
  const authStore = useAuthStore()
  // The harness stubs store actions. This spec is about the gate's redirect, not
  // the login wire (tests/unit/features/auth/auth-store.spec.js owns that), so
  // login stays stubbed - but it writes the token through the same ref the store
  // uses and flips the flag the view watches. Reaching into localStorage here
  // would silently stop meaning anything, now that the session is one ref.
  authStore.login.mockImplementation(async () => {
    useAuthToken().value = 'jwt-abc'
    authStore.isLoggedIn = true
  })

  await wrapper.get('#login_username').setValue('jan')
  await wrapper.get('#login_password').setValue('secret')
  await wrapper.get('form').trigger('submit')
  await flush()
}

describe('NoAccess next', () => {
  test('logging in on the gate returns to the denied path', async () => {
    const wrapper = await mountGate('/orders')

    await loginThroughForm(wrapper)
    await until(() => currentPath(wrapper) === '/orders')

    expect(currentPath(wrapper)).toBe('/orders')
  })

  test('flipping to logged in with a safe next bounces straight back', async () => {
    const wrapper = await mountGate('/orders')
    useAuthStore().isLoggedIn = true

    await until(() => currentPath(wrapper) === '/orders')

    expect(currentPath(wrapper)).toBe('/orders')
  })

  test.each([
    'https://evil.test/phish',
    'http://evil.test/',
    '//evil.test/phish',
    '///evil.test/phish',
    'javascript:alert(1)',
    'orders-without-leading-slash',
    '/%5cevil.test',
  ])('a hostile next value is dropped: login stays put (%s)', async (hostile) => {
    const wrapper = await mountGate(hostile)

    await loginThroughForm(wrapper)
    await flush()

    expect(currentPath(wrapper)).toBe('/')
  })

  test('no next keeps the current behaviour: login stays put', async () => {
    const wrapper = await mountGate()

    await loginThroughForm(wrapper)
    await flush()

    expect(currentPath(wrapper)).toBe('/')
  })
})
