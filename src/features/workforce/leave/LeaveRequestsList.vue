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
      @ok="acceptOk"
    >
      <p class="my-4">{{ $trans('Are you sure you want to accept this leave request?') }}</p>
    </b-modal>
    <b-modal
      id="reject-leave-modal"
      ref="reject-leave-modal"
      :title="$trans('Reject request')"
      @ok="rejectOk"
    >
      <p class="my-4">{{ $trans('Are you sure you want to reject this leave request?') }}</p>
    </b-modal>
  </div>
</template>

<script setup lang="ts">
import { BLink } from 'bootstrap-vue-next'
import IBiCheckLg from '~icons/bi/check-lg'
import IBiFileEarmarkCheckFill from '~icons/bi/file-earmark-check-fill'
import IBiXLg from '~icons/bi/x-lg'
import {
  companyUserLeaveHoursAdminAllNotAcceptedListOptions,
  companyUserLeaveHoursAdminSetAcceptedCreateMutation,
  companyUserLeaveHoursAdminSetRejectedCreateMutation,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedUserLeaveHoursList } from '@/api/types.gen'
import { ServerTable, baseListParams, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import { errorToast, infoToast, $trans } from '@/services/i18n'
import SubNav from '../SubNav.vue'
import { invalidateLeaveLists } from './invalidation'

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
type LeaveRequestRow = ListRow<PaginatedUserLeaveHoursList>

const queryClient = useQueryClient()
const {create: toast} = useToast()

const acceptModal = useTemplateRef<{show: () => void; hide: () => void}>('accept-leave-modal')
const rejectModal = useTemplateRef<{show: () => void; hide: () => void}>('reject-leave-modal')
const pendingId = ref<number | null>(null)

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
      h(BLink, {
        title: $trans('Accept'),
        onClick: () => showDecision(acceptModal, row.original.id),
      }, () => h(IBiCheckLg, {class: 'edit-icon'})),
      h(BLink, {
        title: $trans('Reject'),
        onClick: () => showDecision(rejectModal, row.original.id),
      }, () => h(IBiXLg, {class: 'edit-icon'})),
    ]),
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<LeaveRequestRow>({
  key: 'leave-request-table',
  columns,
  enableSorting: false,
  listOptions: (query) => companyUserLeaveHoursAdminAllNotAcceptedListOptions({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading leave requests'),
})

function showDecision(modal: typeof acceptModal, id: number) {
  pendingId.value = id
  modal.value?.show()
}

const accept = useMutation({
  ...companyUserLeaveHoursAdminSetAcceptedCreateMutation(),
  onSuccess: async () => {
    infoToast(toast, $trans('Accepted'), $trans('Leave as been accepted'))
    await invalidateLeaveLists(queryClient)
  },
  onError: () => errorToast(toast, $trans('Error accepting leave')),
})

const reject = useMutation({
  ...companyUserLeaveHoursAdminSetRejectedCreateMutation(),
  onSuccess: async () => {
    infoToast(toast, $trans('Rejected'), $trans('Leave as been rejected'))
    await invalidateLeaveLists(queryClient)
  },
  onError: () => errorToast(toast, $trans('Error rejecting leave')),
})

/**
 * Run the confirmed decision and close its modal. A failed write keeps the
 * modal open - the user retries or cancels - and has already been reported by
 * the mutation's own `onError`.
 */
async function decide(
  mutation: typeof accept,
  modal: typeof acceptModal,
  event: {preventDefault: () => void},
): Promise<void> {
  event.preventDefault()
  if (pendingId.value === null) return
  try {
    await mutation.mutateAsync({path: {id: pendingId.value}})
    modal.value?.hide()
  } catch {
    // Reported by the mutation.
  }
}

function acceptOk(event: {preventDefault: () => void}) {
  return decide(accept, acceptModal, event)
}

function rejectOk(event: {preventDefault: () => void}) {
  return decide(reject, rejectModal, event)
}
</script>

<style scoped>
.edit-icon {
  margin-right: 20px;
}
</style>
