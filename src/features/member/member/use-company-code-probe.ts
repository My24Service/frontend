import { computed, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import type { ComputedRef, Ref } from 'vue'

import { memberCompanycodeExistsRetrieve } from '@/api/sdk.gen'

import { COMPANYCODE_DEBOUNCE_MS } from './schemas'

/**
 * The company-code availability probe — **the worked example of the raw-SDK
 * exception**, as #325 puts it against ADR-0002's letter.
 *
 * Reads a component displays go through the query layer and writes go through
 * mutations. This call is the declared exception: its verdict shows nowhere
 * but this field's own state, and caching it would be worse than useless —
 * availability is only meaningful for the exact keystrokes that triggered it,
 * and a cached "available" from thirty seconds ago would wave through a code
 * another admin took meanwhile. So it calls the generated SDK function
 * directly: one request, one answer, nothing stored.
 *
 * It is debounced rather than fired per keystroke — the legacy screen asked
 * once per character, twelve requests for a thirteen-character code — because
 * the ticket asks for a check that does not fire on every keystroke. Every
 * keystroke resets the timer; only a pause sends anything. A save waits out
 * the pending probe rather than racing it (via {@link UseCompanyCodeProbeReturn.waitForProbe}),
 * and a probe for an abandoned value never overwrites the verdict for the
 * current one.
 *
 * Extracted verbatim from MemberForm.vue when the fourth screen was nowhere in
 * sight but the logic was subtle enough to want unit tests of its own; see
 * its spec for what each piece of bookkeeping buys.
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

  /** Whether this code owes the backend a verdict at all. */
  function shouldProbe(value: string): boolean {
    return value.length >= 2 && value !== originalCompanycode.value
  }

  // The code as of a pause after typing stopped — the only moment at which
  // asking is worth anything. The debouncer lives in this scope, so an
  // unmounted form takes its pending timer with it.
  const companycodeAtRest = refDebounced(computed(companycode), debounceMs)

  // Scheduling is immediate even though asking is not: the moment a code owes
  // a verdict, the save also owes a barrier to wait behind — `pendingProbe`
  // must exist before the debounce fires, or a fast Submit would race it.
  let settleLatestProbe = () => {}

  watch(companycode, (value) => {
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

  // A probe for an abandoned value never overwrites the verdict for the
  // current one: only an answer for the code still in the field may speak.
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
      // A failed probe says nothing about availability; the backend
      // re-validates uniqueness on save regardless.
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
