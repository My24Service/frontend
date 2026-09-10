<template>
  <div class="app-page">
    <ListDeleteModal
      ref="deleteModalRef"
      modal-id="delete-customer-modal"
      :confirm-text="$trans('Are you sure you want to delete this customer?')"
      :destroy-mutation="() => customerCustomerDestroyMutation({headers: SESSION_AUTH_HEADER})"
      :invalidate="(queryClient) => queryClient.invalidateQueries({queryKey: customerCustomerListQueryKey()})"
      :deleted-detail="$trans('Customer has been deleted')"
      :delete-error="$trans('Error deleting customer')"
    />

    <ListPageHeader
      v-model:search-draft="searchDraft"
      :title="$trans('Customers')"
      :search-label="$trans('Search customers')"
      :refresh="refresh"
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
    </ListPageHeader>

    <div class="page-details panel">
      <ListTablePanel
        :table="table"
        :pagination="pagination"
        :count="count"
        :is-loading="isLoading"
        :is-fetching="isFetching"
        :empty-text="$trans('No customers found')"
        :label="$trans('Customer')"
        :row-class="rowClass"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { h, ref } from 'vue'
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
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { baseListParams, useServerPagedList } from '@/features/table/server-paged-list'
import ListPageHeader from '@/features/table/ListPageHeader.vue'
import ListTablePanel from '@/features/table/ListTablePanel.vue'
import ListDeleteModal from '@/features/table/ListDeleteModal.vue'
import { createActionColumn, type ListRow } from '@/features/table/list-columns'

type CustomerRow = ListRow<PaginatedCustomerList>

const deleteModalRef = ref<InstanceType<typeof ListDeleteModal> | null>(null)

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
    onDelete: (id) => deleteModalRef.value?.showDeleteModal(id),
  }),
])

function rowClass(row: CustomerRow) {
  return row.branch_view ? 'branch' : ''
}

type CustomerListQueryParams = NonNullable<CustomerCustomerListData['query']>

const paged = useServerPagedList<CustomerRow>({
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

const table = useAppTable({
  key: 'customer-table',
  columns,
  ...paged.tableOptions,
})

const {searchDraft, pagination, globalFilter, isLoading, isFetching, count, refresh} = paged

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
