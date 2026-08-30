<template>
  <div class="app-page">
    <b-modal
      id="delete-maintenance-contract-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this maintenance contract?') }}</p>
    </b-modal>

    <header>
      <div class="page-title">
        <h3><IBiFileEarmarkLock></IBiFileEarmarkLock> {{ $trans('Maintenance contracts') }} — TanStack Table PROTOTYPE</h3>
        <BButton-toolbar>
          <BButton-group class="mr-1">
            <ButtonLinkRefresh
              :method="refresh"
              :title="$trans('Refresh')"
            />
          </BButton-group>
          <input
            v-model="searchDraft"
            class="form-control form-control-sm w-auto mr-2"
            :aria-label="$trans('Search maintenance contracts')"
            :placeholder="$trans('Search maintenance contracts')"
          />
          <router-link
            :to="{name: 'maintenance-contract-add'}"
            class="btn btn-primary"
          >
            {{ $trans('Add contract') }}
          </router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class="app-detail panel overflow-auto">
      <div class="data-table">
        <ServerDataTable
          :table="table"
          :is-loading="isLoading"
          empty-text="No maintenance contracts found"
        />
      </div>
    </div>

    <ServerTablePagination
      v-if="!isLoading"
      :table="table"
      :pagination="pagination"
      :count="count"
      :label="$trans('Contract')"
      :is-fetching="isFetching"
    />
  </div>
</template>

<script lang="ts" setup>
import { h } from 'vue'
import { RouterLink } from 'vue-router'
import {
  customerMaintenanceContractDestroyMutation,
  customerMaintenanceContractListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedMaintenanceContractList } from '@/api/types.gen'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import { toDinero } from '@/utils'
import { useMainStore } from '@/stores/main'
import { $trans } from '@/utils'
import { invalidateMaintenanceContractListQueries } from './list-invalidation'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { useServerPagedList } from '@/features/table/server-paged-list'
import { useListDelete } from '@/features/table/use-list-delete'
import ServerDataTable from '@/features/table/ServerDataTable.vue'
import ServerTablePagination from '@/features/table/ServerTablePagination.vue'

/**
 * PROTOTYPE — throwaway for the TanStack Table experiment, the
 * maintenance-contract list as a second Customer data point. Mirrors the
 * original screen's columns exactly (name linking to the view, the customer
 * name, the dinero-formatted contract value, remarks, created, icons).
 * Delete with the experiment.
 *
 * The schema declares only page/page_size/q — the original's b-table sorted
 * the loaded page locally and nothing ever carried a sort on the wire, so
 * the headers stay clickable but a sort changes only state, never the
 * request.
 */

type ContractRow = NonNullable<PaginatedMaintenanceContractList['results']>[number]

const mainStore = useMainStore()

/**
 * The legacy screen stamped every row with the tenant's default currency and
 * let its price mixin build the dinero — the list response carries no
 * currency of its own. Same sum here, from the same source.
 */
function dineroFor(row: ContractRow) {
  if (!row.sum_tariffs) return null
  try {
    return toDinero(String(row.sum_tariffs), mainStore.getDefaultCurrency)
  } catch {
    return null
  }
}

const columnHelper = createAppColumnHelper<ContractRow>()

const columns = columnHelper.columns([
  columnHelper.accessor('name', {
    header: $trans('Contract name'),
    cell: (info) => h(RouterLink, {
      to: {name: 'maintenance-contract-view', params: {pk: info.row.original.id}},
    }, () => info.getValue()),
  }),
  columnHelper.accessor((row) => row.customer_view?.name, {
    id: 'customer_view_name',
    header: $trans('Customer'),
  }),
  columnHelper.accessor('sum_tariffs', {
    header: $trans('Contract value'),
    cell: (info) => {
      const dinero = dineroFor(info.row.original)
      return dinero ? h('span', dinero.toFormat('$0.00')) : ''
    },
  }),
  columnHelper.accessor('remarks', {header: $trans('Remarks')}),
  columnHelper.accessor('created', {
    header: $trans('Created'),
    cell: (info) => h('small', info.getValue()),
  }),
  columnHelper.display({
    id: 'icons',
    header: '',
    cell: (info) => h('div', {class: 'h2 float-right'}, [
      h(IconLinkEdit, {
        router_name: 'maintenance-contract-edit',
        router_params: {pk: info.row.original.id},
        title: $trans('Edit'),
      }),
      h(IconLinkDelete, {
        title: $trans('Delete'),
        method: () => showDeleteModal(info.row.original.id),
      }),
    ]),
  }),
])

const paged = useServerPagedList<ContractRow>({
  listOptions: (query) => customerMaintenanceContractListOptions({
    query: {
      page: query.page,
      page_size: query.page_size,
      ...(query.q ? {q: query.q} : {}),
    },
  }),
  getRowId: (row: ContractRow) => String(row.id),
  loadError: $trans('Error loading maintenance contracts'),
})

const table = useAppTable({
  key: 'maintenance-contract-table',
  columns,
  ...paged.tableOptions,
})

// Top-level refs so the template unwraps them.
const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged

const {deleteModal, showDeleteModal, doDelete} = useListDelete({
  destroyMutation: () => customerMaintenanceContractDestroyMutation(),
  invalidateAfterDelete: (queryClient) => invalidateMaintenanceContractListQueries(queryClient),
  copy: {
    deletedDetail: $trans('Maintenance contract has been deleted'),
    deleteError: $trans('Error deleting maintenance contract'),
  },
})
</script>
