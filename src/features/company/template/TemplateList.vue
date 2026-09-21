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
      :title="$trans('Templates')"
      :search-label="$trans('Search templates')"
      :label="$trans('Template')"
      :empty-text="$trans('No templates found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-template-modal',
        confirmText: $trans('Are you sure you want to delete this template?'),
        destroyMutation: companyTemplateDestroyMutation,
        invalidate: invalidateReads(companyTemplate),
        deletedDetail: $trans('Template has been deleted'),
        deleteError: $trans('Error deleting template'),
      }"
    >
      <template #icon><IBiFileEarmarkCheckFill /></template>
      <template #add>
        <router-link
          :to="{name: 'customer-template-add'}"
          class="btn btn-primary"
        ><IBiFileEarmarkPlus />{{ $trans('Add template') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import IBiCheck from '~icons/bi/check'
import {
  companyTemplateDestroyMutation,
  companyTemplateListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedTemplateList } from '@/api/types.gen'
import { companyTemplate } from '@/api/resources.gen'
import { invalidateReads } from '@/features/forms'
import { ServerTable, baseListParams, createActionColumn, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import { $trans } from '@/services/i18n'

/**
 * The template list. The route names are the legacy `customer-template-*`
 * family: URLs stay stable across the migration, so they keep their names.
 */
type TemplateRow = ListRow<PaginatedTemplateList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const helper = createAppColumnHelper<TemplateRow>()

const columns = helper.columns([
  helper.accessor('name', {
    header: $trans('Name'),
    cell: ({ row }) => h(RouterLink, {
      to: { name: 'customer-template-edit', params: { pk: row.original.id } },
    }, () => row.original.name),
  }),
  helper.accessor('template_type', {
    header: $trans('Type'),
  }),
  helper.accessor('description', {
    header: $trans('Description'),
  }),
  helper.display({
    id: 'is_active',
    header: $trans('Is active'),
    cell: ({ row }) => (row.original.is_active ? h(IBiCheck) : null),
  }),
  helper.accessor('created', {
    header: $trans('Created'),
  }),
  helper.accessor('modified', {
    header: $trans('Modified'),
  }),
  createActionColumn(helper, {
    editRoute: 'customer-template-edit',
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
  }),
])

const { table, searchDraft, pagination, count, isLoading, isFetching, refresh } = useServerTable<TemplateRow>({
  key: 'template-table',
  columns,
  // The legacy table offered no sorting, and the endpoint declares no
  // `ordering` - the headers stay non-sortable rather than rendering controls
  // nothing honours.
  enableSorting: false,
  listOptions: (query) => companyTemplateListOptions({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading templates'),
})
</script>
