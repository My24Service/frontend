<template>
  <div class="app-page">
    <ListDeleteModal
      ref="deleteModalRef"
      modalId="delete-engineer-user-modal"
      :confirmText="$trans('Are you sure you want to delete this engineer?')"
      :destroyMutation="companyEngineerDestroyMutation"
      :invalidate="(queryClient) => queryClient.invalidateQueries({queryKey: companyEngineerListQueryKey()})"
      :deletedDetail="$trans('Engineer has been deleted')"
      :deleteError="$trans('Error deleting engineer')"
    />

    <ListPageHeader
      :title="$trans('People')"
      :searchLabel="$trans('Search engineers')"
      :refresh="refresh"
      v-model:searchDraft="searchDraft"
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
    </ListPageHeader>

    <div class="page-details panel">
      <ListTablePanel
        :table="table"
        :pagination="pagination"
        :count="count"
        :is-loading="isLoading"
        :is-fetching="isFetching"
        :empty-text="$trans('No engineers found')"
        :label="$trans('Engineer')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { h, useTemplateRef } from 'vue'
import { RouterLink } from 'vue-router'

import {
  companyEngineerDestroyMutation,
  companyEngineerListOptions,
  companyEngineerListQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import type { CompanyEngineerListData, PaginatedEngineerList } from '@/api/types.gen'
import { $trans } from '@/utils'
import { useAuthStore } from '@/features/auth'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { baseListParams, useServerPagedList } from '@/features/table/server-paged-list'
import ListDeleteModal from '@/features/table/ListDeleteModal.vue'
import ListPageHeader from '@/features/table/ListPageHeader.vue'
import ListTablePanel from '@/features/table/ListTablePanel.vue'
import { createActionColumn, type ListRow } from '@/features/table/list-columns'

const authStore = useAuthStore()

type EngineerUserRow = ListRow<PaginatedEngineerList>

const columnHelper = createAppColumnHelper<EngineerUserRow>()

const deleteModalRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('deleteModalRef')

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
  createActionColumn(columnHelper, {
    onDelete: (id: number) => {
      deleteModalRef.value?.showDeleteModal(id)
    },
    width: '10%',
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
</script>
