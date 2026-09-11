import { ref, useTemplateRef } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import type { UseMutationOptions } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'

export interface ConfirmModal {
  show: () => void
  hide: () => void
}

interface ConfirmEvent {
  preventDefault: () => void
}

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
