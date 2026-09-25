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
        resource: Api.CompanyStudentuser,
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
import { ServerTable, createActionColumn, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import { createUserColumns } from '../user-list-columns'
import IBiCheckSquare from '~icons/bi/check-square'
import IBiCheckSquareFill from '~icons/bi/check-square-fill'

type StudentUserRow = ListRow<Api.PaginatedStudentUserList>

const queryClient = useQueryClient()
const {create} = useToast()

// The screen's handle on the table: the icon column calls the delete modal
// through it, before this ref is populated.
const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const activeMutation = useMutation({
  ...Api.CompanyStudentuser.update.mutation(),
  onSuccess: async () => {
    await queryClient.invalidateQueries({queryKey: Api.CompanyStudentuser.list.queryKey()})
  },
  onError: (_error, variables) => {
    errorToast(create, variables.body?.is_active
      ? $trans('Error setting student user active')
      : $trans('Error setting student user inactive'))
  },
})

// The legacy list (de)activated students in place; the converted screen keeps
// the toggle. PATCH carries only the flag — the backend's patched schema has
// no required keys and absent keys leave stored values untouched.
function setActive(row: StudentUserRow, isActive: boolean) {
  activeMutation.mutate({
    path: {id: row.id},
    body: {
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

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<StudentUserRow>({
  key: 'student-user-table',
  columns,
  resource: Api.CompanyStudentuser,
  urlSync: true,
  loadError: $trans('Error loading student users'),
})
</script>
