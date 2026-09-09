import { beforeEach, describe, expect, test, vi } from 'vitest'

import authHeader from '@/services/auth/auth-header'
import setInterceptors from '@/services/auth/clientDriver'
import { useAuthStore } from '@/features/auth'

/**
 * Behaviour characterisation for the session HTTP wiring.
 *
 * Seams under test: the bearer header reads the stored token on every
 * request, sends nothing when logged out, and any 401 logs out and leaves
 * the app through a full reload. The wiring stays in services: moving it
 * would re-open the documented import cycle through models, services and
 * both stores. These specs pin the contract it must keep.
 */

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('authHeader', () => {
  test('it sends the stored token as bearer', () => {
    localStorage.setItem('accessToken', 'jwt-abc')

    expect(authHeader()).toEqual({ Authorization: 'Bearer jwt-abc' })
  })

  test('it sends nothing when logged out', () => {
    expect(authHeader()).toEqual({})
  })
})

describe('clientDriver 401 handling', () => {
  function wired() {
    const request = { headers: {} }
    const handlers = { request: null, response: null }
    const client = {
      interceptors: {
        request: { use: vi.fn((ok, fail) => { handlers.request = { ok, fail } }) },
        response: { use: vi.fn((ok, fail) => { handlers.response = { ok, fail } }) },
      },
    }
    setInterceptors(client)
    return { request, handlers }
  }

  test('it attaches the bearer header to every request', async () => {
    localStorage.setItem('accessToken', 'jwt-abc')
    const { request, handlers } = wired()

    const out = await handlers.request.ok(request)

    expect(out.headers).toMatchObject({ Authorization: 'Bearer jwt-abc' })
  })

  test('a 401 logs out and leaves through a full reload', async () => {
    const { handlers } = wired()
    const { createPinia, setActivePinia } = await import('pinia')
    setActivePinia(createPinia())
    localStorage.setItem('accessToken', 'jwt-abc')
    const authStore = useAuthStore()
    authStore.setUserInfo({ user: { username: 'jan' } })
    const href = vi.fn()
    Object.defineProperty(document, 'location', { value: { set href(v) { href(v) } }, configurable: true })

    await expect(handlers.response.fail({ response: { status: 401 } })).rejects.toBeDefined()
    await Promise.resolve()

    expect(authStore.token).toBeNull()
    expect(authStore.userInfo).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(href).toHaveBeenCalledWith('/')
  })

  test('a non-401 error only re-rejects', async () => {
    const { handlers } = wired()
    localStorage.setItem('accessToken', 'jwt-abc')

    await expect(handlers.response.fail({ response: { status: 500 } })).rejects.toEqual({
      response: { status: 500 },
    })
    expect(localStorage.getItem('accessToken')).toBe('jwt-abc')
  })
})
