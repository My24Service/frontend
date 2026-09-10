<template>
  <div class="app-page">
    <b-modal
      id="delete-student-user-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok.prevent="handleDeleteOk"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this student user?') }}</p>
    </b-modal>

    <header>
      <div class="page-title">
        <h3><IBiPeople></IBiPeople>{{ $trans("People") }}</h3>
        <BButton-toolbar>
          <BButton-group class="me-1">
            <ButtonLinkRefresh
              :method="refresh"
              :title="$trans('Refresh')"
            />
          </BButton-group>
          <input
            v-model="searchDraft"
            class="form-control form-control-sm w-auto me-2"
            :aria-label="$trans('Search student users')"
            :placeholder="$trans('Search student users')"
          />
          <router-link
            :to="{name: 'studentuser-add'}"
            class="btn btn-primary"
          >
            {{ $trans('Add student user') }}
          </router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class="page-details panel">
      <div class="app-detail panel overflow-auto">
        <div class="data-table">
          <ServerDataTable
            :table="table"
            :is-loading="isLoading"
            :empty-text="$trans('No student users found')"
          />
        </div>
      </div>
    </div>

    <ServerTablePagination
      v-if="!isLoading"
      :table="table"
      :pagination="pagination"
      :count="count"
      :label="$trans('Student user')"
      :is-fetching="isFetching"
    />
  </div>
</template>

<script lang="ts" setup>
import { h } from 'vue'
import { RouterLink } from 'vue-router'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

import {
  companyStudentuserDestroyMutation,
  companyStudentuserListOptions,
  companyStudentuserPartialUpdateMutation,
} from '@/api/@tanstack/vue-query.gen'
import type { CompanyStudentuserListData, PaginatedStudentUserList } from '@/api/types.gen'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import { errorToast, $trans } from '@/utils'
import { companyStudentuserListQueryKey } from '@/api/@tanstack/vue-query.gen'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { baseListParams, useServerPagedList } from '@/features/table/server-paged-list'
import { useListDelete } from '@/features/table/use-list-delete'
import ServerDataTable from '@/features/table/ServerDataTable.vue'
import ServerTablePagination from '@/features/table/ServerTablePagination.vue'
import IBiCheckSquare from '~icons/bi/check-square'
import IBiCheckSquareFill from '~icons/bi/check-square-fill'

type StudentUserRow = NonNullable<PaginatedStudentUserList['results']>[number]

const queryClient = useQueryClient()
const {create} = useToast()

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

const columns = columnHelper.columns([
  columnHelper.accessor('full_name', {
    header: $trans('Name'),
    // The student-user list endpoint declares no `ordering` parameter, so
    // the backend would silently drop a sort the wire carried — the column
    // stays non-sortable rather than sending a parameter nothing honours.
    enableSorting: false,
    meta: {width: '20%'},
    // The name keeps pointing at the detail screen, as the legacy list did;
    // the detail converts in its own follow-up.
    cell: (info) => h(RouterLink, {
      to: {name: 'studentuser-detail', params: {pk: info.row.original.id}},
    }, () => info.row.original.full_name),
  }),
  columnHelper.accessor('username', {meta: {width: '15%'}, header: $trans('Username'), enableSorting: false}),
  // The mobile lives on the nested `student_user` record, not on a sortable
  // backend column — a display cell reading the join, like the customer
  // list's linked-customer cell.
  columnHelper.display({
    id: 'mobile',
    header: $trans('Mobile'),
    meta: {width: '15%'},
    cell: (info) => info.row.original.student_user?.mobile ?? '',
  }),
  columnHelper.accessor('email', {meta: {width: '15%'}, header: $trans('Email'), enableSorting: false}),
  columnHelper.accessor('last_login', {meta: {width: '10%'}, header: $trans('Last login'), enableSorting: false}),
  columnHelper.accessor('date_joined', {meta: {width: '10%'}, header: $trans('Date joined'), enableSorting: false}),
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
  columnHelper.display({
    id: 'icons',
    header: '',
    meta: {width: '10%'},
    cell: (info) => h('div', {class: 'h2 float-end'}, [
      h(IconLinkEdit, {
        router_name: 'studentuser-edit',
        router_params: {pk: info.row.original.id},
        title: $trans('Edit'),
      }),
      h(IconLinkDelete, {
        title: $trans('Delete'),
        method: () => showDeleteModal(info.row.original.id),
      }),
    ]),
  }),
])

type StudentUserListQueryParams = NonNullable<CompanyStudentuserListData['query']>

const paged = useServerPagedList<StudentUserRow>({
  listOptions: (query) => companyStudentuserListOptions({
    query: {
      ...baseListParams(query),
    } as StudentUserListQueryParams,
  }),
  getRowId: (row: StudentUserRow) => String(row.id),
  loadError: $trans('Error loading student users'),
})

const table = useAppTable({
  key: 'student-user-table',
  columns,
  ...paged.tableOptions,
})

const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged

const {deleteModal, showDeleteModal, handleDeleteOk} = useListDelete({
  destroyMutation: companyStudentuserDestroyMutation,
  invalidateAfterDelete: (queryClient) => queryClient.invalidateQueries({queryKey: companyStudentuserListQueryKey()}),
  copy: {
    deletedDetail: $trans('Student user has been deleted'),
    deleteError: $trans('Error deleting student user'),
  },
})
</script>
