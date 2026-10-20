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
import { useListDelete, type DeletableResource } from './use-list-delete'

const props = defineProps<{
  /** The `b-modal` id — kept per screen for the legacy DOM id (`delete-xxx-modal`). */
  modalId: string
  /** e.g. "Are you sure you want to delete this customer?" */
  confirmText: string
  /** The resource whose row is deleted: `Api.CompanyBranch`. */
  resource: DeletableResource
  /** Only when a delete stales other reads than the resource's own; see `useListDelete`. */
  invalidate?: (queryClient: QueryClient) => Promise<unknown> | void
  deletedDetail: string
  deleteError: string
}>()

const {showDeleteModal, handleDeleteOk} = useListDelete({
  resource: props.resource,
  invalidate: props.invalidate,
  copy: {deletedDetail: props.deletedDetail, deleteError: props.deleteError},
})

defineExpose({showDeleteModal})
</script>
