import { memberCompanycodeExistsRetrieve } from '@/api/sdk.gen'
import {
  useAvailabilityProbe,
  type UseAvailabilityProbeReturn,
} from '@/features/forms'

import { typingDelay } from '@/services/input-delays'

export function useCompanyCodeProbe(
  companycode: () => string,
  originalCompanycode: Ref<string | null>,
  { debounceMs = typingDelay }: { debounceMs?: MaybeRefOrGetter<number> } = {},
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
