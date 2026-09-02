import { ref, useTemplateRef } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { QueryClient, UseMutationOptions } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { useToast } from 'bootstrap-vue-next'

import { errorToast, infoToast, $trans } from '@/utils'

/**
 * See README/ADR.
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
    if (deletingPk.value === null || deleteMutation.isPending.value) return false
    try {
      await deleteMutation.mutateAsync({path: {id: deletingPk.value}})
      return true
    } catch {
      // Already handled: onError told the user and left the row in place.
      return false
    }
  }

  async function handleDeleteOk(bvEvent: {preventDefault: () => void}) {
    bvEvent.preventDefault()
    const ok = await doDelete()
    if (ok) deleteModal.value?.hide()
  }

  return {deleteModal, deletingPk, showDeleteModal, doDelete, handleDeleteOk}
}
