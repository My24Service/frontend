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
        destroyMutation: Api.CompanyEngineer.destroy.mutation,
        invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: Api.CompanyEngineer.list.queryKey()}),
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

type EngineerUserRow = ListRow<Api.PaginatedEngineerList>

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

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<EngineerUserRow>({
  key: 'engineer-user-table',
  columns,
  listOptions: (query) => Api.CompanyEngineer.list.options({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading engineers'),
})
</script>
