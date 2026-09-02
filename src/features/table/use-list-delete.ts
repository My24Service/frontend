import { ref, useTemplateRef } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { QueryClient, UseMutationOptions } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { useToast } from 'bootstrap-vue-next'

import { errorToast, infoToast, $trans } from '@/utils'

/**
 * The delete flow every list screen shares: a confirm modal, the destroy
 * mutation, its toast pair and the post-delete invalidation.
 *
 * Extracted from the wiring inside the Slices' former `paged-list-screen.ts`
 * (deleted with the b-table list screens) when the TanStack
 * table screen needed the same flow — the modal is opened imperatively by
 * the row's delete icon (`showDeleteModal`) and its `@ok` runs `doDelete`.
 * The generated `xxxDestroyMutation` factory arrives typed per resource;
 * this composable only spreads it and fires `{path: {id}}`.
 */
export function useListDelete({
  destroyMutation,
  invalidateAfterDelete,
  copy,
}: {
  // `any` for the mutation's data/error/variables the way
  // `paged-list-screen.ts` did at this seam: the generated factory's
  // response, error and variables types are per resource — the customer
  // destroy's variables even include the session-auth headers the factory
  // bakes in — and restating them here would reject exactly the factories
  // this exists to accept.
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

  /** b-modal's imperative handle — the screen's template owns the modal itself. */
  const deleteModal = useTemplateRef<{show: () => void; hide: () => void}>('deleteModal')
  const deletingPk = ref<number | null>(null)

  const deleteMutation = useMutation({
    ...destroyMutation(),
    onSuccess: async () => {
      infoToast(create, $trans('Deleted'), copy.deletedDetail)
      await invalidateAfterDelete(queryClient)
    },
    onError: () => {
      errorToast(create, copy.deleteError)
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

  return {deleteModal, deletingPk, showDeleteModal, doDelete}
}
