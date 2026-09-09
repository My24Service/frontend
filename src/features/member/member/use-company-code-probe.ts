import { computed, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import type { ComputedRef, Ref } from 'vue'

import { memberCompanycodeExistsRetrieve } from '@/api/sdk.gen'

import { COMPANYCODE_DEBOUNCE_MS } from './schemas'

/**
 * The company-code availability probe — the declared raw-SDK exception (see
 * member/README.md rule 3): its verdict is per-keystroke state, and caching it
 * would wave through a code another admin took meanwhile. Debounced, not per
 * keystroke; a save waits out the pending probe (`waitForProbe`), and a probe
 * for an abandoned value never overwrites the verdict for the current one.
 */
export function useCompanyCodeProbe(
  /** Live read of the company-code field. */
  companycode: () => string,
  /** The code of the record under edit; an unchanged code owes no verdict. */
  originalCompanycode: Ref<string | null>,
  /** Injectable for specs; production uses the ticketed half-second. */
  { debounceMs = COMPANYCODE_DEBOUNCE_MS }: { debounceMs?: number } = {},
): UseCompanyCodeProbeReturn {
  const state = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')
  let pendingProbe: Promise<void> = Promise.resolve()

  function shouldProbe(value: string): boolean {
    return value.length >= 2 && value !== originalCompanycode.value
  }

  const companycodeAtRest = refDebounced(computed(companycode), debounceMs)

  let settleLatestProbe = () => {}

  watch(companycode, (value) => {
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

  watch(companycodeAtRest, async (value) => {
    if (!shouldProbe(value)) return

    try {
      const {data, error} = await memberCompanycodeExistsRetrieve({
        query: {companycode: value},
      })
      if (!error && data && value === companycode()) {
        state.value = data.available ? 'available' : 'taken'
      }
    } catch {
      if (value === companycode()) state.value = 'idle'
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

export interface UseCompanyCodeProbeReturn {
  /** idle → checking → available|taken; a fresh keystroke restarts the path. */
  state: Ref<'idle' | 'checking' | 'available' | 'taken'>
  /** The verdict as the input's colour: taken red, available green, else neutral. */
  validationState: ComputedRef<boolean | undefined>
  /**
   * Resolves when the probe for the current code has settled — the barrier a
   * save waits behind before asking the user to submit an unverified code.
   */
  waitForProbe: () => Promise<void>
}
