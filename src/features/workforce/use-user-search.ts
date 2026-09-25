import { useQueryErrorToast } from '@/features/forms'
/**
 * The "type to search a user" picker the leave and sick-leave forms both carry.
 *
 * `/api/company/user-list/` is the tenant-wide people search: `q` is a
 * case-insensitive substring of the username or either name, and the answer is a
 * bare array of `{id, name, email, submodel_id}` rather than a page. It is the
 * one read both forms make of the same endpoint, so it lives at the slice root
 * rather than inside either sub-folder - a sub-folder may not import from its
 * sibling.
 *
 * The term is debounced by 500 ms, which is what the legacy screens' shared
 * `AwesomeDebouncePromise(..., 500)` did, and the query is off until something
 * has been typed: an empty `q` is the whole user list, not a search.
 */
export function useUserSearch() {
  const term = ref('')
  const queryTerm = refDebounced(term, 500)

  const search = useQuery(() => ({
    ...Api.CompanyUserList.list.options({query: {q: queryTerm.value}}),
    enabled: queryTerm.value.length > 0,
  }))

  useQueryErrorToast(search.error, $trans('Error fetching users'))

  return {
    /** Bind to the picker's `search-change`. */
    term,
    options: computed(() => search.data.value ?? []),
    loading: computed(() => search.isFetching.value),
  }
}
