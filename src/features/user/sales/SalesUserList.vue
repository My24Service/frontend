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
import { ref } from 'vue'

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
import { createUserColumns } from '../user-list-columns'

const authStore = useAuthStore()

type SalesUserRow = ListRow<PaginatedSalesUserList>

const deleteModalRef = ref<InstanceType<typeof ListDeleteModal> | null>(null)

const columnHelper = createAppColumnHelper<SalesUserRow>()

const userColumns = createUserColumns(columnHelper, {
  nameRoute: 'salesuser-edit',
  widths: {name: '25%', username: '20%', email: '20%', lastLogin: '15%', dateJoined: '10%'},
})

const columns = columnHelper.columns([
  userColumns.name,
  userColumns.username,
  userColumns.email,
  userColumns.lastLogin,
  userColumns.dateJoined,
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
  urlSync: true,
  loadError: $trans('Error loading sales users'),
})

const table = useAppTable({
  key: 'sales-user-table',
  columns,
  ...paged.tableOptions,
})

const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged
</script>
