import { beforeEach, describe, expect, test, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { useAuthStore } from '@/features/auth/store'
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

  test('without a stored token it logs out instead', async () => {
    const authStore = useAuthStore()
    authStore.setUserInfo({ user: { username: 'jan' } })

    await authStore.refreshToken()

    expect(authStore.userInfo).toBeNull()
    expect(fakeHttp.post).not.toHaveBeenCalled()
  })
})
