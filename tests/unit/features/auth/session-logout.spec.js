import { beforeEach, describe, expect, test, vi } from 'vitest'

import TheNavLoggedIn from '@/components/TheNavLoggedIn.vue'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'

/**
 * Behaviour characterisation for the logout sequence
 * (src/components/TheNavLoggedIn.vue, doLogout).
 *
 * Seams under test: logout wipes the session locally, tears down the socket,
 * returns home, and only then re-runs the bootstrap as anonymous. It makes no
 * server call. Navigation must come first: the anonymous bootstrap has no
 * member settings, and a still-mounted logged-in screen crashes re-rendering
 * on it. The shell stays in app chrome: the
 * sequence composes session, member and socket state, so it is not slice
 * logic. These specs pin the ordering it must keep.
 */

const api = installApiSeam()

/** Drain macrotasks so the socket promise chain settles. */
async function flush() {
  for (let i = 0; i < 2; i++) await settle()
}

/** The requests made from here on. */
function requestsFrom(start) {
  return api.requests().slice(start)
}

const MAIN = {
  checkInitialData: vi.fn().mockResolvedValue({}),
  memberInfo: null,
  getInitialData: vi.fn().mockResolvedValue({}),
}

beforeEach(() => {
  // Mounting connects the new-data socket, which first asks for its room.
  api.get('/api/get-member-new-data-room/', { room: 'room-acme' })
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
    const { useAuthStore } = await import('@/features/auth')
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
    expect(push.mock.invocationCallOrder[0]).toBeLessThan(MAIN.getInitialData.mock.invocationCallOrder[0])
  })

  test('it makes no server call', async () => {
    const wrapper = await mountNav()
    wrapper.vm.$router.currentRoute.path = '/customers/customers'
    const start = api.requests().length

    await wrapper.vm.doLogout()
    await flush()

    expect(requestsFrom(start)).toEqual([])
  })

  test('it looks up no websocket room to close the sockets', async () => {
    const wrapper = await mountNav()
    const start = api.requests().length

    await wrapper.vm.doLogout()
    await flush()

    expect(requestsFrom(start).filter(({ path }) => path.includes('room'))).toEqual([])
  })
})
