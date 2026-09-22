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
import type { QueryClient } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { useListDelete } from './use-list-delete'

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
