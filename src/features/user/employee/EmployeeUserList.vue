<template>
  <div class="app-page">
    <ListDeleteModal
      ref="deleteModalRef"
      modalId="delete-employee-user-modal"
      :confirmText="$trans('Are you sure you want to delete this employee?')"
      :destroyMutation="companyEmployeeuserDestroyMutation"
      :invalidate="(queryClient) => queryClient.invalidateQueries({queryKey: companyEmployeeuserListQueryKey()})"
      :deletedDetail="$trans('Employee has been deleted')"
      :deleteError="$trans('Error deleting employee')"
    />

    <ListPageHeader
      :title="$trans('People')"
      :searchLabel="$trans('Search employees')"
      :refresh="refresh"
      v-model:searchDraft="searchDraft"
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
    </ListPageHeader>

    <div class="page-details panel">
      <ListTablePanel
        :table="table"
        :pagination="pagination"
        :count="count"
        :is-loading="isLoading"
        :is-fetching="isFetching"
        :empty-text="$trans('No employees found')"
        :label="$trans('Employee')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef } from 'vue'

import {
  companyEmployeeuserDestroyMutation,
  companyEmployeeuserListOptions,
  companyEmployeeuserListQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import type { CompanyEmployeeuserListData, PaginatedEmployeeUserList } from '@/api/types.gen'
import { $trans } from '@/services/i18n'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { baseListParams, useServerPagedList } from '@/features/table/server-paged-list'
import ListDeleteModal from '@/features/table/ListDeleteModal.vue'
import ListPageHeader from '@/features/table/ListPageHeader.vue'
import ListTablePanel from '@/features/table/ListTablePanel.vue'
import { createActionColumn, type ListRow } from '@/features/table/list-columns'
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

const deleteModalRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('deleteModalRef')

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
      deleteModalRef.value?.showDeleteModal(id)
    },
    width: '10%',
  }),
])

type EmployeeUserListQueryParams = NonNullable<CompanyEmployeeuserListData['query']>

const paged = useServerPagedList<EmployeeUserRow>({
  listOptions: (query) => companyEmployeeuserListOptions({
    query: {
      ...baseListParams(query),
    } as EmployeeUserListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading employees'),
})

const table = useAppTable({
  key: 'employee-user-table',
  columns,
  ...paged.tableOptions,
})

const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged
</script>
