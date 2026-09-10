<template>
  <div class="app-page">
    <b-modal
      id="delete-engineer-user-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok.prevent="handleDeleteOk"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this engineer?') }}</p>
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
            :aria-label="$trans('Search engineers')"
            :placeholder="$trans('Search engineers')"
          />
          <router-link
            v-if="authStore.isStaff || authStore.isSuperuser"
            :to="{name: 'engineer-add'}"
            class="btn btn-primary"
          >
            <IBiPersonPlus></IBiPersonPlus>{{ $trans("Add engineer") }}
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
            :empty-text="$trans('No engineers found')"
          />
        </div>
      </div>
    </div>

    <ServerTablePagination
      v-if="!isLoading"
      :table="table"
      :pagination="pagination"
      :count="count"
      :label="$trans('Engineer')"
      :is-fetching="isFetching"
    />
  </div>
</template>

<script lang="ts" setup>
import { h } from 'vue'
import { RouterLink } from 'vue-router'

import {
  companyEngineerDestroyMutation,
  companyEngineerListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { CompanyEngineerListData, PaginatedEngineerList } from '@/api/types.gen'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import { $trans } from '@/utils'
import { useAuthStore } from '@/features/auth'
import { companyEngineerListQueryKey } from '@/api/@tanstack/vue-query.gen'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { baseListParams, useServerPagedList } from '@/features/table/server-paged-list'
import { useListDelete } from '@/features/table/use-list-delete'
import ServerDataTable from '@/features/table/ServerDataTable.vue'
import ServerTablePagination from '@/features/table/ServerTablePagination.vue'

const authStore = useAuthStore()

type EngineerUserRow = NonNullable<PaginatedEngineerList['results']>[number]

const columnHelper = createAppColumnHelper<EngineerUserRow>()

const columns = columnHelper.columns([
  columnHelper.accessor('full_name', {
    header: $trans('Name'),
    // The engineer list endpoint declares no `ordering` parameter, so the
    // backend would silently drop a sort the wire carried — the column stays
    // non-sortable rather than sending a parameter nothing honours.
    enableSorting: false,
    meta: {width: '20%'},
    cell: (info) => h(RouterLink, {
      to: {name: 'engineer-edit', params: {pk: info.row.original.id}},
    }, () => info.row.original.full_name),
  }),
  columnHelper.accessor('username', {meta: {width: '15%'}, header: $trans('Username'), enableSorting: false}),
  // The mobile number lives on the nested `engineer` sub-object, not on the
  // row itself, so it renders as a display column — same reason as the
  // customer list's linked-customer cell.
  columnHelper.display({
    id: 'mobile',
    header: $trans('Mobile'),
    meta: {width: '10%'},
    cell: (info) => info.row.original.engineer?.mobile ?? '',
  }),
  columnHelper.accessor('email', {meta: {width: '15%'}, header: $trans('Email'), enableSorting: false}),
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

type EngineerUserListQueryParams = NonNullable<CompanyEngineerListData['query']>

const paged = useServerPagedList<EngineerUserRow>({
  listOptions: (query) => companyEngineerListOptions({
    query: {
      ...baseListParams(query),
    } as EngineerUserListQueryParams,
  }),
  getRowId: (row: EngineerUserRow) => String(row.id),
  loadError: $trans('Error loading engineers'),
})

const table = useAppTable({
  key: 'engineer-user-table',
  columns,
  ...paged.tableOptions,
})

const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged

const {deleteModal, showDeleteModal, handleDeleteOk} = useListDelete({
  destroyMutation: companyEngineerDestroyMutation,
  invalidateAfterDelete: (queryClient) => queryClient.invalidateQueries({queryKey: companyEngineerListQueryKey()}),
  copy: {
    deletedDetail: $trans('Engineer has been deleted'),
    deleteError: $trans('Error deleting engineer'),
  },
})
</script>
