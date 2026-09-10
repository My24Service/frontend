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
import { computed, h, useTemplateRef } from 'vue'
import { RouterLink } from 'vue-router'

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

const columns = columnHelper.columns([
  columnHelper.accessor('full_name', {
    header: $trans('Name'),
    // The employee-user list endpoint declares no `ordering` parameter, so
    // the backend would silently drop a sort the wire carried — the column
    // stays non-sortable rather than sending a parameter nothing honours.
    enableSorting: false,
    meta: {width: '25%'},
    cell: (info) => h(RouterLink, {
      to: {name: editRoute.value, params: {pk: info.row.original.id}},
    }, () => info.row.original.full_name),
  }),
  columnHelper.accessor('username', {meta: {width: '20%'}, header: $trans('Username'), enableSorting: false}),
  columnHelper.accessor('email', {meta: {width: '20%'}, header: $trans('Email'), enableSorting: false}),
  columnHelper.accessor('last_login', {meta: {width: '15%'}, header: $trans('Last login'), enableSorting: false}),
  columnHelper.accessor('date_joined', {meta: {width: '10%'}, header: $trans('Date joined'), enableSorting: false}),
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
