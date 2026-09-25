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
      :search-label="$trans('Search partners')"
      :label="$trans('Partner')"
      :empty-text="$trans('No partners found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-partner-modal',
        confirmText: $trans('Are you sure you want to delete this partner relation?'),
        destroyMutation: Api.CompanyPartner.destroy.mutation,
        invalidate: Api.CompanyPartner.invalidate,
        deletedDetail: $trans('partner has been deleted'),
        deleteError: $trans('Error deleting partner'),
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
import IBiCheckSquareFill from '~icons/bi/check-square-fill'

import type { PillNavItem } from '@/components/PillsNav.vue'
import { ServerTable, baseListParams, createActionColumn, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import { partnerColumns } from './partner-columns'

/**
 * The pills switch between the three partner screens; active state is the
 * current route name matching the pill's target.
 */
const partnerPills: PillNavItem[] = [
  { label: $trans('Active'), to: { name: 'company-partners-active' } },
  { label: $trans('Requests sent'), to: { name: 'company-partners-requests-sent' } },
  { label: $trans('Requests received'), to: { name: 'company-partners-requests-received' } },
]

/**
 * The active partner relations. No create screen - a relation is born when a
 * request is accepted, never typed in - so the add button opens the request
 * form. The pills switch between the three partner screens.
 */
type PartnerRow = ListRow<Api.PaginatedPartnerDetailList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const helper = createAppColumnHelper<PartnerRow>()

const memberColumns = partnerColumns(helper, 'partner_view')

const columns = helper.columns([
  memberColumns.name,
  memberColumns.companycode,
  memberColumns.city,
  memberColumns.email,
  helper.display({
    id: 'has_branches',
    header: $trans('Branches?'),
    enableSorting: false,
    cell: ({ row }) => (row.original.partner_view.has_branches ? h(IBiCheckSquareFill) : null),
  }),
  helper.accessor('created', {
    header: $trans('Created'),
  }),
  createActionColumn(helper, {
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
  }),
])

const { table, searchDraft, pagination, count, isLoading, isFetching, refresh } = useServerTable<PartnerRow>({
  key: 'partner-table',
  columns,
  listOptions: (query) => Api.CompanyPartner.list.options({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading partners'),
})
</script>
