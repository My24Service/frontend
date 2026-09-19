import type { Statuscode } from '@/api/types.gen'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { useQueryOf } from '@/features/forms/use-query-of'
import { useMainStore } from '@/stores/main'

/**
 * The read both stats periods share: the order-type filter, the query built
 * from it, its error toast, and the tenant's statuscodes the charts colour
 * by. The endpoint and the period parameters differ, so the caller supplies
 * the generated options for the order type.
 */
export function useOrderStatsQuery<TData, TOptions extends {queryKey: readonly unknown[]} = {queryKey: readonly unknown[]}>(
  optionsFor: (orderType: string) => TOptions,
  errorCopy: string,
) {
  const mainStore = useMainStore()
  const orderType = ref('all')
  const query = useQueryOf<TData>(() => ({...optionsFor(orderType.value), enabled: true}))
  useQueryErrorToast(query.error, errorCopy)
  const statuscodes = computed(() => (mainStore.getStatuscodes ?? []) as Statuscode[])
  return {orderType, query, statuscodes}
}
