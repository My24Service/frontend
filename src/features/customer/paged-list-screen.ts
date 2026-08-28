import { computed, ref, useTemplateRef, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type {
  DefaultError,
  QueryClient,
  UseMutationOptions,
  UseQueryReturnType,
} from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { useToast } from 'bootstrap-vue-next'

import { errorToast, infoToast, $trans } from '@/utils'
import { useRoutePagedList } from './route-paged-list'

/**
 * The screen skeleton the Customer list shares with every other rewritten
 * list, on top of the URL state in `useRoutePagedList`: search-modal wiring,
 * the delete flow with its toast pair and invalidation, the load-error
 * watcher, the busy/rows/count trio, the sort-state plumbing and refresh.
 * Copied from the Member Slice's `paged-list-screen.ts` (#324) and extended
 * with the Customer list's sort.
 *
 * The per-resource remainder stays visible at each call site: the generated
 * options/mutation factories, the invalidation helper and the copy. Nothing
 * here knows a resource by name.
 */

/** Page and optional search term — the wire query every list folds into its key. */
export interface PagedListQuery {
  page: number
  q?: string
}

/** The paged envelope every list response in this Slice shares. */
export interface PagedListResponse {
  count?: number
  results?: readonly unknown[]
}

/**
 * `useQuery` at the one seam where this composable touches tanstack's option
 * types. The options object arrives straight from a generated factory whose
 * query-key tuple only that factory knows; restating the tuple here would
 * reject exactly the objects this exists to accept. The seam is cast once;
 * the response type is named by each call site instead.
 */
function useListQuery<TResult extends PagedListResponse>(
  options: MaybeRefOrGetter<unknown>,
): UseQueryReturnType<TResult, AxiosError<DefaultError>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useQuery(options as any) as UseQueryReturnType<TResult, AxiosError<DefaultError>>
}

export interface PagedListScreenConfig {
  /**
   * This resource's generated `xxxListOptions` factory, handed the
   * route-derived page and search term. Anything extra closes over its own
   * reactive reads here; they are tracked where the result is turned into a
   * query key below.
   */
  listOptions: (query: PagedListQuery) => unknown

  /**
   * This resource's generated destroy-mutation factory. The data parameter is
   * whatever the endpoint answers with (usually void); the composable only
   * spreads it and fires `{path: {id}}`. The variables stay `any` because the
   * generated factories type their own — per-resource — options shape (the
   * customer destroy wants its session-auth header, typed at the call site).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  destroyMutation: () => UseMutationOptions<any, AxiosError<any>, any>

  /** Runs after a successful delete — invalidate this resource's list queries here. */
  invalidateAfterDelete: (queryClient: QueryClient) => Promise<unknown> | void

  /** Toast copy, translated at the call site like everywhere else in the Slice. */
  copy: {
    loadError: string
    deletedDetail: string
    deleteError: string
  }
}

export function usePagedListScreen<TResult extends PagedListResponse>(
  config: PagedListScreenConfig,
) {
  const queryClient = useQueryClient()
  const { create } = useToast()

  // Page, search term and the URL sort live in the route; only this
  // composable and the pagination block need them.
  const { page, searchQuery, sortField, sortDir, handleSearchTerm, handleSort } =
    useRoutePagedList()

  /** What the skeleton needs of the two modals — b-modal's imperative handle. */
  const searchModal = useTemplateRef<{show: () => void; hide: () => void}>('searchModal')
  const deleteModal = useTemplateRef<{show: () => void; hide: () => void}>('deleteModal')

  const listOptions = computed(() =>
    config.listOptions({
      page: page.value,
      ...(searchQuery.value ? {q: searchQuery.value} : {}),
    }),
  )
  const listQuery = useListQuery<TResult>(listOptions)

  watch(
    () => listQuery.error.value,
    (error) => {
      if (error) errorToast(create, config.copy.loadError)
    },
  )

  const isLoading = computed(() => listQuery.isLoading.value)
  const items = computed(
    (): NonNullable<TResult['results']> => listQuery.data.value?.results ?? [],
  )
  const count = computed(() => listQuery.data.value?.count ?? 0)

  /**
   * The sort state as the table wants it. The URL is the source of truth —
   * the same place the legacy screen kept it — and the column that starts
   * sorted is the screen's own default (`name` ascending), exactly as the
   * legacy `sortBy` data initialised it.
   */
  const sortBy = computed<Array<{key: string; order: 'asc' | 'desc'}>>(() => [
    {key: sortField.value ?? 'name', order: sortDir.value},
  ])

  /** A header click: the direction toggles from the table's own event
   * (the b-table's `sorted` payload). */
  async function sortingChanged(ctx: {key: string; order: 'desc' | 'asc' | undefined}) {
    await handleSort(ctx.key, ctx.order ?? 'asc')
  }

  // search
  function handleSearchOk(val: string | null) {
    searchModal.value?.hide()
    handleSearchTerm(val)
  }

  function showSearchModal() {
    searchModal.value?.show()
  }

  // delete
  const deletingPk = ref<number | null>(null)

  const deleteMutation = useMutation({
    ...config.destroyMutation(),
    onSuccess: async () => {
      infoToast(create, $trans('Deleted'), config.copy.deletedDetail)
      await config.invalidateAfterDelete(queryClient)
    },
    onError: () => {
      errorToast(create, config.copy.deleteError)
    },
  })

  function showDeleteModal(id: number) {
    deletingPk.value = id
    deleteModal.value?.show()
  }

  async function doDelete() {
    if (deletingPk.value === null || deleteMutation.isPending.value) return
    try {
      await deleteMutation.mutateAsync({path: {id: deletingPk.value}})
    } catch {
      // Already handled: onError told the user and left the row in place.
    }
  }

  // refresh
  function refresh() {
    listQuery.refetch()
  }

  return {
    searchModal,
    deleteModal,
    isLoading,
    items,
    count,
    sortBy,
    sortingChanged,
    showSearchModal,
    handleSearchOk,
    showDeleteModal,
    doDelete,
    refresh,
  }
}
