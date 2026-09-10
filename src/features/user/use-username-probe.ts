import type { Ref } from 'vue'

import { companyUsernameExistsRetrieve } from '@/api/sdk.gen'
import {
  useAvailabilityProbe,
  type UseAvailabilityProbeReturn,
} from '@/features/forms/use-availability-probe'

import { USERNAME_PROBE_DEBOUNCE_MS } from './user-form'

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
  return useAvailabilityProbe({
    read: username,
    original: originalUsername,
    shouldProbe: (value) => value !== '',
    check: async (value) => {
      // The endpoint declares `username` as a required query parameter, so the
      // generated op carries it and the probe asks like its company-code twin
      // does. The value rides the query object the op serializes — encoding is
      // the client's job now — and a `+` in a username must reach the wire
      // percent-encoded rather than decoding to a space.
      const { data, error } = await companyUsernameExistsRetrieve({
        query: { username: value },
      })
      if (error || !data) throw new Error('username probe failed')
      return data.available
    },
    debounceMs,
  })
}

export type UseUsernameProbeReturn = UseAvailabilityProbeReturn
