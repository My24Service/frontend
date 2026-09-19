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
      :title="$trans('Branches')"
      :search-label="$trans('Search branches')"
      :label="$trans('Branch')"
      :empty-text="$trans('No branches found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-branch-modal',
        confirmText: $trans('Are you sure you want to delete this branch?'),
        destroyMutation: companyBranchDestroyMutation,
        invalidate: invalidateBranchList,
        deletedDetail: $trans('Branch has been deleted'),
        deleteError: $trans('Error deleting branch'),
      }"
    >
      <template #icon><IBiShop /></template>
      <template #add>
        <router-link
          :to="{name: addRoute}"
          class="btn btn-primary"
        >{{ $trans('New branch') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { BLink } from 'bootstrap-vue-next'
import IBiEnvelope from '~icons/bi/envelope'
import {
  companyBranchDestroyMutation,
  companyBranchListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedBranchList } from '@/api/types.gen'
import { ServerTable, baseListParams, createActionColumn, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import { $trans } from '@/services/i18n'
import { invalidateBranchList } from './invalidation'

/**
 * The branch list, mounted by the company router and the settings layout.
 * The mount is a boolean rather than a route stem: both mounts answer the
 * same add/edit/view family names switched by `from_settings`, which the
 * layouts supply (false on company, true on settings) - the user lists work
 * the same way. Row actions show on both mounts, as the legacy screen did.
 */
const props = withDefaults(defineProps<{
  /** Mounted by the settings layout, which switches the route name family. */
  from_settings?: boolean
}>(), {
  from_settings: false,
})

type BranchRow = ListRow<PaginatedBranchList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const viewRoute = computed(() => (props.from_settings ? 'settings-branch-view' : 'company-branch-view'))
const addRoute = computed(() => (props.from_settings ? 'settings-branch-add' : 'company-branch-add'))
const editRoute = computed(() => (props.from_settings ? 'settings-branch-edit' : 'company-branch-edit'))

const helper = createAppColumnHelper<BranchRow>()

const columns = helper.columns([
  // Sorted by the name it leads with: the cell shows "name, city, country".
  helper.accessor('name', {
    header: $trans('Branch'),
    cell: ({ row }) => h(RouterLink, {
      to: { name: viewRoute.value, params: { pk: row.original.id } },
    }, () => `${row.original.name}, ${row.original.city}, ${row.original.country_code ?? ''}`),
  }),
  helper.accessor('contact', {
    header: $trans('Contact'),
    cell: ({ row }) => {
      const contact = row.original.contact?.trim() ? row.original.contact : null
      if (!contact) return null
      if (row.original.email) {
        return h(BLink, { class: 'px-1', href: `mailto:${row.original.email}` }, () => [
          contact,
          ' ',
          h(IBiEnvelope),
        ])
      }
      return contact
    },
  }),
  helper.accessor('tel', {
    header: $trans('Phone'),
    cell: ({ row }) => {
      const mobile = row.original.mobile?.trim() ? row.original.mobile : null
      if (!mobile) return row.original.tel
      return `${row.original.tel ?? ''} — ${$trans('mobile')}: ${mobile}`
    },
  }),
  helper.accessor('address', {
    header: $trans('Address'),
  }),
  // The header says Postal and the cell carries the country code - the legacy
  // screen's own mix-up, kept as it renders. See the module README.
  helper.accessor('country_code', {
    header: $trans('Postal'),
  }),
  helper.accessor('city', {
    header: $trans('City'),
  }),
  createActionColumn(helper, {
    editRoute: editRoute.value,
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
  }),
])

const { table, searchDraft, pagination, count, isLoading, isFetching, refresh } = useServerTable<BranchRow>({
  key: 'branch-table',
  columns,
  listOptions: (query) => companyBranchListOptions({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading branches'),
})
</script>
