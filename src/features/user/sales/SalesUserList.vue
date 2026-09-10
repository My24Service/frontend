<template>
  <div class="app-page">
    <ListDeleteModal
      ref="deleteModalRef"
      modal-id="delete-sales-user-modal"
      :confirm-text="$trans('Are you sure you want to delete this sales user?')"
      :destroy-mutation="companySalesuserDestroyMutation"
      :invalidate="(queryClient) => queryClient.invalidateQueries({queryKey: companySalesuserListQueryKey()})"
      :deleted-detail="$trans('Sales user has been deleted')"
      :delete-error="$trans('Error deleting sales user')"
    />

    <ListPageHeader
      v-model:search-draft="searchDraft"
      :title="$trans('People')"
      :search-label="$trans('Search sales users')"
      :refresh="refresh"
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
    </ListPageHeader>

    <div class="page-details panel">
      <ListTablePanel
        :table="table"
        :pagination="pagination"
        :count="count"
        :is-loading="isLoading"
        :is-fetching="isFetching"
        :empty-text="$trans('No sales users found')"
        :label="$trans('Sales user')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { h, ref } from 'vue'
import { RouterLink } from 'vue-router'

import {
  companySalesuserDestroyMutation,
  companySalesuserListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { CompanySalesuserListData, PaginatedSalesUserList } from '@/api/types.gen'
import { $trans } from '@/services/i18n'
import { useAuthStore } from '@/features/auth'
import { companySalesuserListQueryKey } from '@/api/@tanstack/vue-query.gen'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { baseListParams, useServerPagedList } from '@/features/table/server-paged-list'
import ListPageHeader from '@/features/table/ListPageHeader.vue'
import ListTablePanel from '@/features/table/ListTablePanel.vue'
import ListDeleteModal from '@/features/table/ListDeleteModal.vue'
import { createActionColumn, type ListRow } from '@/features/table/list-columns'

const authStore = useAuthStore()

type SalesUserRow = ListRow<PaginatedSalesUserList>

const deleteModalRef = ref<InstanceType<typeof ListDeleteModal> | null>(null)

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
  createActionColumn(columnHelper, {
    onDelete: (id) => deleteModalRef.value?.showDeleteModal(id),
    width: '10%',
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
</script>
