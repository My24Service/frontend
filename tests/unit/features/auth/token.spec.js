import { beforeEach, describe, expect, test } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

import { useAuthStore, TOKEN_KEY, useAuthToken } from '@/features/auth'

/**
 * Behaviour characterisation for the one token source
 * (src/features/auth/token.ts).
 *
 * Seams under test: the single localStorage entry the session reads and
 * writes, and the one ref the store, the bearer header and the refresh timer
 * all go through. The literal key value is pinned: three consumers resolve the
 * token from it, so a rename silently logs every existing session out.
 *
 * Persistence is asynchronous on purpose (VueUse writes through a watcher), so
 * the storage half of an assertion comes after a tick. The ref is what every
 * consumer reads, and it is correct immediately.
 *
 * The cross-tab cases are the behaviour the two hand-synchronised sources
 * could not have. The store kept a copy seeded from storage and written back
 * on authenticate/logout, while the request path read storage directly, so a
 * logout in another tab never reached this one. A storage event - the only
 * channel between documents - now reaches the one ref.
 */

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  useAuthToken().value = null
})

/**
 * What a change made outside this document looks like to the ref.
 *
 * VueUse picks its sync channel by how it finds the storage: for a real
 * `Storage` it listens for the native `storage` event a browser delivers to
 * the other tabs, and otherwise for its own same-document
 * `vueuse-storage` CustomEvent. The test storage is a real `Storage`
 * (tests/unit/setupTests.js), so this is the native event - the channel a
 * browser actually uses - carrying the same `{key, oldValue, newValue}`.
 */
function storageEvent(newValue, oldValue = 'jwt-abc') {
  return new StorageEvent('storage', {
    key: TOKEN_KEY,
    oldValue,
    newValue,
    storageArea: localStorage,
  })
}

describe('the token ref', () => {
  test('the key is the accessToken entry', () => {
    expect(TOKEN_KEY).toBe('accessToken')
  })

  test('it starts logged out', () => {
    expect(useAuthToken().value).toBeNull()
  })

  test('a write is persisted under the key', async () => {
    useAuthToken().value = 'jwt-abc'

    expect(useAuthToken().value).toBe('jwt-abc')
    await nextTick()
    expect(localStorage.getItem('accessToken')).toBe('jwt-abc')
  })

  test('clearing it removes the entry instead of storing the text "null"', async () => {
    useAuthToken().value = 'jwt-abc'
    useAuthToken().value = null

    expect(useAuthToken().value).toBeNull()
    await nextTick()
    expect(localStorage.getItem('accessToken')).toBeNull()
  })
})

describe('the token ref across tabs', () => {
  test('a logout in another tab clears the session here', () => {
    const authStore = useAuthStore()
    authStore.setUserInfo({ user: { username: 'jan' } })
    useAuthToken().value = 'jwt-abc'
    expect(authStore.isLoggedIn).toBe(true)

    window.dispatchEvent(storageEvent(null))

    expect(useAuthToken().value).toBeNull()
    expect(authStore.token).toBeNull()
    expect(authStore.isLoggedIn).toBe(false)
  })

  test('a login in another tab is adopted here', () => {
    window.dispatchEvent(storageEvent('jwt-other', null))

    expect(useAuthToken().value).toBe('jwt-other')
  })
})
