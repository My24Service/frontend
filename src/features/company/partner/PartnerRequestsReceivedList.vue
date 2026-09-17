<template>
  <div class="app-page">
    <b-modal
      id="accept-received-partner-request-modal"
      ref="acceptModal"
      :title="$trans('Accept?')"
      @ok.prevent="acceptRequest"
    >
      <p class="my-4">{{ $trans('Are you sure you want to accept this partner request?') }}</p>
    </b-modal>

    <b-modal
      id="reject-received-partner-request-modal"
      ref="rejectModal"
      :title="$trans('Reject?')"
      @ok.prevent="rejectRequest"
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
        invalidate: invalidatePartnerRequestReceivedList,
        deletedDetail: $trans('Partner request has been deleted'),
        deleteError: $trans('Error deleting partner request'),
      }"
    >
      <template #icon><IBiPersonSquare /></template>
      <template #subnav><PillsCompanyPartners /></template>
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
import { h, ref, useTemplateRef } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'
import { BButton } from 'bootstrap-vue-next'
import IBiPersonSquare from '~icons/bi/person-square'
import {
  companyPartnerRequestAcceptPartialUpdateMutation,
  companyPartnerRequestDestroyMutation,
  companyPartnerRequestReceivedListOptions,
  companyPartnerRequestRejectPartialUpdateMutation,
} from '@/api/@tanstack/vue-query.gen'
import PillsCompanyPartners from '@/components/PillsCompanyPartners.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import { ServerTable, baseListParams, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import { errorToast, infoToast, $trans } from '@/services/i18n'
import { invalidatePartnerList, invalidatePartnerRequestReceivedList } from '../invalidation'
import type { PaginatedPartnerRequestList } from '@/api/types.gen'

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
const acceptModal = useTemplateRef<{show: () => void, hide: () => void}>('acceptModal')
const rejectModal = useTemplateRef<{show: () => void, hide: () => void}>('rejectModal')

const requestPk = ref<number | null>(null)

const helper = createAppColumnHelper<RequestRow>()

const columns = helper.columns([
  helper.accessor((row) => row.from_member_view.name, {
    id: 'from_member__name',
    header: $trans('Name'),
  }),
  helper.display({
    id: 'companycode',
    header: $trans('Company code'),
    enableSorting: false,
    cell: ({ row }) => row.original.from_member_view.companycode,
  }),
  helper.display({
    id: 'city',
    header: $trans('City'),
    enableSorting: false,
    cell: ({ row }) => row.original.from_member_view.city,
  }),
  helper.display({
    id: 'email',
    header: $trans('Email'),
    enableSorting: false,
    cell: ({ row }) => row.original.from_member_view.email,
  }),
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
        h(IconLinkDelete, {
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

const acceptMutation = useMutation(companyPartnerRequestAcceptPartialUpdateMutation())
const rejectMutation = useMutation(companyPartnerRequestRejectPartialUpdateMutation())

function showAcceptModal(id: number) {
  requestPk.value = id
  acceptModal.value?.show()
}

function showRejectModal(id: number) {
  requestPk.value = id
  rejectModal.value?.show()
}

async function acceptRequest() {
  if (requestPk.value == null) return
  try {
    await acceptMutation.mutateAsync({ path: { id: requestPk.value } })
    infoToast(toast, $trans('Accepted'), $trans('Partner request has been accepted'))
    await invalidatePartnerRequestReceivedList(queryClient)
    await invalidatePartnerList(queryClient)
    acceptModal.value?.hide()
  } catch {
    errorToast(toast, $trans('Error accepting partner request'))
  }
}

async function rejectRequest() {
  if (requestPk.value == null) return
  try {
    await rejectMutation.mutateAsync({ path: { id: requestPk.value } })
    infoToast(toast, $trans('Rejected'), $trans('Partner request has been rejected'))
    await invalidatePartnerRequestReceivedList(queryClient)
    rejectModal.value?.hide()
  } catch {
    errorToast(toast, $trans('Error rejecting partner request'))
  }
}
</script>
