import type { QueryClient } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { errorToast, infoToast, $trans } from '@/services/i18n'
import { useConfirmedAction } from './use-confirmed-action'

export function useListDelete({
  destroyMutation,
  invalidateAfterDelete,
  copy,
}: {
  // `any` for the mutation's data/error/variables is intentional at this
  // seam: the generated factory's response, error and variables types are per
  // resource, and restating them here would reject exactly the factories this
  // exists to accept.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  destroyMutation: () => UseMutationOptions<any, AxiosError<any>, any>
  invalidateAfterDelete: (queryClient: QueryClient) => Promise<unknown> | void
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
      ...destroyMutation(),
      onSuccess: async () => {
        infoToast(create, $trans('Deleted'), copy.deletedDetail)
        await invalidateAfterDelete(queryClient)
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
