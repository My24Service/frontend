<template>
  <div class="app-page">
    <b-modal
      id="delete-customer-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this customer?') }}</p>
    </b-modal>

    <header>
      <div class="page-title">
        <h3>{{ $trans("Customers") }} — TanStack Table PROTOTYPE</h3>
        <BButton-toolbar>
          <BButton-group class="mr-1">
            <ButtonLinkRefresh
              :method="refresh"
              :title="$trans('Refresh')"
            />
            <ButtonLinkDownload
              :method="downloadList"
              :title="$trans('Download')"
            />
          </BButton-group>
          <input
            v-model="searchDraft"
            class="form-control form-control-sm w-auto mr-2"
            :aria-label="$trans('Search customers')"
            :placeholder="$trans('Search customers')"
          />
          <router-link
            :to="{name: 'customer-add'}"
            class="btn btn-primary"
          >
            <IBiBuilding></IBiBuilding>{{$trans('Add customer')}}
          </router-link>
        </BButton-toolbar>
      </div>
    </header>

    <!-- PROTOTYPE: state surface. Shows what the table state is and what
         wire query it maps to; deleted with the experiment. -->
    <div class="panel p-2 mb-2 small text-muted prototype-state">
      PROTOTYPE STATE —
      sorting: <code>{{ sorting.length ? JSON.stringify(sorting) : '—' }}</code>,
      filters: <code>{{ columnFilters.length ? JSON.stringify(columnFilters) : '—' }}</code>,
      q: <code>"{{ globalFilter }}"</code>,
      page: <code>{{ pagination.pageIndex + 1 }}/{{ Math.max(table.getPageCount(), 1) }} × {{ pagination.pageSize }}</code>
      <br/>
      wire: <code>?{{ wireString }}</code>
      <br/>
      url: <code>?{{ urlParamString }}</code>
    </div>

    <div class="app-detail panel overflow-auto">
      <div class="data-table">
        <ServerDataTable
          :table="table"
          :is-loading="isLoading"
          empty-text="No customers found"
          :row-class="rowClass"
        />
      </div>
    </div>

    <ServerTablePagination
      v-if="!isLoading"
      :table="table"
      :pagination="pagination"
      :count="count"
      :label="$trans('Customer')"
      :is-fetching="isFetching"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, h } from 'vue'
import type { VNode } from 'vue'
import { RouterLink } from 'vue-router'
import { BLink } from 'bootstrap-vue-next'

import {
  customerCustomerDestroyMutation,
  customerCustomerListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedCustomerList } from '@/api/types.gen'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkDownload from '@/components/ButtonLinkDownload.vue'
import my24 from '@/services/my24'
import { $trans } from '@/utils'
import { invalidateCustomerListQueries } from './list-invalidation'
import { SESSION_AUTH_HEADER } from '../session-auth-header'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { useServerPagedList } from '@/features/table/server-paged-list'
import { useListDelete } from '@/features/table/use-list-delete'
import ServerDataTable from '@/features/table/ServerDataTable.vue'
import ServerTablePagination from '@/features/table/ServerTablePagination.vue'

/**
 * PROTOTYPE — throwaway for the TanStack Table experiment, the second data
 * point after the Member list (`MemberListTable.vue`). Same question, a
 * different list: does the shared server-paged table kit hold up on a screen
 * whose wire contract is narrower? Delete with the verdict.
 *
 * The screen is only its own remainder: the column definitions (with the
 * branch-row composite cell), the row class, and the wire mapping. Everything
 * shared — the table state, the wire query, the query itself, the delete
 * flow, the markup — lives in `src/features/table/`.
 *
 * Sorting rides the wire in the customer list's **legacy sort spelling**:
 * `sort_field`/`sort_dir`, one column and one direction — the contract the
 * production screen already speaks and the backend's SortingMixin reads
 * (declared in the schema as of the column-filter grammar work; the Slice
 * README's ledger #1 is closed). The URL mirror carries the engine's
 * `ordering=` shape as view state; the wire carries the legacy pair.
 *
 * Column filters ride the wire under the shared bare-name grammar (no
 * `__icontains` suffixes — see `src/features/table/server-paged-list.ts` and
 * the backend's apps/core/filters.py): name, city and remarks narrow as
 * case-insensitive substrings, num_orders takes an exact value or a
 * `18...80` (inclusive) / `18..80` (exclusive) range. `urlSync` mirrors the
 * whole wire query into the URL bar, so a narrowed view survives a reload
 * and can be shared as a link.
 */

