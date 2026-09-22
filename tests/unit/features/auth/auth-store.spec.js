import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { client } from '@/api/client.gen'
import {
  useAuthStore,
  useAuthToken,
} from '@/features/auth'
import { useMainStore } from '@/stores/main'

/**
 * Behaviour characterisation for the session lifecycle.
 *
 * Seams under test: the auth store actions and the login ordering contract.
 * login posts credentials through the generated `jwtTokenCreate` and stores the
 * token but never sets userInfo. isLoggedIn needs both halves, so every login
 * must be followed by the bootstrap before anything trusts it. logout wipes
 * locally and makes no server call. The store is the session-identity half of a
 * mutual pair: it resets the bootstrap on login, and the bootstrap fills
 * userInfo back in.
 *
 * The HTTP seam is the generated client's axios adapter, not a fake of the
 * operation: the operation, the body schema it validates the request with and
 * the response validator the store passes all still run, so what is asserted is
 * the request as it would go on the wire (same seam as
 * tests/unit/api/interceptors.spec.js).
 *
 * The getters are derived, not stored: `isPlanning` is
 * `userInfo.submodel === 'planning_user' && userInfo.user.planning_user`. So
 * these specs set the state the getter reads, not the getter.
 */

let adapter

/** A 200 as the generated client's axios instance hands it back. */
function ok(data) {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} }
}

/** The requests the store's actions put on the wire. */
const sent = () => adapter.mock.calls.map(([config]) => config)

/** The body as axios serialized it, for the operations that send one. */
function bodyOf(config) {
  return typeof config.data === 'string' ? JSON.parse(config.data) : config.data
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  // The token lives in one module-scoped ref now, so clearing storage is not
  // enough to start a test logged out: the ref has to be cleared too.
  useAuthToken().value = null
  // Faked below the interceptor chain, so the generated operation is the one
  // under test rather than a stand-in for it.
  adapter = vi.fn(async () => ok({ token: 'jwt-abc', app: 'web' }))
  client.instance.defaults.adapter = adapter
})

describe('auth store login', () => {
  test('it posts credentials and stores the token', async () => {
    const authStore = useAuthStore()

    await authStore.login('jan', 'secret')

    // Through the generated operation, which carries the `/api` prefix itself,
    // and with the literal `app` the backend picks the session expiry with
    // intact: the generated request schema declares it, so it is not dropped
    // before the request leaves.
    expect(sent()[0].url).toContain('/api/jwt-token/')
    expect(sent()[0].method).toBe('post')
    expect(bodyOf(sent()[0])).toEqual({ username: 'jan', password: 'secret', app: 'web' })
    expect(localStorage.getItem('accessToken')).toBe('jwt-abc')
    expect(authStore.token).toBe('jwt-abc')
  })

  test('login alone does not log in: userInfo still needs the bootstrap', async () => {
    const authStore = useAuthStore()

    await authStore.login('jan', 'secret')

    expect(authStore.userInfo).toBeNull()
    expect(authStore.isLoggedIn).toBe(false)
  })

  test('login resets the bootstrap so anonymous data cannot linger', async () => {
    const authStore = useAuthStore()
    const mainStore = useMainStore()
    mainStore.isInitialDataFetched = true

    await authStore.login('jan', 'secret')

    expect(mainStore.isInitialDataFetched).toBe(false)
  })

  test('userInfo from the bootstrap flips isLoggedIn', async () => {
    const authStore = useAuthStore()

    await authStore.login('jan', 'secret')
    authStore.setUserInfo({ user: { username: 'jan' } })

    expect(authStore.isLoggedIn).toBe(true)
  })
})

describe('auth store logout', () => {
  test('it wipes locally and makes no server call', async () => {
    useAuthToken().value = 'jwt-abc'
    const authStore = useAuthStore()
    authStore.setUserInfo({ user: { username: 'jan' } })

    authStore.logout()

    expect(authStore.token).toBeNull()
    expect(authStore.userInfo).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(adapter).not.toHaveBeenCalled()
  })
})

