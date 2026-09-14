import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import TokenRefresh from '@/features/auth/TokenRefresh.vue'
import { useAuthStore } from '@/features/auth'
import { useAuthToken } from '@/features/auth/token'

import { mountForm } from '../../support/form-harness.js'

/**
 * Behaviour characterisation for the refresh timer
 * (src/features/auth/TokenRefresh.vue).
 *
 * Seams under test: a near-expiry token is refreshed through the store, a
 * fresh token is left alone, and a missing or unparseable token sends
 * nothing. The timer itself is not exercised: the check fires on mount, and
 * the fifteen-minute interval only decides when it fires again. No HTTP seam
 * is faked here: the store's refreshToken action is stubbed by the harness,
 * and these specs assert whether the component reached for it.
 */

enableAutoUnmount(afterEach)

/** A JWT-shaped token the component can parse, expiring at `exp`. */
function jwt(exp) {
  const payload = btoa(JSON.stringify({ exp })).replace(/\+/g, '-').replace(/\//g, '_')
  return `header.${payload}.signature`
}

function secondsFromNow(seconds) {
  return Math.round(Date.now() / 1000) + seconds
}

/** Drain macrotasks so the mount-time check settles. */
async function flush() {
  for (let i = 0; i < 10; i++) await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  localStorage.clear()
  // The timer reads the one token ref, so a test starts logged out by
  // clearing the ref, not just the storage entry behind it.
  useAuthToken().value = null
  vi.restoreAllMocks()
})

function mountTimer() {
  return mountForm(TokenRefresh)
}

describe('TokenRefresh', () => {
  test('it renders no visible chrome', async () => {
    const wrapper = mountTimer()
    await flush()

    expect(wrapper.text()).toBe('')
    wrapper.unmount()
  })

  test('a near-expiry token is refreshed through the store', async () => {
    // Within the twelve-hour refresh threshold.
    useAuthToken().value = jwt(secondsFromNow(60 * 60))
    const wrapper = mountTimer()
    await flush()

    expect(useAuthStore().refreshToken).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  test('a fresh token is left alone', async () => {
    // Two days out, past the threshold.
    useAuthToken().value = jwt(secondsFromNow(2 * 24 * 60 * 60))
    const wrapper = mountTimer()
    await flush()

    expect(useAuthStore().refreshToken).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  test('without a stored token it sends nothing', async () => {
    const wrapper = mountTimer()
    await flush()

    expect(useAuthStore().refreshToken).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  test('an unparseable token sends nothing', async () => {
    useAuthToken().value = 'not-a-jwt'
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mountTimer()
    await flush()

    expect(useAuthStore().refreshToken).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledWith('error parsing token', expect.anything())
    wrapper.unmount()
  })

  test('a token without an expiry sends nothing', async () => {
    // A structurally valid JWT whose payload carries no exp: the finite
    // check keeps it from reaching the store with a NaN countdown.
    const payload = btoa(JSON.stringify({ sub: 'jan' })).replace(/\+/g, '-').replace(/\//g, '_')
    useAuthToken().value = `header.${payload}.signature`
    const wrapper = mountTimer()
    await flush()

    expect(useAuthStore().refreshToken).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  test('a failed refresh is swallowed, not thrown', async () => {
    useAuthToken().value = jwt(secondsFromNow(60 * 60))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    // Seeded, not armed after mounting: the check fires during mount, so a
    // rejection armed afterwards would miss the only call (same trap the
    // harness documents for store reads in setup).
    const wrapper = mountForm(TokenRefresh, {
      auth: { refreshToken: vi.fn().mockRejectedValue(new Error('boom')) },
    })
    await flush()

    expect(error).toHaveBeenCalledWith('error refreshing token', expect.anything())
    wrapper.unmount()
  })
})
