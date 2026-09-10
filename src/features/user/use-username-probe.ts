import type { Ref } from 'vue'

import client from '@/services/api'
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
      // username-exists declares no query parameters, so the generated op's own
      // request validator rejects the needed request before it leaves. The probe
      // rides the shared axios instance directly — the legacy helper sent
      // `?username=` the same way. Raw-axios traffic never reaches the strict
      // seam, so the probe spec answers at the instance (see its beforeEach),
      // not through api.get. The value rides `params` so axios encodes it — a
      // `+` in a username must not decode to a space.
      const response = await client.get('/company/username-exists/', {
        params: { username: value },
      })
      return response.data['available'] as boolean
    },
    debounceMs,
  })
}

export type UseUsernameProbeReturn = UseAvailabilityProbeReturn
