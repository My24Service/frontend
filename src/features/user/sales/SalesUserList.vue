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
        destroyMutation: Api.CompanySalesuser.destroy.mutation,
        invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: Api.CompanySalesuser.list.queryKey()}),
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

import {
  ServerTable,
  baseListParams,
  createActionColumn,
  createAppColumnHelper,
  useServerTable,
  type ListRow,
} from '@/features/table'
import { createUserColumns } from '../user-list-columns'

const authStore = useAuthStore()

type SalesUserRow = ListRow<Api.PaginatedSalesUserList>

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

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<SalesUserRow>({
  key: 'sales-user-table',
  columns,
  listOptions: (query) => Api.CompanySalesuser.list.options({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading sales users'),
})
</script>
