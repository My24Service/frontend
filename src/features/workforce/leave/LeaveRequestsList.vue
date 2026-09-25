<template>
  <div class="app-page">
    <ServerTable
      v-model:search-draft="searchDraft"
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :title="$trans('Leave')"
      :search-label="$trans('Search leave requests')"
      :label="$trans('Leave requests')"
      :empty-text="$trans('No leave requests found')"
      :refresh="refresh"
    >
      <template #subnav><SubNav /></template>
      <template #icon><IBiFileEarmarkCheckFill /></template>
    </ServerTable>

    <b-modal
      id="accept-leave-modal"
      ref="accept-leave-modal"
      :title="$trans('Accept request')"
      @ok="handleAcceptOk"
    >
      <p class="my-4">{{ $trans('Are you sure you want to accept this leave request?') }}</p>
    </b-modal>
    <b-modal
      id="reject-leave-modal"
      ref="reject-leave-modal"
      :title="$trans('Reject request')"
      @ok="handleRejectOk"
    >
      <p class="my-4">{{ $trans('Are you sure you want to reject this leave request?') }}</p>
    </b-modal>
  </div>
</template>

<script setup lang="ts">
import { hLink } from '@/components/render'
import IBiCheckLg from '~icons/bi/check-lg'
import IBiXLg from '~icons/bi/x-lg'

import { ServerTable, createAppColumnHelper, useConfirmedAction, useServerTable, type ListRow } from '@/features/table'
import SubNav from '../SubNav.vue'

/**
 * The leave requests waiting on a planner: the admin `all_not_accepted` list,
 * which the backend narrows to `is_accepted=False AND is_rejected=False`, with
 * accept and reject as row actions.
 *
 * The rows keep the legacy screen's two links and their titles, so the same
 * copy is selected on; the modal ids, their titles and their body copy are the
 * legacy ones too. What is gone is the legacy screen's third modal - a
 * `delete-statuscode-modal` whose body asked about a statuscode and which no
 * row could open.
 *
 * Each decision is a PATCH-free POST the endpoint declares no body for, so only
 * the path rides - a write that invalidates both lists this sub-folder shows.
 */
type LeaveRequestRow = ListRow<Api.PaginatedUserLeaveHoursList>

const queryClient = useQueryClient()
const {create: toast} = useToast()

const helper = createAppColumnHelper<LeaveRequestRow>()

/** "01-02-2026 / 8:0", or a range when the leave spans days - the legacy cell. */
function renderDate(row: LeaveRequestRow): string {
  const clock = `${row.total_hours ?? 0}:${row.total_minutes ?? 0}`
  if (row.start_date === row.end_date) return `${row.start_date} / ${clock}`
  return `${row.start_date} - ${row.end_date} / ${clock}`
}

const columns = helper.columns([
  helper.accessor('full_name', {
    header: $trans('User'),
  }),
  helper.display({
    id: 'date',
    header: $trans('Date/hours'),
    enableSorting: false,
    cell: ({row}) => renderDate(row.original),
  }),
  helper.accessor('leave_type_name', {
    header: $trans('Leave type'),
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
        title: $trans('Accept'),
        onClick: () => showAcceptModal(row.original.id),
      }, () => h(IBiCheckLg, {class: 'edit-icon'})),
      hLink({
        title: $trans('Reject'),
        onClick: () => showRejectModal(row.original.id),
      }, () => h(IBiXLg, {class: 'edit-icon'})),
    ]),
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<LeaveRequestRow>({
  key: 'leave-request-table',
  columns,
  enableSorting: false,
  resource: Api.CompanyUserLeaveHoursAdminAllNotAccepted,
  urlSync: true,
  loadError: $trans('Error loading leave requests'),
})

/**
 * Run the confirmed decision and close its modal. A failed write keeps the
 * modal open - the user retries or cancels - and has already been reported by
 * the mutation's own `onError`. The kit additionally guards against a
 * double-confirm while the write is pending.
 */
const {confirm: showAcceptModal, handleOk: handleAcceptOk} = useConfirmedAction({
  modalRefName: 'accept-leave-modal',
  mutationOptions: () => ({
    ...Api.CompanyUserLeaveHoursAdmin.extras.setAcceptedCreate.mutation(),
    onSuccess: async () => {
      infoToast(toast, $trans('Accepted'), $trans('Leave as been accepted'))
      await Api.CompanyUserLeaveHoursAdmin.invalidate(queryClient)
    },
    onError: () => errorToast(toast, $trans('Error accepting leave')),
  }),
})

const {confirm: showRejectModal, handleOk: handleRejectOk} = useConfirmedAction({
  modalRefName: 'reject-leave-modal',
  mutationOptions: () => ({
    ...Api.CompanyUserLeaveHoursAdmin.extras.setRejectedCreate.mutation(),
    onSuccess: async () => {
      infoToast(toast, $trans('Rejected'), $trans('Leave as been rejected'))
      await Api.CompanyUserLeaveHoursAdmin.invalidate(queryClient)
    },
    onError: () => errorToast(toast, $trans('Error rejecting leave')),
  }),
})
</script>

<style scoped>
.edit-icon {
  margin-right: 20px;
}
</style>
