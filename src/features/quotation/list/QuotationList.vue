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
      :title="pageTitle"
      :search-label="$trans('Search quotations')"
      :label="$trans('Quotation')"
      :empty-text="$trans('No quotations found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-quotation-modal',
        confirmText: $trans('Are you sure you want to delete this quotation?'),
        resource: Api.QuotationQuotation,
        deletedDetail: $trans('Quotation has been deleted'),
        deleteError: $trans('Error deleting quotation'),
      }"
    >
      <template #icon><IBiFileEarmarkTextFill /></template>
      <template #subnav><PillsNav :items="quotationPills" /></template>
      <template #add>
        <router-link class="btn btn-primary" :to="{name: 'quotation-add'}">
          <IBiFileEarmarkPlus /> {{ $trans('Add quotation') }}
        </router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import IBiMailbox from '~icons/bi/mailbox'
import IBiArrowUpRightCircle from '~icons/bi/arrow-up-right-circle'

import type { PillNavItem } from '@/components/PillsNav.vue'
import RowAction from '@/components/RowAction.vue'
import { useQueryErrorToast } from '@/features/forms'
import {
  ServerTable,
  createAppColumnHelper,
  useListModeReset,
  useServerTable,
  WHOLE_COLLECTION_PAGE_SIZE,
} from '@/features/table'
import QuotationStatusCell from './QuotationStatusCell.vue'

/**
 * The three quotation lists, one screen: the route name picks the endpoint
 * and the title (definitive, preliminary, sent), the pills switch between
 * them.
 */
const { route } = useCommon()
const pageTitle = computed(() => route.name === 'preliminary-quotations'
  ? $trans('Preliminary quotations')
  : route.name === 'quotations-sent' ? $trans('Sent quotations') : $trans('Definitive quotations'))
const quotationPills: PillNavItem[] = [
  {label: $trans('Definitive'), to: {name: 'quotation-list'}},
  {label: $trans('Preliminary'), to: {name: 'preliminary-quotations'}},
  {label: $trans('Sent'), to: {name: 'quotations-sent'}},
]
const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const codesQuery = useQuery(Api.StatuscodeStatuscode.list.options({query: {code_type: 'quotation', page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE}}))
const statuscodes = computed(() => codesQuery.data.value?.results ?? [])
useQueryErrorToast(codesQuery.error, $trans('Error loading statuscodes'))

/** Where a row's name leads: a preliminary quotation is still edited, a definitive one viewed. */
function rowRoute(quotation: Api.Quotation): RouteTo {
  const params = {pk: quotation.id}
  if (quotation.preliminary) return {name: 'quotation-edit-preliminary', params}
  return quotation.is_sent ? {name: 'quotations-sent-view', params} : {name: 'quotation-view', params}
}
const rowLink = (quotation: Api.Quotation, label: string | null | undefined) =>
  h(RouterLink, {to: fromRouteTo(rowRoute(quotation))}, () => label ?? '')

const icon = (component: Component) => h(component, {'aria-hidden': true, class: 'edit-icon'})

const helper = createAppColumnHelper<Api.Quotation>()
const columns = helper.columns([
  helper.accessor('name', {header: $trans('Name'), cell: ({row}) => rowLink(row.original, row.original.name)}),
  helper.accessor('quotation_name', {header: $trans('Customer'), cell: ({row}) => rowLink(row.original, row.original.quotation_name)}),
  helper.accessor('quotation_reference', {header: $trans('Reference')}),
  helper.accessor('quotation_city', {header: $trans('City')}),
  helper.accessor('total', {header: $trans('Total')}),
  helper.accessor('vat', {header: $trans('Vat')}),
  helper.display({
    id: 'status', header: $trans('Status'),
    cell: ({row}) => h(QuotationStatusCell, {quotation: row.original, statuscodes: statuscodes.value}),
  }),
  helper.display({
    id: 'icons', header: '',
    cell: ({row}) => {
      const quotation = row.original
      const editable = quotation.preliminary && !quotation.is_sent
      return h('div', {class: 'h2 quotation-icons'}, [
        editable && h(RowAction, {icon: 'edit', class: 'mr-2', title: $trans('Edit'), router_name: 'quotation-edit', router_params: {pk: quotation.id}}),
        editable && h(RowAction, {icon: 'delete', class: 'mr-2', title: $trans('Delete'), method: () => tableRef.value?.showDeleteModal(quotation.id)}),
        !quotation.preliminary && h(RouterLink, {class: 'mr-2', title: $trans('Create order'), to: {name: 'order-add-quotation', params: {quotation_id: quotation.id}}}, () => icon(IBiArrowUpRightCircle)),
        !quotation.preliminary && h(RouterLink, {class: 'mr-2', title: $trans('Send quotation'), to: {name: 'quotation-send', query: {quotationId: quotation.id}}}, () => icon(IBiMailbox)),
      ])
    },
  }),
])

const {table, searchDraft, globalFilter, pagination, count, isLoading, isFetching, refresh} = useServerTable<Api.Quotation>({
  key: 'quotation-table',
  columns,
  // The API offers search and pagination, but no ordering or column filters.
  enableSorting: false,
  enableColumnFilters: false,
  listOptions: ({page, page_size, q}) => {
    const options = {query: {page, page_size, ...(q ? {q} : {})}}
    if (route.name === 'preliminary-quotations') return Api.QuotationQuotationPreliminary.list.options(options)
    if (route.name === 'quotations-sent') return Api.QuotationQuotationSent.list.options(options)
    return Api.QuotationQuotation.list.options(options)
  },
  urlSync: true,
  loadError: $trans('Error loading quotations'),
})

useListModeReset(route, {searchDraft, globalFilter, pagination})
</script>

<style scoped>
:deep(.quotation-icons) { display: flex; justify-content: flex-end; }
</style>
