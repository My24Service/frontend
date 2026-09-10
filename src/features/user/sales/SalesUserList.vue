<template>
  <div class="app-page">
    <b-modal
      id="delete-sales-user-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok.prevent="handleDeleteOk"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this sales user?') }}</p>
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
            :aria-label="$trans('Search sales users')"
            :placeholder="$trans('Search sales users')"
          />
          <router-link
            v-if="authStore.isStaff || authStore.isSuperuser"
            :to="{name: 'salesuser-add'}"
            class="btn btn-primary"
          >
            <IBiPersonPlus></IBiPersonPlus>{{ $trans("Add sales user") }}
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
            :empty-text="$trans('No sales users found')"
          />
        </div>
      </div>
    </div>

    <ServerTablePagination
      v-if="!isLoading"
      :table="table"
      :pagination="pagination"
      :count="count"
      :label="$trans('Sales user')"
      :is-fetching="isFetching"
    />
  </div>
</template>

<script lang="ts" setup>
import { h } from 'vue'
import { RouterLink } from 'vue-router'

import {
  companySalesuserDestroyMutation,
  companySalesuserListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { CompanySalesuserListData, PaginatedSalesUserList } from '@/api/types.gen'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import { $trans } from '@/utils'
import { useAuthStore } from '@/features/auth'
import { companySalesuserListQueryKey } from '@/api/@tanstack/vue-query.gen'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { baseListParams, useServerPagedList } from '@/features/table/server-paged-list'
import { useListDelete } from '@/features/table/use-list-delete'
import ServerDataTable from '@/features/table/ServerDataTable.vue'
import ServerTablePagination from '@/features/table/ServerTablePagination.vue'

const authStore = useAuthStore()

type SalesUserRow = NonNullable<PaginatedSalesUserList['results']>[number]

const columnHelper = createAppColumnHelper<SalesUserRow>()

const columns = columnHelper.columns([
  columnHelper.accessor('full_name', {
    header: $trans('Name'),
    // The sales-user list endpoint declares no `ordering` parameter, so the
    // backend would silently drop a sort the wire carried — the column stays
    // non-sortable rather than sending a parameter nothing honours.
    enableSorting: false,
    meta: {width: '25%'},
    cell: (info) => h(RouterLink, {
      to: {name: 'salesuser-edit', params: {pk: info.row.original.id}},
    }, () => info.row.original.full_name),
  }),
  columnHelper.accessor('username', {meta: {width: '20%'}, header: $trans('Username'), enableSorting: false}),
  columnHelper.accessor('email', {meta: {width: '20%'}, header: $trans('Email'), enableSorting: false}),
  columnHelper.accessor('last_login', {meta: {width: '15%'}, header: $trans('Last login'), enableSorting: false}),
  columnHelper.accessor('date_joined', {meta: {width: '10%'}, header: $trans('Date joined'), enableSorting: false}),
  columnHelper.display({
    id: 'icons',
    header: '',
    meta: {width: '10%'},
    cell: (info) => h('div', {class: 'h2 float-end'}, [
      h(IconLinkDelete, {
        title: $trans('Delete'),
        method: () => showDeleteModal(info.row.original.id),
      }),
    ]),
  }),
])

type SalesUserListQueryParams = NonNullable<CompanySalesuserListData['query']>

const paged = useServerPagedList<SalesUserRow>({
  listOptions: (query) => companySalesuserListOptions({
    query: {
      ...baseListParams(query),
    } as SalesUserListQueryParams,
  }),
  getRowId: (row: SalesUserRow) => String(row.id),
  loadError: $trans('Error loading sales users'),
})

const table = useAppTable({
  key: 'sales-user-table',
  columns,
  ...paged.tableOptions,
})

const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged

const {deleteModal, showDeleteModal, handleDeleteOk} = useListDelete({
  destroyMutation: companySalesuserDestroyMutation,
  invalidateAfterDelete: (queryClient) => queryClient.invalidateQueries({queryKey: companySalesuserListQueryKey()}),
  copy: {
    deletedDetail: $trans('Sales user has been deleted'),
    deleteError: $trans('Error deleting sales user'),
  },
})
</script>
