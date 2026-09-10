<template>
  <div class="app-page">
    <ListDeleteModal
      ref="deleteModalRef"
      modal-id="delete-module-part-modal"
      :confirm-text="$trans('Are you sure you want to delete this module part?')"
      :destroy-mutation="memberModulePartDestroyMutation"
      :invalidate="(queryClient) => invalidateModulePartListQueries(queryClient)"
      :deleted-detail="$trans('Module part has been deleted')"
      :delete-error="$trans('Error deleting module part')"
    />

    <ListPageHeader
      v-model:search-draft="searchDraft"
      :title="$trans('Module parts')"
      :search-label="$trans('Search module parts')"
      :refresh="refresh"
    >
      <template #add>
        <router-link
          :to="{name: 'module-part-add'}"
          class="btn"
        >
          {{$trans('Add module part')}}
        </router-link>
      </template>
    </ListPageHeader>

    <ListTablePanel
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :empty-text="$trans('No module parts found')"
      :label="$trans('Module part')"
    />
  </div>
</template>

<script lang="ts" setup>
import { h, ref } from 'vue'
import IBiCheckSquare from '~icons/bi/check-square'
import {
  memberModulePartDestroyMutation,
  memberModulePartListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { MemberModulePartListData, PaginatedModulePartList } from '@/api/types.gen'
import { $trans } from '@/services/i18n'
import { invalidateModulePartListQueries } from '../invalidation'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { baseListParams, useServerPagedList } from '@/features/table/server-paged-list'
import ListPageHeader from '@/features/table/ListPageHeader.vue'
import ListTablePanel from '@/features/table/ListTablePanel.vue'
import ListDeleteModal from '@/features/table/ListDeleteModal.vue'
import { createActionColumn, type ListRow } from '@/features/table/list-columns'

type ModulePartRow = ListRow<PaginatedModulePartList>

const deleteModalRef = ref<InstanceType<typeof ListDeleteModal> | null>(null)

const columnHelper = createAppColumnHelper<ModulePartRow>()

const columns = columnHelper.columns([
  columnHelper.accessor('name', {meta: {width: '30%'}, header: $trans('Name')}),
  columnHelper.accessor('module_name', {meta: {width: '20%'}, header: $trans('Module')}),
  columnHelper.accessor('is_always_selected', {
    meta: {width: '20%'},
    header: $trans('Always selected?'),
    // The legacy cell showed a checkmark icon (an auto-imported global
    // component a render function cannot reach) for true and nothing for
    // false; the icon imports directly here.
    cell: (info) => (info.getValue() ? h(IBiCheckSquare, {class: 'checkmark'}) : ''),
  }),
  columnHelper.accessor('created', {meta: {width: '10%'}, header: $trans('Created')}),
  columnHelper.accessor('modified', {meta: {width: '10%'}, header: $trans('Modified')}),
  createActionColumn(columnHelper, {
    editRoute: 'module-part-edit',
    onDelete: (id) => deleteModalRef.value?.showDeleteModal(id),
    width: '10%',
  }),
])

type ModulePartListQueryParams = NonNullable<MemberModulePartListData['query']>

const paged = useServerPagedList<ModulePartRow>({
  listOptions: (query) => memberModulePartListOptions({
    query: {
      ...baseListParams(query),
    } as ModulePartListQueryParams,
  }),
  loadError: $trans('Error loading module parts'),
})

const table = useAppTable({
  key: 'module-part-table',
  columns,
  ...paged.tableOptions,
})

const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged
</script>