// ── columns ─────────────────────────────────────────────────────────────────

type CustomerRow = NonNullable<PaginatedCustomerList['results']>[number] & {
  branch_view: Record<string, any> | null
}

const columnHelper = createAppColumnHelper<CustomerRow>()

/** The branch row's composite name cell — the legacy screen's whole listing
 * item, byte for byte's worth of markup, as vnodes. */
function branchCell(row: CustomerRow) {
  const branch = row.branch_view
  if (!branch) return ''
  const contact: unknown[] = []
  if (branch.contact && branch.contact.trim() !== '') {
    contact.push(h('br'), h('b', $trans('Contact')), `: ${branch.contact}`)
  }
  if (branch.email) {
    contact.push(
      h('br'),
      `${$trans('Email')}: `,
      h(BLink, {class: 'px-1', href: `mailto:${branch.email}`}, () => branch.email),
    )
  }
  if (branch.tel && branch.tel.trim() !== '') {
    contact.push(h('br'), `${$trans('Tel')}: ${branch.tel}`)
  }
  if (branch.mobile && branch.mobile.trim() !== '') {
    contact.push(h('br'), `${$trans('Mobile')}: ${branch.mobile}`)
  }

  return h('div', {class: 'listing-item'}, [
    h(RouterLink, {to: {name: 'customer-view', params: {pk: row.id}}}, () => [
      `${branch.name}, ${branch.city}, ${branch.country_code} (`,
      h('span', {class: 'branch'}, $trans('Branch')),
      ')',
    ]),
    h('br'),
    `${$trans('Customer ID')}: ${row.customer_id}`,
    h('br'),
    branch.address,
    h('br'),
    `${branch.country_code}-${branch.postal}`,
    ...contact,
  ])
}

const columns = columnHelper.columns([
  columnHelper.accessor('name', {
    header: $trans('Company'),
    filterFn: 'includesString',
    enableColumnFilter: true,
    meta: {filterVariant: 'text'},
    cell: (info) => {
      const row = info.row.original
      if (row.branch_view) return branchCell(row)
      return h('span', {class: 'listing-item', title: `${$trans('Customer ID:')} ${row.customer_id}`}, [
        h(RouterLink, {to: {name: 'customer-view', params: {pk: row.id}}}, () => row.name),
      ])
    },
  }),
  columnHelper.display({
    id: 'contract',
    header: '',
    cell: (info) => {
      const row = info.row.original
      const parts: VNode[] = []
      if (row.maintenance_contract && row.maintenance_contract.trim() !== '') {
        parts.push(h('b', row.maintenance_contract), h('small', ` ${$trans('Maintenance contract')}`))
      }
      if (row.standard_hours_txt !== '0:00') {
        parts.push(h('b', row.standard_hours_txt), h('small', {class: 'dimmed'}, ` ${$trans('Standard hours')}`))
      }
      // One wrapper vnode, never a bare array: flexRender treats a returned
      // object as a component type (`h(...)`) — an array lands there as
      // "missing template or render function" and renders nothing.
      return h('div', parts)
    },
  }),
  columnHelper.accessor('city', {
    header: '',
    filterFn: 'includesString',
    enableColumnFilter: true,
    meta: {filterVariant: 'text'},
  }),
  columnHelper.accessor('num_orders', {
    header: $trans('Orders'),
    filterFn: 'equalsString',
    enableColumnFilter: true,
    // The number grammar on the wire: an exact value, or a low..high range
    // spelled with two dots (exclusive) or three (inclusive).
    meta: {filterVariant: 'text', filterPlaceholder: '25 or 18...80'},
  }),
  columnHelper.accessor('remarks', {
    header: $trans('Remarks'),
    filterFn: 'includesString',
    enableColumnFilter: true,
    meta: {filterVariant: 'text'},
    // The legacy cell showed an info icon (an auto-imported global component
    // a render function cannot reach) with the remarks as its hover title;
    // the prototype renders the text with the same title.
    cell: (info) => {
      const remarks = info.getValue()
      return remarks && remarks.trim() !== ''
        ? h('span', {title: remarks}, [h('small', ` ${remarks}`)])
        : ''
    },
  }),
  columnHelper.display({
    id: 'icons',
    header: '',
    cell: (info) => h('div', {class: 'h2 float-right'}, [
      h(IconLinkDelete, {
        title: $trans('Delete'),
        method: () => showDeleteModal(info.row.original.id),
      }),
    ]),
  }),
])

