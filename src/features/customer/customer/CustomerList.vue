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
      :row-class="rowClass"
      :title="$trans('Customers')"
      :search-label="$trans('Search customers')"
      :refresh="refresh"
      :empty-text="$trans('No customers found')"
      :label="$trans('Customer')"
      :delete-modal="{
        modalId: 'delete-customer-modal',
        confirmText: $trans('Are you sure you want to delete this customer?'),
        destroyMutation: () => customerCustomerDestroyMutation({headers: SESSION_AUTH_HEADER}),
        invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: customerCustomerListQueryKey()}),
        deletedDetail: $trans('Customer has been deleted'),
        deleteError: $trans('Error deleting customer'),
      }"
    >
      <template #icon><IBiBuilding></IBiBuilding></template>
      <template #toolbar-extra>
        <ButtonLinkDownload
          :method="downloadList"
          :title="$trans('Download')"
        />
      </template>
      <template #add>
        <router-link
          :to="{name: 'customer-add'}"
          class="btn btn-primary"
        >
          <IBiBuilding></IBiBuilding>{{$trans('Add customer')}}
        </router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script lang="ts" setup>
import { h, useTemplateRef } from 'vue'
import type { VNode, VNodeChild } from 'vue'
import { RouterLink } from 'vue-router'
import { BLink } from 'bootstrap-vue-next'

import {
  customerCustomerDestroyMutation,
  customerCustomerListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { CustomerCustomerListData, PaginatedCustomerList } from '@/api/types.gen'
import ButtonLinkDownload from '@/components/ButtonLinkDownload.vue'
import my24 from '@/services/my24'
import { $trans } from '@/services/i18n'
import { customerCustomerListQueryKey } from '@/api/@tanstack/vue-query.gen'
import { SESSION_AUTH_HEADER } from '@/features/shared/session-auth-header'
import {
  ServerTable,
  baseListParams,
  createActionColumn,
  createAppColumnHelper,
  useServerTable,
  type ListRow,
} from '@/features/table'

type CustomerRow = ListRow<PaginatedCustomerList>

// The screen's handle on the table: the icon column calls the delete modal
// through it, before this ref is populated. Typed structurally because
// ServerTable is generic over the row type.
const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

function branchText(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

const columnHelper = createAppColumnHelper<CustomerRow>()

function branchCell(row: CustomerRow) {
  const branch = row.branch_view
  if (!branch) return ''
  const contact: VNodeChild[] = []
  const contactName = branchText(branch.contact)
  if (contactName.trim() !== '') {
    contact.push(h('br'), h('b', $trans('Contact')), `: ${contactName}`)
  }
  const email = branchText(branch.email)
  if (email !== '') {
    contact.push(
      h('br'),
      `${$trans('Email')}: `,
      h(BLink, {class: 'px-1', href: `mailto:${email}`}, () => email),
    )
  }
  const tel = branchText(branch.tel)
  if (tel.trim() !== '') {
    contact.push(h('br'), `${$trans('Tel')}: ${tel}`)
  }
  const mobile = branchText(branch.mobile)
  if (mobile.trim() !== '') {
    contact.push(h('br'), `${$trans('Mobile')}: ${mobile}`)
  }

  return h('div', {class: 'listing-item'}, [
    h(RouterLink, {to: {name: 'customer-view', params: {pk: row.id}}}, () => [
      `${branchText(branch.name)}, ${branchText(branch.city)}, ${branchText(branch.country_code)} (`,
      h('span', {class: 'branch'}, $trans('Branch')),
      ')',
    ]),
    h('br'),
    `${$trans('Customer ID')}: ${row.customer_id}`,
    h('br'),
    branchText(branch.address),
    h('br'),
    `${branchText(branch.country_code)}-${branchText(branch.postal)}`,
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

    meta: {filterVariant: 'text', filterPlaceholder: '25 or 18...80'},
  }),
  columnHelper.accessor('remarks', {
    header: $trans('Remarks'),
    filterFn: 'includesString',
    enableColumnFilter: true,
    meta: {filterVariant: 'text'},

    cell: (info) => {
      const remarks = info.getValue()
      return remarks && remarks.trim() !== ''
        ? h('span', {title: remarks}, [h('small', ` ${remarks}`)])
        : ''
    },
  }),

  columnHelper.accessor('contact', {
    header: $trans('Contact'),
    filterFn: 'includesString',
    enableColumnFilter: true,
    enableSorting: false,
    meta: {filterVariant: 'text'},
  }),
  createActionColumn(columnHelper, {
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
  }),
])

function rowClass(row: CustomerRow) {
  return row.branch_view ? 'branch' : ''
}

type CustomerListQueryParams = NonNullable<CustomerCustomerListData['query']>

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh, globalFilter} = useServerTable<CustomerRow>({
  key: 'customer-table',
  columns,
  listOptions: (query) => customerCustomerListOptions({
    query: {
      ...baseListParams(query),

      ...(query.name ? {name: String(query.name)} : {}),
      ...(query.city ? {city: String(query.city)} : {}),
      ...(query.num_orders ? {num_orders: String(query.num_orders)} : {}),
      ...(query.remarks ? {remarks: String(query.remarks)} : {}),
      ...(query.contact ? {contact: String(query.contact)} : {}),
    } as CustomerListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading customers'),
})

function downloadList() {
  if (!confirm($trans('Are you sure you want to export all customers?'))) return

  // The toolbar search commits on a 300 ms debounce, so a term typed and
  // exported straight away is still only in the draft. Commit it first, or
  // the file answers a different question than the one on screen.
  globalFilter.value = searchDraft.value

  // URLSearchParams, not string concatenation: a term with '&' or '+' in it
  // would otherwise end the query or decode as a space on the backend.
  const params = new URLSearchParams()
  if (globalFilter.value) params.set('q', globalFilter.value)

  my24.downloadItemAuth(`/api/customer/export/?${params.toString()}`, 'customers.xlsx')
}
</script>

<style>
tr.branch {
  background-color: #f6cdd1;
}
</style>
