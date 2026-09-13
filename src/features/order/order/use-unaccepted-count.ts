import { watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { orderOrderAllForCustomerNotAcceptedCountRetrieveOptions } from '@/api/@tanstack/vue-query.gen'
import { useMainStore } from '@/stores/main'

/**
 * How many of the customer's orders await acceptance — the badge on the
 * orders sub-navigation reads it from the store, so the count is written
 * there as it arrives. The legacy list re-fetched it on every reload; here
 * it is a query the list refetches alongside its own.
 */
export function useUnacceptedCount() {
  const store = useMainStore()
  const query = useQuery(orderOrderAllForCustomerNotAcceptedCountRetrieveOptions())

  watch(query.data, (data) => {
    if (data && typeof data.count === 'number') store.setUnacceptedCount(data.count)
  }, {immediate: true})

  return {refetch: () => query.refetch()}
}