/** The branch-row highlight, as the legacy `tbody-tr-class` applied it. */
function rowClass(row: CustomerRow) {
  return row.branch_view ? 'branch' : ''
}

// ── the engine: state + wire query + query ──────────────────────────────────

const paged = useServerPagedList<CustomerRow>({
  listOptions: (query) => customerCustomerListOptions({
    query: {
      page: query.page,
      page_size: query.page_size,
      ...(query.q ? {q: query.q} : {}),
      // The declared column-filter params, in the shared bare-name grammar
      // (no `__icontains` suffixes — the backend's filter kind decides the
      // lookup). The engine mirrors these into the URL bar (urlSync).
      ...(query.name ? {name: String(query.name)} : {}),
      ...(query.city ? {city: String(query.city)} : {}),
      ...(query.num_orders ? {num_orders: String(query.num_orders)} : {}),
      ...(query.remarks ? {remarks: String(query.remarks)} : {}),
      // The legacy sort contract (ledger #1, now closed): one column, one
      // direction — the engine's sorting list folds to its first term.
      ...(query.ordering?.length ? {
        sort_field: query.ordering[0].replace(/^-/, ''),
        sort_dir: query.ordering[0].startsWith('-') ? 'desc' : 'asc',
      } : {}),
    },
  }),
  urlSync: true,
  getRowId: (row: CustomerRow) => String(row.id),
  loadError: $trans('Error loading customers'),
})

const table = useAppTable({
  key: 'customer-table',
  columns,
  ...paged.tableOptions,
})

// Top-level refs so the template unwraps them.
const {searchDraft, pagination, sorting, columnFilters, globalFilter, wireQuery, urlParams, isLoading, isFetching, count, refresh} = paged

/** The exact query string the client sends — for the state surface above. */
const wireString = computed(() => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(wireQuery.value)) {
    params.set(key, Array.isArray(value) ? value.join(',') : String(value))
  }
  return params.toString()
})

/** The query the URL bar carries — the same mirror, read off the sync's
 * reactive params so the surface keeps up with the address bar. */
const urlParamString = computed(() => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(urlParams ?? {})) {
    if (Array.isArray(value)) value.forEach((entry) => params.append(key, entry))
    else params.set(key, String(value))
  }
  return params.toString()
})

// ── export ──────────────────────────────────────────────────────────────────

function downloadList() {
  if (confirm($trans('Are you sure you want to export all customers?'))) {
    const listArgs = globalFilter.value ? [`q=${globalFilter.value}`] : []
    my24.downloadItemAuth(`/api/customer/export/?${listArgs.join('&')}`, 'customers.xlsx')
  }
}

// ── delete flow ─────────────────────────────────────────────────────────────

const {deleteModal, showDeleteModal, doDelete} = useListDelete({
  destroyMutation: () => customerCustomerDestroyMutation({headers: SESSION_AUTH_HEADER}),
  invalidateAfterDelete: (queryClient) => invalidateCustomerListQueries(queryClient),
  copy: {
    deletedDetail: $trans('Customer has been deleted'),
    deleteError: $trans('Error deleting customer'),
  },
})
</script>

<style>
tr.branch {
  background-color: #f6cdd1;
}
</style>
