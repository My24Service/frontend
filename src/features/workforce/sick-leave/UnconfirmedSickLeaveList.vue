<template>
  <div class="app-page">
    <ServerTable
      v-model:search-draft="searchDraft"
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :title="$trans('Unconfirmed sick leave')"
      :search-label="$trans('Search unconfirmed sick leave')"
      :label="$trans('Unconfirmed sick leave')"
      :empty-text="$trans('No unconfirmed sick leave found')"
      :refresh="refresh"
    >
      <template #subnav><SubNav /></template>
      <template #icon><IBiFileEarmarkCheckFill /></template>
    </ServerTable>

    <b-modal
      id="confirm-leave-modal"
      ref="confirm-leave-modal"
      :title="$trans('Mark leave as confirmed')"
      @ok="handleConfirmOk"
    >
      <p class="my-4">{{ $trans('Are you sure you want to mark this sick leave as confirmed?') }}</p>
    </b-modal>
  </div>
</template>

<script setup lang="ts">
import { hLink } from '@/components/render'
import IBiCheckLg from '~icons/bi/check-lg'
import {
  companyUserSickLeaveAdminAllUnconfirmedListOptions,
  companyUserSickLeaveAdminSetConfirmedCreateMutation,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedUserSickLeaveList } from '@/api/types.gen'
import { CompanyUserSickLeaveAdmin } from '@/api/resources.gen'
import { ServerTable, baseListParams, createAppColumnHelper, useConfirmedAction, useServerTable, type ListRow } from '@/features/table'
import SubNav from '../SubNav.vue'

/**
 * The sick leave nobody has confirmed yet, with the confirmation as its one row
 * action. The modal id, its title, its body copy and the toast pair are the
 * legacy screen's.
 *
 * The action declares no body, so only the path rides - the legacy model sent
 * an empty object through a CSRF handshake of its own. The row's user cell is
 * plain text, as the legacy screen's actually rendered: its `cell(full_name)`
 * template was dead because the column's field is `user_full_name`.
 */
type SickLeaveRow = ListRow<PaginatedUserSickLeaveList>

const queryClient = useQueryClient()
const {create: toast} = useToast()

const helper = createAppColumnHelper<SickLeaveRow>()

function renderDate(row: SickLeaveRow): string {
  if (!row.end_date) return `${row.start_date ?? ''}`
  return `${row.start_date ?? ''} - ${row.end_date}`
}

const columns = helper.columns([
  helper.accessor('user_full_name', {
    header: $trans('User'),
  }),
  helper.display({
    id: 'date',
    header: $trans('Date'),
    enableSorting: false,
    cell: ({row}) => renderDate(row.original),
  }),
  helper.accessor('created_by_fullname', {
    header: $trans('Created by'),
  }),
  helper.accessor('created', {
    header: $trans('Created'),
  }),
  helper.accessor('last_status_full', {
    header: $trans('Status'),
  }),
  helper.display({
    id: 'icons',
    header: '',
    enableSorting: false,
    cell: ({row}) => h('div', {class: 'h2 float-end'}, [
      hLink({
        title: $trans('Confirm'),
        onClick: () => showConfirmModal(row.original.id),
      }, () => h(IBiCheckLg, {class: 'edit-icon'})),
    ]),
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<SickLeaveRow>({
  key: 'unconfirmed-sick-leave-table',
  columns,
  enableSorting: false,
  listOptions: (query) => companyUserSickLeaveAdminAllUnconfirmedListOptions({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading unconfirmed sick leave request'),
})

/**
 * Run the confirmation and close its modal. A failed write keeps the modal
 * open - the user retries or cancels - and has already been reported by the
 * mutation's own `onError`. The kit additionally guards against a
 * double-confirm while the write is pending.
 */
const {confirm: showConfirmModal, handleOk: handleConfirmOk} = useConfirmedAction({
  modalRefName: 'confirm-leave-modal',
  mutationOptions: () => ({
    ...companyUserSickLeaveAdminSetConfirmedCreateMutation(),
    onSuccess: async () => {
      infoToast(toast, $trans('Accepted'), $trans('Leave as been marked as confirmed'))
      await CompanyUserSickLeaveAdmin.invalidate(queryClient)
    },
    onError: () => errorToast(toast, $trans('Error confirming sick leave')),
  }),
})
</script>

<style scoped>
.edit-icon {
  margin-right: 20px;
}
</style>
