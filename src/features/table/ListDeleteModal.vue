<template>
  <b-modal
    :id="modalId"
    ref="deleteModal"
    :title="$trans('Delete?')"
    @ok.prevent="handleDeleteOk"
  >
    <p class="my-4">{{ confirmText }}</p>
  </b-modal>
</template>

<script lang="ts" setup>
import type { QueryClient, UseMutationOptions } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { $trans } from '@/services/i18n'
import { useListDelete } from './use-list-delete'

/**
 * The delete confirm modal every list screen repeats, owning the
 * `useListDelete` wiring alongside its `b-modal` — the screen passes only
 * the confirm copy, the destroy mutation and the post-delete invalidation.
 * `showDeleteModal` is exposed so the screen's icon column (built by
 * `createActionColumn`) can trigger it via a template ref. `ServerTable`
 * renders this modal and forwards the handle, so the call the screen makes is
 * `tableRef.value?.showDeleteModal(id)`.
 *
 * Wired to this branch's `useListDelete`, which takes a single options
 * argument and looks up the modal by the template-ref name `'deleteModal'`
 * on the calling component — so the `ref` below is that exact name, and the
 * `@ok` handler is the composable's `handleDeleteOk` (which prevents the
 * modal's default hide, runs the guarded `doDelete`, and hides only on
 * success). Renaming the ref or bypassing `handleDeleteOk` silently breaks
 * the double-fire and failure-toast guards: keep both as they are.
 */
const props = defineProps<{
  /** The `b-modal` id — kept per screen for the legacy DOM id (`delete-xxx-modal`). */
  modalId: string
  /** e.g. "Are you sure you want to delete this customer?" */
  confirmText: string
  // `any` for the mutation's data/error/variables — see use-list-delete.ts's
  // matching note; a generated destroy-mutation factory's shape is
  // per-resource and restating it here would reject exactly the factories
  // this exists to accept. (No eslint-disable: the TS rules only cover
  // *.ts, so `any` in an SFC script block is unlinted.)
  destroyMutation: () => UseMutationOptions<any, AxiosError<any>, any>
  invalidate: (queryClient: QueryClient) => Promise<unknown> | void
  deletedDetail: string
  deleteError: string
}>()

const {showDeleteModal, handleDeleteOk} = useListDelete({
  destroyMutation: props.destroyMutation,
  invalidateAfterDelete: props.invalidate,
  copy: {deletedDetail: props.deletedDetail, deleteError: props.deleteError},
})

defineExpose({showDeleteModal})
</script>
