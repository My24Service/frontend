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
      :search-label="$trans('Search sales users')"
      :refresh="refresh"
      :empty-text="$trans('No sales users found')"
      :label="$trans('Sales user')"
      :delete-modal="{
        modalId: 'delete-sales-user-modal',
        confirmText: $trans('Are you sure you want to delete this sales user?'),
        destroyMutation: companySalesuserDestroyMutation,
        invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: companySalesuserListQueryKey()}),
        deletedDetail: $trans('Sales user has been deleted'),
        deleteError: $trans('Error deleting sales user'),
      }"
    >
      <template #icon><IBiPeople></IBiPeople></template>
      <template #add>
        <router-link
          v-if="authStore.isStaff || authStore.isSuperuser"
          :to="{name: 'salesuser-add'}"
          class="btn btn-primary"
        >
          <IBiPersonPlus></IBiPersonPlus>{{ $trans("Add sales user") }}
        </router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import {
  companySalesuserDestroyMutation,
  companySalesuserListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { CompanySalesuserListData, PaginatedSalesUserList } from '@/api/types.gen'
import { $trans } from '@/services/i18n'
import { useAuthStore } from '@/features/auth'
import { companySalesuserListQueryKey } from '@/api/@tanstack/vue-query.gen'
import ServerTable from '@/features/table/ServerTable.vue'
import { createAppColumnHelper } from '@/features/table/table'
import { baseListParams } from '@/features/table/server-paged-list'
import { useServerTable } from '@/features/table/use-server-table'
import { createActionColumn, type ListRow } from '@/features/table/list-columns'
import { createUserColumns } from '../user-list-columns'

const authStore = useAuthStore()

type SalesUserRow = ListRow<PaginatedSalesUserList>

// The screen's handle on the table: the icon column calls the delete modal
// through it, before this ref is populated.
const tableRef = ref<{showDeleteModal: (id: number) => void} | null>(null)

const columnHelper = createAppColumnHelper<SalesUserRow>()

const userColumns = createUserColumns(columnHelper, {
  nameRoute: 'salesuser-edit',
  widths: {name: '25%', username: '20%', email: '20%', lastLogin: '15%', dateJoined: '10%'},
})

const columns = columnHelper.columns([
  userColumns.name,
  userColumns.username,
  userColumns.email,
  userColumns.lastLogin,
  userColumns.dateJoined,
  createActionColumn(columnHelper, {
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
    width: '10%',
  }),
])

type SalesUserListQueryParams = NonNullable<CompanySalesuserListData['query']>

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<SalesUserRow>({
  key: 'sales-user-table',
  columns,
  listOptions: (query) => companySalesuserListOptions({
    query: {
      ...baseListParams(query),
    } as SalesUserListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading sales users'),
})
</script>
