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
      :page-details="false"
      :title="pageTitle"
      :search-label="$trans('Search invoices')"
      :label="$trans('Invoice')"
      :empty-text="$trans('No invoices found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-invoice-modal',
        confirmText: $trans('Are you sure you want to delete this invoice?'),
        destroyMutation: invoiceInvoiceDestroyMutation,
        invalidate: invalidateReads(invoiceInvoice),
        deletedDetail: $trans('Invoice has been deleted'),
        deleteError: $trans('Error deleting invoice'),
      }"
    >
      <template #icon><IBiFileEarmarkTextFill /></template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import IBiMailbox from '~icons/bi/mailbox'
import IBiArrowUpRightCircle from '~icons/bi/arrow-up-right-circle'
import {
  invoiceInvoiceDestroyMutation,
  invoiceInvoiceListOptions,
  invoiceInvoicePreliminaryListOptions,
  invoiceInvoiceSentListOptions,
  statuscodeStatuscodeListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { Invoice } from '@/api/types.gen'
import { invoiceInvoice } from '@/api/resources.gen'
import { invalidateReads } from '@/features/forms/use-resource-form'
import RowAction from '@/components/RowAction.vue'
import { ServerTable, createAppColumnHelper, useServerTable } from '@/features/table'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans } from '@/services/i18n'
import InvoiceStatusCell from './InvoiceStatusCell.vue'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table/server-paged-list'

const route = useRoute()
const pageTitle = computed(() => route.name === 'preliminary-invoices'
  ? $trans('Preliminary invoices')
  : route.name === 'invoices-sent' ? $trans('Sent invoices') : $trans('Definitive invoices'))
const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

// A picker needs the collection, not just the table's first page. This is
// My24Pagination's maximum page size, shared with the other feature pickers.
const codesQuery = useQuery(statuscodeStatuscodeListOptions({query: {code_type: 'invoice', page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE}}))
const statuscodes = computed(() => codesQuery.data.value?.results ?? [])
useQueryErrorToast(codesQuery.error, $trans('Error loading statuscodes'))

const helper = createAppColumnHelper<Invoice>()
const columns = helper.columns([
  helper.accessor('invoice_id', {
    header: $trans('ID'),
    cell: ({row}) => h(RouterLink, {
      to: row.original.preliminary
        ? {name: 'invoice-edit', params: {pk: row.original.id, uuid: row.original.order_uuid}}
        : {name: 'invoice-view', params: {uuid: row.original.uuid}},
    }, () => '#' + row.original.invoice_id),
  }),
  helper.accessor('created_by_fullname', {header: $trans('Created by')}),
  helper.accessor('term_of_payment_days', {header: $trans('Term of payment')}),
  helper.accessor('total', {header: $trans('Total')}),
  helper.accessor('vat', {header: $trans('Vat')}),
  helper.display({
    id: 'status', header: $trans('Status'),
    cell: ({row}) => h(InvoiceStatusCell, {invoice: row.original, statuscodes: statuscodes.value}),
  }),
  helper.display({
    id: 'icons', header: '',
    cell: ({row}) => h('div', {class: 'h2 invoice-icons'}, [
      row.original.preliminary
        ? h(RowAction, {icon: 'delete',title: $trans('Delete'), method: () => tableRef.value?.showDeleteModal(row.original.id)})
        : h(RouterLink, {class: 'icon-link', title: $trans('Send invoice'), to: {name: 'invoice-send', query: {invoiceId: row.original.id}}}, () => h(IBiMailbox, {'aria-hidden': true, class: 'edit-icon'})),
      h(RouterLink, {class: 'icon-link', title: $trans('Order'), to: {name: 'order-view', params: {pk: row.original.order}}}, () => h(IBiArrowUpRightCircle, {'aria-hidden': true, class: 'edit-icon'})),
    ]),
  }),
])

const {table, searchDraft, globalFilter, pagination, count, isLoading, isFetching, refresh} = useServerTable<Invoice>({
  key: 'invoice-table',
  columns,
  // The API offers search and pagination, but no ordering or column filters.
  enableSorting: false,
  enableColumnFilters: false,
  listOptions: ({page, page_size, q}) => {
    const options = {query: {page, page_size, ...(q ? {q} : {})}}
    if (route.name === 'preliminary-invoices') return invoiceInvoicePreliminaryListOptions(options)
    if (route.name === 'invoices-sent') return invoiceInvoiceSentListOptions(options)
    return invoiceInvoiceListOptions(options)
  },
  urlSync: true,
  loadError: $trans('Error loading invoices'),
})

// A new list domain must not inherit a page that may not exist there. Run
// before the query observer so no request escapes with the previous page.
// Initial URL restoration remains useServerTable's responsibility.
watch(() => route.name, () => {
  const page = Number(route.query.page ?? 1)
  const pageSize = Number(route.query.page_size ?? pagination.value.pageSize)
  if (typeof route.query.q === 'string') {
    searchDraft.value = route.query.q
    globalFilter.value = route.query.q
  }
  pagination.value = {
    pageIndex: Number.isInteger(page) && page > 0 ? page - 1 : 0,
    pageSize: Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 20,
  }
}, {flush: 'sync'})
</script>

<style scoped>
:deep(.invoice-icons) { display: flex; justify-content: flex-end; }
:deep(.invoice-icons .icon-link) { padding-right: 8px; }
</style>
