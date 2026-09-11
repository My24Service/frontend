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
      :title="$trans('People')"
      :search-label="$trans('Search engineers')"
      :refresh="refresh"
      :empty-text="$trans('No engineers found')"
      :label="$trans('Engineer')"
      :delete-modal="{
        modalId: 'delete-engineer-user-modal',
        confirmText: $trans('Are you sure you want to delete this engineer?'),
        destroyMutation: companyEngineerDestroyMutation,
        invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: companyEngineerListQueryKey()}),
        deletedDetail: $trans('Engineer has been deleted'),
        deleteError: $trans('Error deleting engineer'),
      }"
    >
      <template #icon><IBiPeople></IBiPeople></template>
      <template #add>
        <router-link
          v-if="authStore.isStaff || authStore.isSuperuser"
          :to="{name: 'engineer-add'}"
          class="btn btn-primary"
        >
          <IBiPersonPlus></IBiPersonPlus>{{ $trans("Add engineer") }}
        </router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue'

import {
  companyEngineerDestroyMutation,
  companyEngineerListOptions,
  companyEngineerListQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import type { CompanyEngineerListData, PaginatedEngineerList } from '@/api/types.gen'
import { $trans } from '@/services/i18n'
import { useAuthStore } from '@/features/auth'
import ServerTable from '@/features/table/ServerTable.vue'
import { baseListParams, createAppColumnHelper, useServerTable } from '@/features/table/table'
import { createActionColumn, type ListRow } from '@/features/table/list-columns'
import { createUserColumns } from '../user-list-columns'

const authStore = useAuthStore()

type EngineerUserRow = ListRow<PaginatedEngineerList>

const columnHelper = createAppColumnHelper<EngineerUserRow>()

// The screen's handle on the table: the icon column calls the delete modal
// through it, before this ref is populated.
const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const userColumns = createUserColumns(columnHelper, {
  nameRoute: 'engineer-edit',
  widths: {name: '20%', username: '15%', email: '15%', lastLogin: '15%', dateJoined: '10%'},
})

const columns = columnHelper.columns([
  userColumns.name,
  userColumns.username,
  // The mobile number lives on the nested `engineer` sub-object, not on the
  // row itself, so it renders as a display column — same reason as the
  // customer list's linked-customer cell.
  columnHelper.display({
    id: 'mobile',
    header: $trans('Mobile'),
    meta: {width: '10%'},
    cell: (info) => info.row.original.engineer?.mobile ?? '',
  }),
  userColumns.email,
  userColumns.lastLogin,
  userColumns.dateJoined,
  createActionColumn(columnHelper, {
    onDelete: (id: number) => {
      tableRef.value?.showDeleteModal(id)
    },
    width: '10%',
  }),
])

type EngineerUserListQueryParams = NonNullable<CompanyEngineerListData['query']>

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<EngineerUserRow>({
  key: 'engineer-user-table',
  columns,
  listOptions: (query) => companyEngineerListOptions({
    query: {
      ...baseListParams(query),
    } as EngineerUserListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading engineers'),
})
</script>
