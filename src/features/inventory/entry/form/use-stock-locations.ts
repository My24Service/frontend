import { useQueryErrorToast } from '@/features/forms'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'

/** Every stock location: the entry's location selects offer the whole collection. */
export function useStockLocations() {
  const query = useQuery(() => Api.InventoryStockLocation.list.options({
    query: {page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE},
  }))
  useQueryErrorToast(query.error, $trans('Error fetching stock locations'))

  return {
    stockLocations: computed(() => query.data.value?.results ?? []),
    isLoading: computed(() => query.isLoading.value),
  }
}
