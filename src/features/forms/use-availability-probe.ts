import { computed, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import type { ComputedRef, Ref } from 'vue'

/** idle -> checking -> available|taken; a fresh keystroke restarts the path. */
export type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken'

export interface UseAvailabilityProbeConfig {
  /** Live read of the probed field. */
  read: () => string
  /** The value of the record under edit; an unchanged value owes no verdict. */
  original: Ref<string | null>
  /** Whether the value owes a verdict at all. */
  shouldProbe: (value: string) => boolean
  /** The availability fetch; resolves true when the value is free. */
  check: (value: string) => Promise<boolean>
  /** Injectable for specs; production uses the ticketed half-second. */
  debounceMs: number
}

export interface UseAvailabilityProbeReturn {
  /** idle -> checking -> available|taken; a fresh keystroke restarts the path. */
  state: Ref<AvailabilityState>
  /** The verdict as the input colour: taken red, available green, else neutral. */
  validationState: ComputedRef<boolean | undefined>
  /**
   * Resolves when the probe for the current value has settled — the barrier a
   * save waits behind before asking the user to submit an unverified value.
   */
  waitForProbe: () => Promise<void>
}

export function useAvailabilityProbe({
  read,
  original,
  shouldProbe,
  check,
  debounceMs,
}: UseAvailabilityProbeConfig): UseAvailabilityProbeReturn {
  const state = ref<AvailabilityState>('idle')
  let pendingProbe: Promise<void> = Promise.resolve()
  let settleCurrentProbe = () => {}
  let sequence = 0

  const valueAtRest = refDebounced(computed(read), debounceMs)

  watch(read, (value) => {
    sequence += 1
    settleCurrentProbe()
    if (!shouldProbe(value) || value === original.value) {
      state.value = 'idle'
      pendingProbe = Promise.resolve()
      return
    }

    state.value = 'checking'
    pendingProbe = new Promise<void>((resolve) => {
      settleCurrentProbe = resolve
    })
  })

  watch(valueAtRest, async (value) => {
    if (!shouldProbe(value) || value !== read() || value === original.value) return
    const token = sequence
    let available: boolean
    try {
      available = await check(value)
    } catch {
      if (token === sequence && value === read()) state.value = 'idle'
      if (token === sequence) settleCurrentProbe()
      return
    }
    if (token === sequence && value === read()) {
      state.value = available ? 'available' : 'taken'
      settleCurrentProbe()
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

/**
 * Merges a taken verdict into the submit-time errors: when the probed field
 * changed and the probe says taken, the field refuses with the message.
 */
export function mergeTakenVerdict<TErrors extends Record<string, string | undefined>>(
  errors: TErrors,
  { probe, read, original, field, message }: {
    probe: Pick<UseAvailabilityProbeReturn, 'state'>
    read: () => string
    original: Ref<string | null>
    field: Extract<keyof TErrors, string>
    message: () => string
  },
): void {
  if (read() !== original.value && probe.state.value === 'taken') {
    errors[field] = message() as TErrors[Extract<keyof TErrors, string>]
  }
}
