<template>
  <div class="app-page">
    <b-modal
      id="accept-received-partner-request-modal"
      ref="acceptModal"
      :title="$trans('Accept?')"
      @ok="handleAcceptOk"
    >
      <p class="my-4">{{ $trans('Are you sure you want to accept this partner request?') }}</p>
    </b-modal>

    <b-modal
      id="reject-received-partner-request-modal"
      ref="rejectModal"
      :title="$trans('Reject?')"
      @ok="handleRejectOk"
    >
      <p class="my-4">{{ $trans('Are you sure you want to reject this partner request?') }}</p>
    </b-modal>

    <ServerTable
      ref="tableRef"
      v-model:search-draft="searchDraft"
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :title="$trans('Partners')"
      :search-label="$trans('Search partner requests')"
      :label="$trans('Request')"
      :empty-text="$trans('No partner requests found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-received-partner-request-modal',
        confirmText: $trans('Are you sure you want to delete this partner request?'),
        destroyMutation: companyPartnerRequestDestroyMutation,
        invalidate: invalidateReads(companyPartnerRequestReceived),
        deletedDetail: $trans('Partner request has been deleted'),
        deleteError: $trans('Error deleting partner request'),
      }"
    >
      <template #icon><IBiPersonSquare /></template>
      <template #subnav><PillsNav :items="partnerPills" /></template>
      <template #add>
        <router-link
          :to="{name: 'partner-request-add'}"
          class="btn"
        >{{ $trans('New partner request') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { BButton } from 'bootstrap-vue-next'
import {
  companyPartnerRequestAcceptPartialUpdateMutation,
  companyPartnerRequestDestroyMutation,
  companyPartnerRequestReceivedListOptions,
  companyPartnerRequestRejectPartialUpdateMutation,
} from '@/api/@tanstack/vue-query.gen'
import type { PillNavItem } from '@/components/PillsNav.vue'
import RowAction from '@/components/RowAction.vue'
import { ServerTable, baseListParams, createAppColumnHelper, useConfirmedAction, useServerTable, type ListRow } from '@/features/table'
import { errorToast, infoToast, $trans } from '@/services/i18n'
import type { PaginatedPartnerRequestList } from '@/api/types.gen'
import { companyPartner, companyPartnerRequestReceived } from '@/api/resources.gen'
import { invalidateReads } from '@/features/forms/use-resource-form'
import { partnerColumns } from './partner-columns'

const partnerPills: PillNavItem[] = [
  { label: $trans('Active'), to: { name: 'company-partners-active' } },
  { label: $trans('Requests sent'), to: { name: 'company-partners-requests-sent' } },
  { label: $trans('Requests received'), to: { name: 'company-partners-requests-received' } },
]

/**
 * The partner requests other tenants sent this one. A requested row offers
 * Accept and Reject; any other status offers Delete. Accepting births the
 * partner relation, so it invalidates the partners list too.
 *
 * Two legacy copy slips are fixed rather than preserved: the reject dialog
 * was titled "Accept?", and a failed load reported the *sent* list.
 */
type RequestRow = ListRow<PaginatedPartnerRequestList>

const queryClient = useQueryClient()
const { create: toast } = useToast()

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const helper = createAppColumnHelper<RequestRow>()

const memberColumns = partnerColumns(helper, 'from_member_view')

const columns = helper.columns([
  memberColumns.name,
  memberColumns.companycode,
  memberColumns.city,
  memberColumns.email,
  helper.accessor('status', {
    header: $trans('Status'),
  }),
  helper.accessor('created', {
    header: $trans('Created'),
  }),
  helper.display({
    id: 'icons',
    header: '',
    enableSorting: false,
    cell: ({ row }) => {
      if (row.original.status === 'requested') {
        return h('div', { class: 'h2 float-right' }, [
          h(BButton, {
            type: 'button',
            size: 'sm',
            variant: 'secondary',
            onClick: () => showAcceptModal(row.original.id),
          }, () => $trans('Accept')),
          ' ',
          h(BButton, {
            type: 'button',
            size: 'sm',
            variant: 'warning',
            onClick: () => showRejectModal(row.original.id),
          }, () => $trans('Reject')),
        ])
      }
      return h('div', { class: 'h2 float-right' }, [
        h(RowAction, {icon: 'delete',
          title: $trans('Delete'),
          method: () => tableRef.value?.showDeleteModal(row.original.id),
        }),
      ])
    },
  }),
])

const { table, searchDraft, pagination, count, isLoading, isFetching, refresh } = useServerTable<RequestRow>({
  key: 'partner-requests-received-table',
  columns,
  listOptions: (query) => companyPartnerRequestReceivedListOptions({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading partner requests received'),
})

const { confirm: showAcceptModal, handleOk: handleAcceptOk } = useConfirmedAction({
  modalRefName: 'acceptModal',
  mutationOptions: () => ({
    ...companyPartnerRequestAcceptPartialUpdateMutation(),
    onSuccess: async () => {
      infoToast(toast, $trans('Accepted'), $trans('Partner request has been accepted'))
      await invalidateReads(companyPartnerRequestReceived)(queryClient)
      await invalidateReads(companyPartner)(queryClient)
    },
    onError: () => {
      errorToast(toast, $trans('Error accepting partner request'))
    },
  }),
})

const { confirm: showRejectModal, handleOk: handleRejectOk } = useConfirmedAction({
  modalRefName: 'rejectModal',
  mutationOptions: () => ({
    ...companyPartnerRequestRejectPartialUpdateMutation(),
    onSuccess: async () => {
      infoToast(toast, $trans('Rejected'), $trans('Partner request has been rejected'))
      await invalidateReads(companyPartnerRequestReceived)(queryClient)
    },
    onError: () => {
      errorToast(toast, $trans('Error rejecting partner request'))
    },
  }),
})
</script>
