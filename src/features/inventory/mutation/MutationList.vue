<template>
  <div class="app-page">
    <ServerTable
      v-model:search-draft="searchDraft"
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :title="$trans('Mutations')"
      :search-label="$trans('Search')"
      :label="$trans('Mutation')"
      :refresh="refresh"
      :searchable="false"
    >
      <template #icon><IBiArrowLeftRight /></template>
      <template #add>
        <router-link
          :to="{name: 'mutation-add'}"
          class="btn btn-primary"
        >{{ $trans('Add mutation') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { ServerTable, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'

/**
 * The stock mutations, newest data first as the API sends them.
 *
 * Two things differ from the legacy screen, both in the Slice README's
 * ledger: the endpoint declares no `q` and no `ordering` (the backend list is
 * a plain paged list), so the search field and the column sorting are gone
 * rather than sending parameters nothing reads.
 */
type MutationRow = ListRow<Api.InventoryStockmutationsimpleList.ListResponse>

const helper = createAppColumnHelper<MutationRow>()

const columns = helper.columns([
  helper.accessor('material_name', {
    header: $trans('Material'),
  }),
  helper.accessor('summary', {
    header: $trans('Mutation'),
    // The summary is HTML by design: the server builds `<b>Move to</b> <location>`
    // and the list has always rendered it as markup.
    cell: ({ row }) => h('span', {innerHTML: row.original.summary ?? ''}),
  }),
  helper.accessor('amount', {
    header: $trans('Amount'),
  }),
  helper.accessor('modified', {
    header: $trans('Date'),
  }),
])

const { table, searchDraft, pagination, count, isLoading, isFetching, refresh } = useServerTable<MutationRow>({
  key: 'mutation-table',
  columns,
  resource: Api.InventoryStockmutationsimpleList,
  enableSorting: false,
  urlSync: true,
  loadError: $trans('Error loading mutations'),
})
</script>
