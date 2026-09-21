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
        invalidate: invalidateReads(companyPartnerRequestSent),
        deletedDetail: $trans('Partner request has been deleted'),
        deleteError: $trans('Error deleting partner request'),
      }"
    >
      <template #icon><IBiPersonSquare /></template>
      <template #subnav><PillsNav :items="partnerPills" /></template>
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
import {
  companyPartnerRequestDestroyMutation,
  companyPartnerRequestSentListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedPartnerRequestList } from '@/api/types.gen'
import { companyPartnerRequestSent } from '@/api/resources.gen'
import { invalidateReads } from '@/features/forms/use-resource-form'
import type { PillNavItem } from '@/components/PillsNav.vue'
import { ServerTable, baseListParams, createActionColumn, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import { $trans } from '@/services/i18n'
import { partnerColumns } from './partner-columns'

const partnerPills: PillNavItem[] = [
  { label: $trans('Active'), to: { name: 'company-partners-active' } },
  { label: $trans('Requests sent'), to: { name: 'company-partners-requests-sent' } },
  { label: $trans('Requests received'), to: { name: 'company-partners-requests-received' } },
]

/**
 * The partner requests this tenant sent. Delete-only rows: a sent request is
 * withdrawn, never edited, and acceptance happens on the other side.
 */
type RequestRow = ListRow<PaginatedPartnerRequestList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const helper = createAppColumnHelper<RequestRow>()

const memberColumns = partnerColumns(helper, 'to_member_view')

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
