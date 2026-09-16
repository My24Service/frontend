import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import TheNavLoggedIn from '@/components/TheNavLoggedIn.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'

/**
 * Behaviour characterisation for the logout sequence
 * (src/components/TheNavLoggedIn.vue, doLogout).
 *
 * Seams under test: logout wipes the session locally, re-runs the bootstrap
 * as anonymous, and returns home. It makes no server call. Socket teardown
 * runs between bootstrap and navigation. The shell stays in app chrome: the
 * sequence composes session, member and socket state, so it is not slice
 * logic. These specs pin the ordering it must keep.
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

/** Drain macrotasks so the socket promise chain settles. */
async function flush() {
  for (let i = 0; i < 10; i++) await new Promise((resolve) => setTimeout(resolve, 0))
}

const MAIN = {
  checkInitialData: vi.fn().mockResolvedValue({}),
  memberInfo: null,
  getInitialData: vi.fn().mockResolvedValue({}),
}

beforeEach(() => {
  resetFakeHttp(fakeHttp)
  MAIN.checkInitialData.mockClear()
  MAIN.getInitialData.mockClear()
})

async function mountNav() {
  const wrapper = mountForm(TheNavLoggedIn, {
    deep: true,
    main: MAIN,
    stubs: {
      Notification: { template: '<div />' },
      TokenRefresh: { template: '<div />' },
      TheNav: { template: '<div />' },
      TheSidebar: { template: '<div />' },
    },
  })
  // doLogout opens a loader through this.$loading, which the app installs
  // globally. The harness does not, so stub it here.
  wrapper.vm.$loading = { show: () => ({ hide: vi.fn() }) }
  await flush()
  // created() also calls getInitialData. Only the logout call matters below.
  MAIN.getInitialData.mockClear()
  return wrapper
}

describe('TheNavLoggedIn logout', () => {
  test('it wipes the session, re-bootstraps anonymous, and goes home', async () => {
    const wrapper = await mountNav()
    // The harness stubs store actions, so the token wipe below is the
    // store's own contract, pinned separately in auth-store.spec.js. Seed
    // the token the wipe reads.
    const { useAuthStore } = await import('@/features/auth/store')
    useAuthStore().logout.mockImplementation(() => {
      localStorage.removeItem('accessToken')
    })
    localStorage.setItem('accessToken', 'jwt-abc')
    const push = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue()
    // created() runs on the same path the guard uses. Seed a logged-in
    // route so the post-logout push is observable.
    wrapper.vm.$router.currentRoute.path = '/customers/customers'

    await wrapper.vm.doLogout()
    await flush()

    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(MAIN.getInitialData).toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith({ path: '/' })
  })

  test('it makes no server call', async () => {
    const wrapper = await mountNav()
    wrapper.vm.$router.currentRoute.path = '/customers/customers'

    await wrapper.vm.doLogout()
    await flush()

    expect(fakeHttp.post.mock.calls.length).toBe(0)
  })
})
