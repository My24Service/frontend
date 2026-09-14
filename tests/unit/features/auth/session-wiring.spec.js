import { beforeEach, describe, expect, test, vi } from 'vitest'

import setInterceptors from '@/services/auth/clientDriver'
import { useAuthStore, useAuthToken } from '@/features/auth'

beforeEach(() => {
  localStorage.clear()
  useAuthToken().value = null
  vi.restoreAllMocks()
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
    useAuthToken().value = 'jwt-abc'
    const { request, handlers } = wired()

    const out = await handlers.request.ok(request)

    expect(out.headers).toMatchObject({ Authorization: 'Bearer jwt-abc' })
  })

  test('it sends nothing when logged out', async () => {
    const { request, handlers } = wired()

    const out = await handlers.request.ok(request)

    expect(out.headers).not.toHaveProperty('Authorization')
  })

  test('a 401 logs out and leaves through a full reload', async () => {
    const { handlers } = wired()
    const { createPinia, setActivePinia } = await import('pinia')
    setActivePinia(createPinia())
    useAuthToken().value = 'jwt-abc'
    const authStore = useAuthStore()
    authStore.setUserInfo({ user: { username: 'jan' } })
    const href = vi.fn()
    Object.defineProperty(document, 'location', { value: { set href(v) { href(v) } }, configurable: true })

    await expect(handlers.response.fail({
      response: { status: 401 },
      config: { headers: { Authorization: 'Bearer jwt-abc' } },
    })).rejects.toBeDefined()
    await Promise.resolve()

    expect(authStore.token).toBeNull()
    expect(authStore.userInfo).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(href).toHaveBeenCalledWith('/')
  })

  test('a 401 on a request without a token is a login failure, not an expiry', async () => {
    const { handlers } = wired()
    const { createPinia, setActivePinia } = await import('pinia')
    setActivePinia(createPinia())
    useAuthToken().value = 'jwt-abc'
    const authStore = useAuthStore()
    authStore.setUserInfo({ user: { username: 'jan' } })
    const href = vi.fn()
    Object.defineProperty(document, 'location', { value: { set href(v) { href(v) } }, configurable: true })

    await expect(handlers.response.fail({
      response: { status: 401 },
      config: { headers: {} },
    })).rejects.toBeDefined()
    await Promise.resolve()

    expect(authStore.token).toBe('jwt-abc')
    expect(authStore.userInfo).not.toBeNull()
    expect(localStorage.getItem('accessToken')).toBe('jwt-abc')
    expect(href).not.toHaveBeenCalled()
  })

  test('a non-401 error only re-rejects', async () => {
    const { handlers } = wired()
    useAuthToken().value = 'jwt-abc'

    await expect(handlers.response.fail({ response: { status: 500 } })).rejects.toEqual({
      response: { status: 500 },
    })
    expect(localStorage.getItem('accessToken')).toBe('jwt-abc')
  })
})