describe('auth store token refresh', () => {
  test('it posts the stored token and reloads', async () => {
    useAuthToken().value = 'jwt-old'
    adapter.mockResolvedValueOnce(ok({ token: 'jwt-new' }))
    const reload = vi.fn()
    vi.stubGlobal('location', { reload })
    const authStore = useAuthStore()

    await authStore.refreshToken()

    expect(sent()[0].url).toContain('/api/jwt-token/refresh/')
    expect(bodyOf(sent()[0])).toEqual({ token: 'jwt-old' })
    expect(localStorage.getItem('accessToken')).toBe('jwt-new')
    expect(reload).toHaveBeenCalled()
  })

  test('a logout during an in-flight refresh is not resurrected', async () => {
    useAuthToken().value = 'jwt-old'
    // The gate is created before the call, not inside the adapter: the
    // generated client validates the body before it reaches the transport, so
    // the request is only in flight a few microtasks after refreshToken starts.
    let resolveRefresh
    const inFlight = new Promise((resolve) => { resolveRefresh = resolve })
    adapter.mockImplementationOnce(() => inFlight)
    const reload = vi.fn()
    vi.stubGlobal('location', { reload })
    const authStore = useAuthStore()
    authStore.setUserInfo({ user: { username: 'jan' } })

    const pending = authStore.refreshToken()
    authStore.logout()
    resolveRefresh(ok({ token: 'jwt-new' }))
    await pending

    expect(authStore.token).toBeNull()
    expect(authStore.userInfo).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(reload).not.toHaveBeenCalled()
  })

  test('without a stored token it logs out instead', async () => {
    const authStore = useAuthStore()
    authStore.setUserInfo({ user: { username: 'jan' } })

    await authStore.refreshToken()

    expect(authStore.userInfo).toBeNull()
    expect(adapter).not.toHaveBeenCalled()
  })
})

describe('auth store response boundary', () => {
  test('a login response without a token stores nothing and fails', async () => {
    // The generated client validates the request and nothing else - an
    // operation carries a `requestValidator` and no `responseValidator` - so
    // the store passes the generated response schema in itself. A 200 that is
    // not `{token, app}` is rejected by that generated schema rather than by a
    // parse of the store's own, before resetInitialDataFetched or authenticate
    // run. The raw client this replaced typed the body as any, so a missing
    // token used to reach authenticate and be stored as undefined: a session
    // that looked logged in with nothing to send.
    adapter.mockResolvedValueOnce(ok({}))
    const authStore = useAuthStore()
    const mainStore = useMainStore()
    // The state field, not the getter of the same name: the getter is
    // read-only on a real pinia.
    mainStore.initialDataFetched = true

    await expect(authStore.login('jan', 'secret')).rejects.toThrow()

    expect(authStore.token).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
    // The bootstrap is re-run for a session that started, not for one that
    // failed at the boundary.
    expect(mainStore.initialDataFetched).toBe(true)
  })

  test('a refresh response without a token leaves the session alone', async () => {
    useAuthToken().value = 'jwt-old'
    adapter.mockResolvedValueOnce(ok({}))
    const reload = vi.fn()
    vi.stubGlobal('location', { reload })
    const authStore = useAuthStore()

    await expect(authStore.refreshToken()).rejects.toThrow()

    expect(authStore.token).toBe('jwt-old')
    expect(reload).not.toHaveBeenCalled()
  })
})

describe('auth store storage failures', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('a write failure does not fail a login that has already succeeded', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    const authStore = useAuthStore()

    await authStore.login('jan', 'secret')

    // The token is in memory and the session works; only its persistence
    // failed. It used to reject out of authenticate, so a storage error
    // surfaced as "Error logging you in" after the API had said yes.
    expect(setItem).toHaveBeenCalled()
    expect(authStore.token).toBe('jwt-abc')
    expect(error).toHaveBeenCalled()
  })
})

describe('auth store session halves', () => {
  test('isLoggedIn needs both the token and the bootstrap userInfo', async () => {
    const authStore = useAuthStore()

    expect(authStore.isLoggedIn).toBe(false)

    // Token alone: the bootstrap has not delivered userInfo yet.
    useAuthToken().value = 'jwt-abc'
    expect(authStore.isLoggedIn).toBe(false)

    // userInfo alone: nobody is authenticated.
    authStore.setUserInfo(null)
    useAuthToken().value = null
    authStore.setUserInfo({ submodel: 'planning_user', user: { planning_user: true } })
    expect(authStore.isLoggedIn).toBe(false)

    useAuthToken().value = 'jwt-abc'
    expect(authStore.isLoggedIn).toBe(true)
  })
})

