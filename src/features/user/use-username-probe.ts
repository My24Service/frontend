import { computed, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import type { ComputedRef, Ref } from 'vue'

import client from '@/services/api'

import { USERNAME_PROBE_DEBOUNCE_MS } from './sales/schemas'

/**
 * The username availability probe — the declared raw-SDK exception (see
 * member/README.md rule 3, same shape as use-company-code-probe.ts): its
 * verdict is per-keystroke state, and caching an "available" from thirty
 * seconds ago would wave through a username another admin took meanwhile.
 * Debounced, not per keystroke; a save waits out the pending probe
 * (`waitForProbe`), and a probe for an abandoned value never overwrites the
 * verdict for the current one.
 *
 * Shared by all seven user forms: each passes its own username field read
 * and the record's original username (an unchanged name owes no verdict).
 */
export function useUsernameProbe(
  /** Live read of the username field. */
  username: () => string,
  /** The username of the record under edit; an unchanged name owes no verdict. */
  originalUsername: Ref<string | null>,
  /** Injectable for specs; production uses the ticketed delay. */
  { debounceMs = USERNAME_PROBE_DEBOUNCE_MS }: { debounceMs?: number } = {},
): UseUsernameProbeReturn {
  const state = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')
  let pendingProbe: Promise<void> = Promise.resolve()

  function shouldProbe(value: string): boolean {
    return value !== '' && value !== originalUsername.value
  }

  const usernameAtRest = refDebounced(computed(username), debounceMs)

  let settleLatestProbe = () => {}

  watch(username, (value) => {
    settleLatestProbe()
    if (!shouldProbe(value)) {
      state.value = 'idle'
      pendingProbe = Promise.resolve()
      return
    }

    state.value = 'checking'
    pendingProbe = new Promise<void>((resolve) => {
      settleLatestProbe = resolve
    })
  })

  watch(usernameAtRest, async (value) => {
    if (!shouldProbe(value)) return

    // username-exists declares no query parameters, so the generated op's own
    // request validator rejects the needed request before it leaves. The probe
    // rides the shared axios instance directly — the legacy helper sent
    // `?username=` the same way. Raw-axios traffic never reaches the strict
    // seam, so the probe spec answers at the instance (see its beforeEach),
    // not through api.get.
    try {
      const response = await client.get(`/company/username-exists/?username=${value}`)
      if (value === username()) {
        state.value = response.data['available'] ? 'available' : 'taken'
      }
    } catch {
      if (value === username()) state.value = 'idle'
    } finally {
      settleLatestProbe()
    }
  })

  return {
    state,
    validationState: computed(() => {
      if (state.value === 'taken') return false
      if (state.value === 'available') return true
      return undefined
    }),
    waitForProbe: () => pendingProbe,
  }
}

export interface UseUsernameProbeReturn {
  /** idle → checking → available|taken; a fresh keystroke restarts the path. */
  state: Ref<'idle' | 'checking' | 'available' | 'taken'>
  /** The verdict as the input's colour: taken red, available green, else neutral. */
  validationState: ComputedRef<boolean | undefined>
  /**
   * Resolves when the probe for the current name has settled — the barrier a
   * save waits behind before asking the user to submit an unverified name.
   */
  waitForProbe: () => Promise<void>
}
