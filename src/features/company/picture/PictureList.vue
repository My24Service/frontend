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
      :title="$trans('Pictures')"
      :search-label="$trans('Search pictures')"
      :label="$trans('Picture')"
      :empty-text="$trans('No pictures found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-picture-modal',
        confirmText: $trans('Are you sure you want to delete this picture?'),
        destroyMutation: Api.CompanyPicture.destroy.mutation,
        invalidate: Api.CompanyPicture.invalidate,
        deletedDetail: $trans('Picture has been deleted'),
        deleteError: $trans('Error deleting picture'),
      }"
    >
      <template #icon><IBiImage /></template>
      <template #add>
        <router-link
          :to="{name: 'company-picture-add'}"
          class="btn btn-primary"
        ><IBiImage /> {{ $trans('Add picture') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { NO_IMAGE_URL } from '@/constants'
import { ServerTable, baseListParams, createActionColumn, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
type PictureRow = ListRow<Api.PaginatedPictureList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const helper = createAppColumnHelper<PictureRow>()

const columns = helper.columns([
  helper.display({
    id: 'picture',
    header: $trans('Picture'),
    // Ordering by the stored file's path is meaningless, and the endpoint's
    // allow-list has no such term - the column stays non-sortable rather than
    // sending a parameter nothing honours. See the module README.
    enableSorting: false,
    cell: ({ row }) => h(RouterLink, {
      to: { name: 'company-picture-edit', params: { pk: row.original.id } },
    }, () => h('img', {
      src: row.original.picture || NO_IMAGE_URL,
      height: 100,
      alt: '',
    })),
  }),
  helper.accessor('name', {
    header: $trans('Name'),
  }),
  helper.accessor('created', {
    header: $trans('Created'),
    cell: ({ row }) => h('small', row.original.created),
  }),
  // Name and created sort through the endpoint's `ordering` allow-list; the
  // picture and icons columns carry no such term (see above and below).
  createActionColumn(helper, {
    editRoute: 'company-picture-edit',
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
  }),
])

const { table, searchDraft, pagination, count, isLoading, isFetching, refresh } = useServerTable<PictureRow>({
  key: 'picture-table',
  columns,
  listOptions: (query) => Api.CompanyPicture.list.options({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading pictures'),
})
</script>

<style scoped>
img { margin-inline: 0; height: 100%; }
</style>
