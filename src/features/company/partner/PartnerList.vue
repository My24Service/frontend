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
      :title="$trans('Partners')"
      :search-label="$trans('Search partners')"
      :label="$trans('Partner')"
      :empty-text="$trans('No partners found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-partner-modal',
        confirmText: $trans('Are you sure you want to delete this partner relation?'),
        destroyMutation: companyPartnerDestroyMutation,
        invalidate: invalidatePartnerList,
        deletedDetail: $trans('partner has been deleted'),
        deleteError: $trans('Error deleting partner'),
      }"
    >
      <template #icon><IBiPersonSquare /></template>
      <template #subnav><PillsCompanyPartners /></template>
      <template #add>
        <router-link
          :to="{name: 'partner-request-add'}"
          class="btn btn-primary"
        >{{ $trans('New partner request') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { h, useTemplateRef } from 'vue'
import IBiCheckSquareFill from '~icons/bi/check-square-fill'
import IBiPersonSquare from '~icons/bi/person-square'
import {
  companyPartnerDestroyMutation,
  companyPartnerListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedPartnerDetailList } from '@/api/types.gen'
import PillsCompanyPartners from '@/components/PillsCompanyPartners.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import { ServerTable, baseListParams, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import { $trans } from '@/services/i18n'
import { invalidatePartnerList } from '../invalidation'

/**
 * The active partner relations. No create screen - a relation is born when a
 * request is accepted, never typed in - so the add button opens the request
 * form. The pills switch between the three partner screens.
 */
type PartnerRow = ListRow<PaginatedPartnerDetailList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const helper = createAppColumnHelper<PartnerRow>()

const columns = helper.columns([
  // Sorted by the member name it shows: the endpoint's allow-list carries
  // the relation traversal, so the column id names the term, not the view's
  // dotted key. An accessor column sorts by default; a display column would
  // need an explicit opt-in.
  helper.accessor((row) => row.partner_view.name, {
    id: 'partner__name',
    header: $trans('Name'),
  }),
  helper.display({
    id: 'companycode',
    header: $trans('Company code'),
    enableSorting: false,
    cell: ({ row }) => row.original.partner_view.companycode,
  }),
  helper.display({
    id: 'city',
    header: $trans('City'),
    enableSorting: false,
    cell: ({ row }) => row.original.partner_view.city,
  }),
  helper.display({
    id: 'email',
    header: $trans('Email'),
    enableSorting: false,
    cell: ({ row }) => row.original.partner_view.email,
  }),
  helper.display({
    id: 'has_branches',
    header: $trans('Branches?'),
    enableSorting: false,
    cell: ({ row }) => (row.original.partner_view.has_branches ? h(IBiCheckSquareFill) : null),
  }),
  helper.accessor('created', {
    header: $trans('Created'),
  }),
  helper.display({
    id: 'icons',
    header: '',
    enableSorting: false,
    cell: ({ row }) => h('div', { class: 'h2 float-right' }, [
      h(IconLinkDelete, {
        title: $trans('Delete'),
        method: () => tableRef.value?.showDeleteModal(row.original.id),
      }),
    ]),
  }),
])

const { table, searchDraft, pagination, count, isLoading, isFetching, refresh } = useServerTable<PartnerRow>({
  key: 'partner-table',
  columns,
  listOptions: (query) => companyPartnerListOptions({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading partners'),
})
</script>
