import { ref, useTemplateRef } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import type { UseMutationOptions } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'

/** `b-modal`'s imperative handle — the screen's template owns the modal itself. */
export interface ConfirmModal {
  show: () => void
  hide: () => void
}

/**
 * What `b-modal` hands its `ok` listener: the event whose default is the
 * automatic hide, which the handler prevents so a failed action leaves the
 * modal up.
 */
interface ConfirmEvent {
  preventDefault: () => void
}

/**
 * A confirmed action: a modal asks the user to confirm acting on one row, and
 * closes only once the action succeeded.
 *
 * It owns the three pieces every such flow repeats — the modal handle looked
 * up by template-ref name, the row id awaiting confirmation, and the `ok`
 * handler that guards against a second submit while the first is in flight.
 * The mutation stays at the call site, toasted and invalidated there, because
 * what a successful action means is the resource's own business.
 *
 * `useListDelete` (the delete flow behind `ListDeleteModal`) is built on
 * this, and so is the API-user list's revoke — the screen whose list has a
 * second confirmed action.
 */
export function useConfirmedAction({
  mutationOptions,
  modalRefName,
}: {
  /**
   * The mutation the confirmation runs, as the options `useMutation` takes.
   * Pass a factory so the composable calls it once, at setup, exactly as the
   * call site would.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutationOptions: () => UseMutationOptions<any, AxiosError<any>, any>
  /**
   * The template-ref name of the `b-modal` the screen owns — the modal stays
   * in the screen's markup, where its copy is.
   */
  modalRefName: string
}) {
  const modal = useTemplateRef<ConfirmModal>(modalRefName)
  const pendingId = ref<number | null>(null)

  const mutation = useMutation(mutationOptions())

  /** Open the confirmation for one row. */
  function confirm(id: number) {
    pendingId.value = id
    modal.value?.show()
  }

  /**
   * Run the action for the pending row. `false` means either nothing ran — no
   * row was confirmed, or the first submit is still in flight — or the
   * mutation failed, in which case its own `onError` has already told the
   * user; the modal then stays up, which is the contract, not a silent
   * swallow.
   */
  async function run(): Promise<boolean> {
    if (pendingId.value === null || mutation.isPending.value) return false
    try {
      await mutation.mutateAsync({path: {id: pendingId.value}})
      return true
    } catch {
      return false
    }
  }

  async function handleOk(bvEvent: ConfirmEvent) {
    bvEvent.preventDefault()
    if (await run()) modal.value?.hide()
  }

  return {confirm, handleOk}
}
