import type { AxiosError } from 'axios'

import { useQueryErrorToast } from './use-query-error-toast'

const DEBOUNCE_MS = 500

/**
 * A search-as-you-type picker's read: the term typed, debounced half a
 * second, then the list op for it — only while there is a term and the
 * picker applies. What comes back is the options; a failure toasts.
 */
export function useSearch<TData, TKey extends readonly unknown[], TOption>(
  optionsFor: (term: string) => UseQueryOptions<TData, AxiosError<DefaultError>, TData, TData, TKey>,
  enabled: () => boolean,
  errorCopy: string,
  results: (data: TData) => TOption[],
) {
  const term = ref('')
  const queryTerm = refDebounced(term, DEBOUNCE_MS)
  const query = useQuery(() => ({
    ...optionsFor(queryTerm.value),
    enabled: enabled() && queryTerm.value.length > 0,
  }))
  useQueryErrorToast(query.error, errorCopy)
  const options = computed<TOption[]>(() => (query.data.value == null ? [] : results(query.data.value)))
  const loading = computed(() => query.isFetching.value)
  return {term, options, loading}
}
