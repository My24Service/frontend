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
      :search-label="$trans('Search employees')"
      :refresh="refresh"
      :empty-text="$trans('No employees found')"
      :label="$trans('Employee')"
      :delete-modal="{
        modalId: 'delete-employee-user-modal',
        confirmText: $trans('Are you sure you want to delete this employee?'),
        destroyMutation: companyEmployeeuserDestroyMutation,
        invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: companyEmployeeuserListQueryKey()}),
        deletedDetail: $trans('Employee has been deleted'),
        deleteError: $trans('Error deleting employee'),
      }"
    >
      <template #icon><IBiPeople></IBiPeople></template>
      <template #add>
        <router-link
          :to="{name: addRoute}"
          class="btn btn-primary"
        >
          <IBiPersonPlus></IBiPersonPlus>{{ $trans("Add employee") }}
        </router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script lang="ts" setup>
import {
  companyEmployeeuserDestroyMutation,
  companyEmployeeuserListOptions,
  companyEmployeeuserListQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedEmployeeUserList } from '@/api/types.gen'
import {
  ServerTable,
  baseListParams,
  createActionColumn,
  createAppColumnHelper,
  useServerTable,
  type ListRow,
} from '@/features/table'
import { createUserColumns } from '../user-list-columns'

const props = withDefaults(defineProps<{
  fromSettings?: boolean
}>(), {
  fromSettings: false,
})

// The list mounts twice — under /company and under /settings — and each tree
// has its own add/edit route names. The legacy list switched them with
// linkAdd/linkEdit computeds; the converted screen keeps that prop contract
// so both routers mount the same component.
const addRoute = computed(() => props.fromSettings ? 'settings-employee-add' : 'employee-add')
const editRoute = computed(() => props.fromSettings ? 'settings-employee-edit' : 'employee-edit')

type EmployeeUserRow = ListRow<PaginatedEmployeeUserList>

const columnHelper = createAppColumnHelper<EmployeeUserRow>()

// The screen's handle on the table: the icon column calls the delete modal
// through it, before this ref is populated.
const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const userColumns = createUserColumns(columnHelper, {
  nameRoute: editRoute,
  widths: {name: '25%', username: '20%', email: '20%', lastLogin: '15%', dateJoined: '10%'},
})

const columns = columnHelper.columns([
  userColumns.name,
  userColumns.username,
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

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<EmployeeUserRow>({
  key: 'employee-user-table',
  columns,
  listOptions: (query) => companyEmployeeuserListOptions({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading employees'),
})
</script>
