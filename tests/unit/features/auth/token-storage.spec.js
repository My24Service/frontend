import { beforeEach, describe, expect, test } from 'vitest'

import {
  TOKEN_KEY,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from '@/features/auth/token-storage'

/**
 * Behaviour characterisation for the stored-token helpers
 * (src/features/auth/token-storage.ts).
 *
 * Seams under test: the single localStorage key the session reads and
 * writes, and the get/set/clear round-trip. The literal key value is pinned:
 * the store seed, the bearer header and the refresh all go through here, so
 * a rename silently logs every existing session out.
 */

beforeEach(() => {
  localStorage.clear()
})

describe('token-storage', () => {
  test('the key is the accessToken entry', () => {
    expect(TOKEN_KEY).toBe('accessToken')
  })

  test('get returns null when logged out', () => {
    expect(getStoredToken()).toBeNull()
  })

  test('set then get round-trips', () => {
    setStoredToken('jwt-abc')

    expect(getStoredToken()).toBe('jwt-abc')
    expect(localStorage.getItem('accessToken')).toBe('jwt-abc')
  })

  test('clear removes the entry', () => {
    setStoredToken('jwt-abc')
    clearStoredToken()

    expect(getStoredToken()).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
  })
})
