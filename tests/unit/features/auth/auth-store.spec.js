import { beforeEach, describe, expect, test, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { useAuthStore } from '@/features/auth'
import { useMainStore } from '@/stores/main'

/**
 * Behaviour characterisation for the session lifecycle.
 *
 * Seams under test: the auth store actions and the login ordering contract.
 * login posts credentials and stores the token but never sets userInfo.
 * isLoggedIn needs both halves, so every login must be followed by the
 * bootstrap before anything trusts it. logout wipes locally and makes no
 * server call. The store is the session-identity half of a mutual pair: it
 * resets the bootstrap on login, and the bootstrap fills userInfo back in.
 *
 * The getters are derived, not stored: `isPlanning` is
 * `userInfo.submodel === 'planning_user' && userInfo.user.planning_user`. So
 * these specs set the state the getter reads, not the getter.
 */

const fakeHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/services/api', () => ({ default: fakeHttp, normalClient: fakeHttp }))

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  fakeHttp.post.mockReset()
  fakeHttp.post.mockResolvedValue({ data: {} })
})

describe('auth store login', () => {
  test('it posts credentials and stores the token', async () => {
    fakeHttp.post.mockResolvedValueOnce({ data: { token: 'jwt-abc' } })
    const authStore = useAuthStore()

    await authStore.login('jan', 'secret')

    expect(fakeHttp.post).toHaveBeenCalledWith('/jwt-token/', {
      username: 'jan',
      password: 'secret',
      app: 'web',
    })
    expect(localStorage.getItem('accessToken')).toBe('jwt-abc')
    expect(authStore.token).toBe('jwt-abc')
  })

  test('login alone does not log in: userInfo still needs the bootstrap', async () => {
    fakeHttp.post.mockResolvedValueOnce({ data: { token: 'jwt-abc' } })
    const authStore = useAuthStore()

    await authStore.login('jan', 'secret')

    expect(authStore.userInfo).toBeNull()
    expect(authStore.isLoggedIn).toBe(false)
  })

  test('login resets the bootstrap so anonymous data cannot linger', async () => {
    fakeHttp.post.mockResolvedValueOnce({ data: { token: 'jwt-abc' } })
    const authStore = useAuthStore()
    const mainStore = useMainStore()
    mainStore.isInitialDataFetched = true

    await authStore.login('jan', 'secret')

    expect(mainStore.isInitialDataFetched).toBe(false)
  })

  test('userInfo from the bootstrap flips isLoggedIn', async () => {
    fakeHttp.post.mockResolvedValueOnce({ data: { token: 'jwt-abc' } })
    const authStore = useAuthStore()

    await authStore.login('jan', 'secret')
    authStore.setUserInfo({ user: { username: 'jan' } })

    expect(authStore.isLoggedIn).toBe(true)
  })
})

describe('auth store logout', () => {
  test('it wipes locally and makes no server call', async () => {
    localStorage.setItem('accessToken', 'jwt-abc')
    const authStore = useAuthStore()
    authStore.setUserInfo({ user: { username: 'jan' } })

    authStore.logout()

    expect(authStore.token).toBeNull()
    expect(authStore.userInfo).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(fakeHttp.post).not.toHaveBeenCalled()
  })
})

describe('auth store token refresh', () => {
  test('it posts the stored token and reloads', async () => {
    localStorage.setItem('accessToken', 'jwt-old')
    fakeHttp.post.mockResolvedValueOnce({ data: { token: 'jwt-new' } })
    const reload = vi.fn()
    vi.stubGlobal('location', { reload })
    const authStore = useAuthStore()

    await authStore.refreshToken()

    expect(fakeHttp.post).toHaveBeenCalledWith('/jwt-token/refresh/', { token: 'jwt-old' })
    expect(localStorage.getItem('accessToken')).toBe('jwt-new')
    expect(reload).toHaveBeenCalled()
  })

  test('a logout during an in-flight refresh is not resurrected', async () => {
    localStorage.setItem('accessToken', 'jwt-old')
    let resolveRefresh
    fakeHttp.post.mockReturnValueOnce(new Promise((resolve) => { resolveRefresh = resolve }))
    const reload = vi.fn()
    vi.stubGlobal('location', { reload })
    const authStore = useAuthStore()
    authStore.setUserInfo({ user: { username: 'jan' } })

    const pending = authStore.refreshToken()
    authStore.logout()
    resolveRefresh({ data: { token: 'jwt-new' } })
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
    expect(fakeHttp.post).not.toHaveBeenCalled()
  })
})

describe('auth store session halves', () => {
  test('isLoggedIn needs both the token and the bootstrap userInfo', async () => {
    const authStore = useAuthStore()

    expect(authStore.isLoggedIn).toBe(false)

    authStore.setUserInfo({ submodel: 'planning_user', user: { planning_user: true } })
    expect(authStore.isLoggedIn).toBe(false)

    localStorage.setItem('accessToken', 'jwt-abc')
    const reseeded = useAuthStore()
    expect(reseeded.isLoggedIn).toBe(false)
  })
})

describe('auth store userInfo boundary', () => {
  test('an omitted userInfo is not logged in', () => {
    const authStore = useAuthStore()
    authStore.token = 'jwt-abc'

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
    authStore.token = 'jwt-abc'

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

  test('a superuser has no personal name', () => {
    const authStore = useAuthStore()
    authStore.setUserInfo({
      submodel: 'superuser',
      user: { username: 'root', first_name: 'Root', is_superuser: true },
    })

    expect(authStore.getUserName).toBe('superuser')
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
