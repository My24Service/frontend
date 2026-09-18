<template>
  <div class="app-page">
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
        modalId: 'delete-partner-request-modal',
        confirmText: $trans('Are you sure you want to delete this partner request?'),
        destroyMutation: companyPartnerRequestDestroyMutation,
        invalidate: invalidatePartnerRequestSentList,
        deletedDetail: $trans('Partner request has been deleted'),
        deleteError: $trans('Error deleting partner request'),
      }"
    >
      <template #icon><IBiPersonSquare /></template>
      <template #subnav><PillsCompanyPartners /></template>
      <template #add>
        <router-link
          :to="{name: 'partner-request-add'}"
          class="btn btn-primary"
        >{{ $trans('New partner request') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import IBiPersonSquare from '~icons/bi/person-square'
import {
  companyPartnerRequestDestroyMutation,
  companyPartnerRequestSentListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedPartnerRequestList } from '@/api/types.gen'
import PillsCompanyPartners from '@/components/PillsCompanyPartners.vue'
import { ServerTable, baseListParams, createActionColumn, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import { $trans } from '@/services/i18n'
import { invalidatePartnerRequestSentList } from '../invalidation'

/**
 * The partner requests this tenant sent. Delete-only rows: a sent request is
 * withdrawn, never edited, and acceptance happens on the other side.
 */
type RequestRow = ListRow<PaginatedPartnerRequestList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const helper = createAppColumnHelper<RequestRow>()

const columns = helper.columns([
  helper.accessor((row) => row.to_member_view.name, {
    id: 'to_member__name',
    header: $trans('Name'),
  }),
  helper.display({
    id: 'companycode',
    header: $trans('Company code'),
    enableSorting: false,
    cell: ({ row }) => row.original.to_member_view.companycode,
  }),
  helper.display({
    id: 'city',
    header: $trans('City'),
    enableSorting: false,
    cell: ({ row }) => row.original.to_member_view.city,
  }),
  helper.display({
    id: 'email',
    header: $trans('Email'),
    enableSorting: false,
    cell: ({ row }) => row.original.to_member_view.email,
  }),
  helper.accessor('status', {
    header: $trans('Status'),
  }),
  helper.accessor('created', {
    header: $trans('Created'),
  }),
  createActionColumn(helper, {
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
  }),
])

const { table, searchDraft, pagination, count, isLoading, isFetching, refresh } = useServerTable<RequestRow>({
  key: 'partner-requests-sent-table',
  columns,
  listOptions: (query) => companyPartnerRequestSentListOptions({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading partner requests sent'),
})
</script>
