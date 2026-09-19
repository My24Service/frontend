import { companyUsernameExistsRetrieve } from '@/api/sdk.gen'
import {
  useAvailabilityProbe,
  type UseAvailabilityProbeReturn,
} from '@/features/forms/use-availability-probe'

import { USERNAME_PROBE_DEBOUNCE_MS } from './user-form'

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
