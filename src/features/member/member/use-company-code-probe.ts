import type { Ref } from 'vue'

import { memberCompanycodeExistsRetrieve } from '@/api/sdk.gen'
import {
  useAvailabilityProbe,
  type UseAvailabilityProbeReturn,
} from '@/features/forms/use-availability-probe'

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
  return useAvailabilityProbe({
    read: companycode,
    original: originalCompanycode,
    shouldProbe: (value) => value.length >= 2,
    check: async (value) => {
      const { data, error } = await memberCompanycodeExistsRetrieve({
        query: { companycode: value },
      })
      if (error || !data) throw new Error('companycode probe failed')
      return data.available
    },
    debounceMs,
  })
}

export type UseCompanyCodeProbeReturn = UseAvailabilityProbeReturn