describe('auth store userInfo boundary', () => {
  test('an omitted userInfo is not logged in', () => {
    const authStore = useAuthStore()
    useAuthToken().value = 'jwt-abc'

    authStore.setUserInfo(undefined)

    expect(authStore.userInfo).toBeNull()
    expect(authStore.isLoggedIn).toBe(false)
  })
})

describe('auth store role getters', () => {
  test('a role needs both its submodel and its flag', () => {
    const authStore = useAuthStore()

    // Anonymous: neither half, no role.
    expect(authStore.isPlanning).toBe(false)

    // Submodel without the flag is not the role.
    authStore.setUserInfo({ submodel: 'planning_user', user: {} })
    expect(authStore.isPlanning).toBe(false)

    // Flag without the submodel is not the role either.
    authStore.setUserInfo({ submodel: 'engineer', user: { planning_user: true } })
    expect(authStore.isPlanning).toBe(false)

    authStore.setUserInfo({ submodel: 'planning_user', user: { planning_user: true } })
    expect(authStore.isPlanning).toBe(true)
    expect(authStore.isEngineer).toBe(false)
  })

  test('isAdmin covers staff and superusers, nobody else', () => {
    const authStore = useAuthStore()
    useAuthToken().value = 'jwt-abc'

    // Superusers and staff derive isAdmin from the raw flags, whatever the
    // submodel says: the nav shells gate module access on it, so a staff
    // member with a stale submodel still sees their modules.
    authStore.setUserInfo({ submodel: 'superuser', user: { is_superuser: true } })
    expect(authStore.isAdmin).toBe(true)

    authStore.setUserInfo({ submodel: 'staff', user: { is_staff: true } })
    expect(authStore.isAdmin).toBe(true)

    authStore.setUserInfo({ submodel: 'planning_user', user: { planning_user: true } })
    expect(authStore.isAdmin).toBe(false)

    authStore.setUserInfo(null)
    expect(authStore.isAdmin).toBe(false)
  })
})

describe('auth store user name', () => {
  test('it is empty when logged out', () => {
    expect(useAuthStore().getUserName).toBe('')
  })

  test('a superuser is named like anyone else', () => {
    // The legacy getter had a `userInfo.is_superuser` branch returning the
    // literal 'superuser', but that flag lives on `userInfo.user`, so the
    // branch never ran and admin always saw their first name. Keep it so.
    const authStore = useAuthStore()
    authStore.setUserInfo({
      submodel: 'superuser',
      user: { username: 'root', first_name: 'Richard', is_superuser: true },
    })

    expect(authStore.getUserName).toBe('Richard')
  })

  test('it prefers the first name over the username', () => {
    const authStore = useAuthStore()
    authStore.setUserInfo({
      submodel: 'planning_user',
      user: { username: 'jan', first_name: 'Jan', planning_user: true },
    })

    expect(authStore.getUserName).toBe('Jan')
  })

  test('it falls back to the username', () => {
    const authStore = useAuthStore()
    authStore.setUserInfo({ submodel: 'planning_user', user: { username: 'jan' } })

    expect(authStore.getUserName).toBe('jan')
  })

  test('it is empty when the record carries no name at all', () => {
    const authStore = useAuthStore()
    authStore.setUserInfo({ submodel: 'planning_user', user: {} })

    expect(authStore.getUserName).toBe('')
  })
})

describe('auth store branch employee', () => {
  test('it needs the role, an object record and a branch', () => {
    const authStore = useAuthStore()

    expect(authStore.isBranchEmployee).toBe(false)
    expect(authStore.branchEmployeeBranch).toBe(false)

    // Right submodel but no flag: not an employee at all.
    authStore.setUserInfo({ submodel: 'employee_user', user: {} })
    expect(authStore.isBranchEmployee).toBe(false)
    expect(authStore.branchEmployeeBranch).toBe(false)

    // Employee without a branch record: still not a branch employee.
    authStore.setUserInfo({ submodel: 'employee_user', user: { employee_user: {} } })
    expect(authStore.isBranchEmployee).toBe(false)
    expect(authStore.branchEmployeeBranch).toBe(false)

    authStore.setUserInfo({
      submodel: 'employee_user',
      user: { employee_user: { branch: 3 } },
    })
    expect(authStore.isBranchEmployee).toBe(true)
    expect(authStore.branchEmployeeBranch).toBe(3)
  })
})
