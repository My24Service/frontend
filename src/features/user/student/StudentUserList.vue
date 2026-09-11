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
      :search-label="$trans('Search student users')"
      :refresh="refresh"
      :empty-text="$trans('No student users found')"
      :label="$trans('Student user')"
      :delete-modal="{
        modalId: 'delete-student-user-modal',
        confirmText: $trans('Are you sure you want to delete this student user?'),
        destroyMutation: companyStudentuserDestroyMutation,
        invalidate: (qc) => qc.invalidateQueries({queryKey: companyStudentuserListQueryKey()}),
        deletedDetail: $trans('Student user has been deleted'),
        deleteError: $trans('Error deleting student user'),
      }"
    >
      <template #icon><IBiPeople></IBiPeople></template>
      <template #add>
        <router-link
          :to="{name: 'studentuser-add'}"
          class="btn btn-primary"
        >
          {{ $trans('Add student user') }}
        </router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script lang="ts" setup>
import { h, useTemplateRef } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

import {
  companyStudentuserDestroyMutation,
  companyStudentuserListOptions,
  companyStudentuserPartialUpdateMutation,
} from '@/api/@tanstack/vue-query.gen'
import type { CompanyStudentuserListData, PaginatedStudentUserList } from '@/api/types.gen'
import { errorToast, $trans } from '@/services/i18n'
import { companyStudentuserListQueryKey } from '@/api/@tanstack/vue-query.gen'
import ServerTable from '@/features/table/ServerTable.vue'
import { baseListParams, createAppColumnHelper, useServerTable } from '@/features/table/table'
import { createActionColumn, type ListRow } from '@/features/table/list-columns'
import { createUserColumns } from '../user-list-columns'
import IBiCheckSquare from '~icons/bi/check-square'
import IBiCheckSquareFill from '~icons/bi/check-square-fill'

type StudentUserRow = ListRow<PaginatedStudentUserList>

const queryClient = useQueryClient()
const {create} = useToast()

// The screen's handle on the table: the icon column calls the delete modal
// through it, before this ref is populated.
const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const activeMutation = useMutation({
  ...companyStudentuserPartialUpdateMutation(),
  onSuccess: async () => {
    await queryClient.invalidateQueries({queryKey: companyStudentuserListQueryKey()})
  },
  onError: (_error, variables) => {
    errorToast(create, variables.body.is_active
      ? $trans('Error setting student user active')
      : $trans('Error setting student user inactive'))
  },
})

// The legacy list (de)activated students in place; the converted screen keeps
// the toggle. The PATCH body carries the row's names because the generated
// partial-update body types them required; the sub-object rides empty, so the
// stored address and student fields are untouched - the legacy toggle sent an
// empty `student_user` the same way.
function setActive(row: StudentUserRow, isActive: boolean) {
  activeMutation.mutate({
    path: {id: row.id},
    body: {
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      student_user: {},
      is_active: isActive,
    },
  })
}

const columnHelper = createAppColumnHelper<StudentUserRow>()

const userColumns = createUserColumns(columnHelper, {
  // The name keeps pointing at the detail screen, as the legacy list did;
  // the detail converts in its own follow-up.
  nameRoute: 'studentuser-detail',
  widths: {name: '20%', username: '15%', email: '15%', lastLogin: '10%', dateJoined: '10%'},
})

const columns = columnHelper.columns([
  userColumns.name,
  userColumns.username,
  // The mobile lives on the nested `student_user` record, not on a sortable
  // backend column — a display cell reading the join, like the customer
  // list's linked-customer cell.
  columnHelper.display({
    id: 'mobile',
    header: $trans('Mobile'),
    meta: {width: '15%'},
    cell: (info) => info.row.original.student_user?.mobile ?? '',
  }),
  userColumns.email,
  userColumns.lastLogin,
  userColumns.dateJoined,
  columnHelper.display({
    id: 'active',
    header: $trans('Active?'),
    meta: {width: '5%'},
    cell: (info) => {
      const row = info.row.original
      const isActive = row.is_active ?? false
      return h('button', {
        type: 'button',
        class: 'btn btn-link p-0',
        title: isActive ? $trans('Set inactive') : $trans('Set active'),
        onClick: () => setActive(row, !isActive),
      }, [h(isActive ? IBiCheckSquareFill : IBiCheckSquare)])
    },
  }),
  createActionColumn(columnHelper, {
    editRoute: 'studentuser-edit',
    onDelete: (id: number) => tableRef.value?.showDeleteModal(id),
    width: '10%',
  }),
])

type StudentUserListQueryParams = NonNullable<CompanyStudentuserListData['query']>

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<StudentUserRow>({
  key: 'student-user-table',
  columns,
  listOptions: (query) => companyStudentuserListOptions({
    query: {
      ...baseListParams(query),
    } as StudentUserListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading student users'),
})
</script>
