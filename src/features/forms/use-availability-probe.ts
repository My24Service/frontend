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

// One counter for every probe instance: the query key carries it so a
// username probe and a company-code probe never share a cache entry, even
// for the same string.
let probeInstance = 0

export function useAvailabilityProbe({
  read,
  original,
  shouldProbe,
  check,
  debounceMs,
}: UseAvailabilityProbeConfig): UseAvailabilityProbeReturn {
  const instanceId = ++probeInstance

  const live = computed(read)
  // The VueUse-standard debounce: the value at rest drives the query below.
  const valueAtRest = refDebounced(live, debounceMs)

  const enabled = computed(
    () => shouldProbe(valueAtRest.value) && valueAtRest.value !== original.value,
  )

  // Keyed by the rested value, so a stale answer lands in another entry and
  // can never overwrite the current verdict. No cache: availability moves,
  // and every rest owes a fresh ask, as before. No retries: a failed probe
  // claims nothing rather than guessing.
  const probeQuery = useQuery(() => ({
    queryKey: ['availability-probe', instanceId, valueAtRest.value],
    queryFn: ({ queryKey }) => check(queryKey[2] as string),
    enabled: enabled.value,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  }))

  const state = computed<AvailabilityState>(() => {
    const current = live.value
    if (!shouldProbe(current) || current === original.value) return 'idle'
    // The debounce has not caught up yet, or the query for the rested value
    // has not answered yet.
    if (valueAtRest.value !== current) return 'checking'
    if (probeQuery.isFetching.value || probeQuery.isPending.value) return 'checking'
    if (probeQuery.isError.value) return 'idle'
    if (probeQuery.data.value === true) return 'available'
    if (probeQuery.data.value === false) return 'taken'
    return 'checking'
  })

  /**
   * The barrier for the value under the cursor when called. A fresh
   * keystroke releases it — the save re-arms behind the new value instead
   * of waiting out a verdict nobody needs anymore.
   */
  function waitForProbe(): Promise<void> {
    const captured = live.value
    if (!shouldProbe(captured) || captured === original.value) return Promise.resolve()
    if (
      valueAtRest.value === captured
      && probeQuery.isFetched.value
      && !probeQuery.isFetching.value
    ) {
      return Promise.resolve()
    }
    return new Promise<void>((resolve) => {
      const stop = watch(
        [live, valueAtRest, () => probeQuery.isFetching.value, () => probeQuery.isFetched.value],
        () => {
          if (live.value !== captured) {
            stop()
            resolve()
            return
          }
          if (
            valueAtRest.value === captured
            && probeQuery.isFetched.value
            && !probeQuery.isFetching.value
          ) {
            stop()
            resolve()
          }
        },
      )
    })
  }

  return {
    state,
    validationState: computed(() => {
      if (state.value === 'taken') return false
      if (state.value === 'available') return true
      return undefined
    }),
    waitForProbe,
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
