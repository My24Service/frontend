<template>
  <div class="app-page">
    <ListDeleteModal
      ref="deleteModalRef"
      modal-id="delete-module-modal"
      :confirm-text="$trans('Are you sure you want to delete this module?')"
      :destroy-mutation="memberModuleDestroyMutation"
      :invalidate="(queryClient) => invalidateModuleListQueries(queryClient)"
      :deleted-detail="$trans('Module has been deleted')"
      :delete-error="$trans('Error deleting module')"
    />

    <ListPageHeader
      v-model:search-draft="searchDraft"
      :title="$trans('Modules')"
      :search-label="$trans('Search modules')"
      :refresh="refresh"
    >
      <template #add>
        <router-link
          :to="{name: 'module-add'}"
          class="btn"
        >
          {{$trans('Add module')}}
        </router-link>
      </template>
    </ListPageHeader>

    <ListTablePanel
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :empty-text="$trans('No modules found')"
      :label="$trans('Module')"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import {
  memberModuleDestroyMutation,
  memberModuleListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { MemberModuleListData, PaginatedModuleList } from '@/api/types.gen'
import { $trans } from '@/services/i18n'
import { invalidateModuleListQueries } from '../invalidation'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { baseListParams, useServerPagedList } from '@/features/table/server-paged-list'
import ListPageHeader from '@/features/table/ListPageHeader.vue'
import ListTablePanel from '@/features/table/ListTablePanel.vue'
import ListDeleteModal from '@/features/table/ListDeleteModal.vue'
import { createActionColumn, type ListRow } from '@/features/table/list-columns'

type ModuleRow = ListRow<PaginatedModuleList>

const deleteModalRef = ref<InstanceType<typeof ListDeleteModal> | null>(null)

const columnHelper = createAppColumnHelper<ModuleRow>()

const columns = columnHelper.columns([
  columnHelper.accessor('name', {meta: {width: '70%'}, header: $trans('Name')}),
  columnHelper.accessor('created', {meta: {width: '10%'}, header: $trans('Created')}),
  columnHelper.accessor('modified', {meta: {width: '10%'}, header: $trans('Modified')}),
  createActionColumn(columnHelper, {
    editRoute: 'module-edit',
    onDelete: (id) => deleteModalRef.value?.showDeleteModal(id),
    width: '10%',
  }),
])

type ModuleListQueryParams = NonNullable<MemberModuleListData['query']>

const paged = useServerPagedList<ModuleRow>({
  listOptions: (query) => memberModuleListOptions({
    query: {
      ...baseListParams(query),
    } as ModuleListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading modules'),
})

const table = useAppTable({
  key: 'module-table',
  columns,
  ...paged.tableOptions,
})

const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged
</script>
