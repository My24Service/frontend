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
      :title="$trans('Module parts')"
      :search-label="$trans('Search module parts')"
      :refresh="refresh"
      :empty-text="$trans('No module parts found')"
      :label="$trans('Module part')"
      :delete-modal="{
        modalId: 'delete-module-part-modal',
        confirmText: $trans('Are you sure you want to delete this module part?'),
        destroyMutation: memberModulePartDestroyMutation,
        invalidate: (queryClient) => invalidateModulePartListQueries(queryClient),
        deletedDetail: $trans('Module part has been deleted'),
        deleteError: $trans('Error deleting module part'),
      }"
    >
      <template #add>
        <router-link
          :to="{name: 'module-part-add'}"
          class="btn"
        >
          {{$trans('Add module part')}}
        </router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script lang="ts" setup>
import IBiCheckSquare from '~icons/bi/check-square'
import {
  memberModuleListOptions,
  memberModulePartDestroyMutation,
  memberModulePartListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedModulePartList } from '@/api/types.gen'
import { invalidateModulePartListQueries } from '../invalidation'
import {
  ServerTable,
  baseListParams,
  createActionColumn,
  createAppColumnHelper,
  useServerTable,
  type FilterOption,
  type ListRow,
} from '@/features/table'

type ModulePartRow = ListRow<PaginatedModulePartList>

/** A module list row as a filter choice: its id on the wire, its name on the chip. */
function moduleOptions(rows: {id: number, name: string}[]): FilterOption[] {
  return rows.map((row) => ({value: String(row.id), label: row.name}))
}

const queryClient = useQueryClient()

// The screen's handle on the table: the icon column calls the delete modal
// through it, before this ref is populated. Typed structurally because
// ServerTable is generic over the row type.
const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const columnHelper = createAppColumnHelper<ModulePartRow>()

const columns = columnHelper.columns([
  columnHelper.accessor('name', {
    header: $trans('Name'),
    meta: {width: '30%', filter: {variant: 'text', label: $trans('Name')}},
  }),
  // The cell shows the module's name; the endpoint filters on its id, so the
  // pick rides `module` and the chip names a restored id through the list.
  columnHelper.accessor('module_name', {
    header: $trans('Module'),
    meta: {width: '20%', filter: {
      variant: 'select',
      label: $trans('Module'),
      param: 'module',
      loadOptions: (term) => queryClient
        .fetchQuery(memberModuleListOptions({query: {q: term}}))
        .then((page) => moduleOptions(page.results ?? [])),
      resolveLabels: (ids) => queryClient
        .fetchQuery(memberModuleListOptions({query: {id: ids.join(',')}}))
        .then((page) => moduleOptions(page.results ?? [])),
    }},
  }),
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
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
    width: '10%',
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<ModulePartRow>({
  key: 'module-part-table',
  columns,
  listOptions: (query) => memberModulePartListOptions({
    query: {
      ...baseListParams(query),

      ...(query.name ? {name: String(query.name)} : {}),
      ...(query.module ? {module: String(query.module)} : {}),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading module parts'),
})
</script>
