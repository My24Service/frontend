import type { QueryClient } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { useConfirmedAction } from './use-confirmed-action'

/**
 * What a list's delete needs of a generated resource: its destroy, and the
 * reads a delete makes stale. Any `Api.<Resource>` with a destroy is one.
 */
export interface DeletableResource {
  readonly destroy: Api.ResourceWrite
  invalidate(queryClient: QueryClient): Promise<unknown>
}

export function useListDelete({
  resource,
  invalidate,
  copy,
}: {
  resource: DeletableResource
  /**
   * Given when a delete stales more, or other, reads than the resource's own -
   * a hand-written `invalidation.ts`. Defaults to `resource.invalidate`.
   */
  invalidate?: (queryClient: QueryClient) => Promise<unknown> | void
  /** Toast copy, translated at the call site like everywhere else in the Slice. */
  copy: {
    deletedDetail: string
    deleteError: string
  }
}) {
  const queryClient = useQueryClient()
  const {create} = useToast()

  // 'deleteModal' is the `b-modal` ref of the ListDeleteModal this is wired
  // from — the shell component owns the modal, so the name is its own.
  const {confirm: showDeleteModal, handleOk: handleDeleteOk} = useConfirmedAction({
    modalRefName: 'deleteModal',
    mutationOptions: () => ({
      // `as` because `ResourceWrite` types the factory loosely enough to admit
      // every resource's; the composable supplies its own callbacks anyway.
      ...(resource.destroy.mutation() as UseMutationOptions<unknown, AxiosError, unknown>),
      onSuccess: async () => {
        infoToast(create, $trans('Deleted'), copy.deletedDetail)
        await (invalidate ? invalidate(queryClient) : resource.invalidate(queryClient))
      },
      onError: () => {
        errorToast(create, copy.deleteError)
      },
    }),
  })

  // Only these two leave the composable: a screen reaches the modal through
  // its own `ListDeleteModal` template ref, not through this one.
  return {showDeleteModal, handleDeleteOk}
}
