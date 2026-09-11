import type { Ref } from 'vue'

import { memberCompanycodeExistsRetrieve } from '@/api/sdk.gen'
import {
  useAvailabilityProbe,
  type UseAvailabilityProbeReturn,
} from '@/features/forms/use-availability-probe'

import { COMPANYCODE_DEBOUNCE_MS } from './schemas'

export function useCompanyCodeProbe(
  companycode: () => string,
  originalCompanycode: Ref<string | null>,
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
