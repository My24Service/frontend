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
      :title="$trans('Statuscodes')"
      :search-label="$trans('Search statuscodes')"
      :refresh="refresh"
      :empty-text="$trans('No statuscodes found')"
      :label="$trans('Statuscode')"
      :delete-modal="{
        modalId: 'delete-statuscode-modal',
        confirmText: $trans('Are you sure you want to delete this statuscode?'),
        destroyMutation: statuscodeStatuscodeDestroyMutation,
        invalidate: invalidateStatuscodeLists,
        deletedDetail: $trans('Statuscode has been deleted'),
        deleteError: $trans('Error deleting statuscode'),
      }"
    >
      <template #icon><IBiFileEarmarkCheckFill></IBiFileEarmarkCheckFill></template>
      <template #toolbar-extra>
        <StatuscodePills :active="codeType" :from-settings="fromSettings" />
      </template>
      <template #add>
        <router-link :to="toRoute(routeNames.add)" class="btn btn-primary">
          <IBiFileEarmarkPlus></IBiFileEarmarkPlus>{{ $trans('Add statuscode') }}
        </router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script lang="ts" setup>
import { RouterLink } from 'vue-router'

import {
  statuscodeStatuscodeDestroyMutation,
  statuscodeStatuscodeListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedStatuscodeList } from '@/api/types.gen'
import RowAction from '@/components/RowAction.vue'
import {
  ServerTable,
  baseListParams,
  createAppColumnHelper,
  useServerTable,
  type ListRow,
} from '@/features/table'

import { routeNamesFor, type CodeType } from './code-types'
import { invalidateStatuscodeLists } from './invalidation'
import StatuscodePills from './StatuscodePills.vue'
import StatuscodeLabel from './StatuscodeLabel.vue'
import StatuscodeRoleBadges from './StatuscodeRoleBadges.vue'

const props = withDefaults(defineProps<{
  codeType: CodeType
  fromSettings?: boolean
}>(), {
  fromSettings: false,
})

const routeNames = computed(() => routeNamesFor(props.codeType, props.fromSettings))

type StatuscodeRow = ListRow<PaginatedStatuscodeList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const columnHelper = createAppColumnHelper<StatuscodeRow>()

/** The legacy "Type" column: which lifecycle flags a statuscode carries, one line each. */
function typeLines(row: StatuscodeRow): string[] {
  const lines: string[] = []
  if (row.start_order) lines.push($trans('Start order'))
  if (row.end_order) lines.push($trans('End order'))
  if (row.after_end_order) lines.push($trans('After end order'))
  if (row.num_days_model_field) {
    lines.push(`${row.num_days_model_field} ${row.num_days_operator} ${row.num_days}`)
  }
  return lines
}

const columns = columnHelper.columns([
  columnHelper.accessor('statuscode', {
    header: $trans('Statuscode'),
    enableSorting: false,
    meta: {width: '15%'},
    cell: (info) => h(RouterLink, {
      to: toRoute(routeNames.value.edit, {pk: info.row.original.id}),
    }, () => info.getValue()),
  }),
  columnHelper.display({
    id: 'preview',
    header: $trans('Preview'),
    cell: (info) => h(StatuscodeLabel, {
      text: info.row.original.statuscode,
      color: info.row.original.color,
      textColor: info.row.original.text_color,
    }),
  }),
  columnHelper.display({
    id: 'type',
    header: $trans('Type'),
    cell: (info) => h('div', typeLines(info.row.original).map((line) =>
      h('div', [h('span', {class: 'statuscode_type'}, line)]))),
  }),
  columnHelper.display({
    id: 'roles',
    header: $trans('Roles'),
    cell: (info) => h(StatuscodeRoleBadges, {roles: info.row.original.roles ?? []}),
  }),
  columnHelper.accessor('description', {
    header: $trans('Description'),
    enableSorting: false,
  }),
  columnHelper.display({
    id: 'actions',
    header: $trans('Actions'),
    meta: {width: '20%'},
    cell: (info) => h('ul', {class: 'statuscode-actions'}, info.row.original.actions.map((action) =>
      h('li', {key: action.id}, [
        h(RouterLink, {
          to: toRoute(routeNames.value.actionEdit, {pk: action.id}),
        }, () => `${action.name} (${action.type})`),
      ]))),
  }),
  columnHelper.display({
    id: 'icons',
    header: '',
    meta: {width: '15%'},
    cell: (info) => h('div', {class: 'h2 float-end'}, [
      h(RowAction, {icon: 'plus',
        title: $trans('Add action'),
        router_name: routeNames.value.actionAdd,
        router_params: {statuscode_pk: info.row.original.id},
      }),
      h(RowAction, {icon: 'delete',
        title: $trans('Delete'),
        method: () => tableRef.value?.showDeleteModal(info.row.original.id),
      }),
    ]),
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<StatuscodeRow>({
  key: 'statuscode-table',
  columns,
  listOptions: (query) => statuscodeStatuscodeListOptions({
    query: {
      ...baseListParams(query),
      code_type: props.codeType,
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading statuscodes'),
})
</script>

<style scoped>
:deep(span.statuscode_type) {
  font-style: italic;
}
:deep(ul.statuscode-actions) {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
