import { RouterLink } from 'vue-router'
import {
  companyBranchAutocompleteListOptions,
  customerCustomerAutocompleteListOptions,
  orderFilterGetStatusesRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { AddressAutocompleteRow, PaginatedOrderList, Statuscode } from '@/api/types.gen'
import RowAction from '@/components/RowAction.vue'
import IBiClock from '~icons/bi/clock'
import { useQueryErrorToast } from '@/features/forms'
import { createAppColumnHelper, type ColumnFilterSpec, type FilterOption, type ListRow } from '@/features/table'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import {
  tempsAssigneesCell,
  useTempsTenant,
} from '@/features/order/temps'
import OrderStatusCell from './OrderStatusCell.vue'

export type OrderRow = ListRow<PaginatedOrderList>

/** What the columns need from the screen: which actions to offer and what they do. */
export interface OrderColumnActions {
  canAssign: Ref<boolean>
  canDelete: Ref<boolean>
  /** Re-read the list (a status was set from a cell). */
  reload: () => void
  /** Pick a row for the dispatch screen. */
  select: (row: OrderRow) => void
  /** Open the kit's delete confirmation for a row. */
  confirmDelete: (id: number) => void
}

function orderLink(row: OrderRow, children: () => unknown) {
  return h(RouterLink, {to: {name: 'order-view', params: {pk: row.id}}}, children)
}

function assignedUsers(row: OrderRow): string[] {
  return (row.assigned_user_info ?? []).map((user) => (
    user.license_plate ? `${user.full_name} (${user.license_plate})` : user.full_name
  ))
}

function options(values: string[]): FilterOption[] {
  return values.map((value) => ({value, label: value}))
}

/** An autocomplete row as a filter choice: its id on the wire, its name on the chip. */
function ownerOptions(rows: AddressAutocompleteRow[]): FilterOption[] {
  return rows.map((row) => ({value: String(row.id), label: row.name ?? row.value}))
}

/**
 * The order list's columns. The filters over the company, the type and
 * the status are selects. The company column shows the order's own name
 * but filters on the owner it points at — a pick from the branches on a
 * tenant that has them, else from the customers — through the same
 * autocomplete reads the order form's picker uses: the whole list when it
 * is short, narrowed by the typed term when it is not. The types come from
 * the tenant; the statuses from the configured order statuscodes, each the
 * prefix of the text a status row carries.
 */
export function useOrderColumns(actions: OrderColumnActions) {
  const mainStore = useMainStore()
  const queryClient = useQueryClient()

  const statuscodes = computed<Statuscode[]>(() => mainStore.getStatuscodes ?? [])
  const orderTypes = computed<string[]>(() => mainStore.getOrderTypes ?? [])
  const includeReference = computed<boolean>(() => !!mainStore.getOrderListMustIncludeReference)
  const hasBranches = computed<boolean>(() => Boolean(mainStore.getMemberHasBranches))
  const isTemps = useTempsTenant()

  function companyFilter(): ColumnFilterSpec {
    if (hasBranches.value) {
      return {
        variant: 'select',
        label: $trans('Branch'),
        param: 'branch',
        loadOptions: (term) => queryClient
          .fetchQuery(companyBranchAutocompleteListOptions({query: {q: term}}))
          .then(ownerOptions),
        resolveLabels: (ids) => queryClient
          .fetchQuery(companyBranchAutocompleteListOptions({query: {id: ids.join(',')}}))
          .then(ownerOptions),
      }
    }
    return {
      variant: 'select',
      label: $trans('Customer'),
      param: 'customer_relation',
      loadOptions: (term) => queryClient
        .fetchQuery(customerCustomerAutocompleteListOptions({query: {q: term}}))
        .then(ownerOptions),
      resolveLabels: (ids) => queryClient
        .fetchQuery(customerCustomerAutocompleteListOptions({query: {id: ids.join(',')}}))
        .then(ownerOptions),
    }
  }

  const statusesQuery = useQuery(orderFilterGetStatusesRetrieveOptions())
  const statuses = computed<string[]>(() => statusesQuery.data.value ?? [])
  useQueryErrorToast(statusesQuery.error, $trans('Error loading statuses'))

  const columnHelper = createAppColumnHelper<OrderRow>()

  // A computed, so the status filter's options follow their read.
  return computed(() => columnHelper.columns([
    columnHelper.accessor('order_id', {
      header: $trans('order id'),
      meta: {filter: {variant: 'text', label: $trans('Order ID')}},
      cell: (info) => {
        const row = info.row.original
        const reference = includeReference.value && row.order_reference ? ` / ${row.order_reference}` : ''
        return orderLink(row, () => `#${row.order_id}${reference}`)
      },
    }),
    columnHelper.accessor('order_name', {
      header: $trans('company'),
      meta: {filter: companyFilter()},
    }),
    columnHelper.accessor('order_type', {
      header: $trans('type'),
      meta: {filter: {variant: 'select', label: $trans('Type'), options: options(orderTypes.value)}},
      cell: (info) => orderLink(info.row.original, () => h('strong', info.getValue() ?? '')),
    }),
    columnHelper.display({
      id: 'assignees',
      header: $trans('people'),
      cell: (info) => {
        if (isTemps.value) return tempsAssigneesCell(info.row.original)
        const names = assignedUsers(info.row.original)
        return names.length
          ? h('span', {title: `assignees: ${names.join(', ')}`}, [h('strong', names.join(', '))])
          : h('span', {title: $trans('Not assigned to anyone')}, '–')
      },
    }),
    columnHelper.accessor('last_status', {
      header: $trans('status'),
      enableSorting: false,
      meta: {filter: {variant: 'select', label: $trans('Status'), options: options(statuses.value)}},
      cell: (info) => h(OrderStatusCell, {
        order: info.row.original,
        statuscodes: statuscodes.value,
        onChanged: () => actions.reload(),
      }),
    }),
    columnHelper.accessor('start_date', {
      header: $trans('start date'),
      meta: {filter: {variant: 'date', label: $trans('Start date')}},
      cell: (info) => {
        const row = info.row.original
        const time = row.start_time ? ` ${row.start_time}` : ''
        return h('span', {title: `${row.start_date}${time}`}, [
          row.start_date,
          row.start_time ? h('b', {title: row.start_time}, [' ', h(IBiClock)]) : null,
        ])
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: (info) => {
        const row = info.row.original
        return h('div', {class: 'orders-table-actions'}, [
          actions.canAssign.value
            ? h(RowAction, {icon: 'assign',title: $trans('Assign'), method: () => actions.select(row)})
            : null,
          actions.canDelete.value
            ? h(RowAction, {icon: 'delete',title: $trans('Delete'), method: () => actions.confirmDelete(row.id)})
            : null,
        ])
      },
    }),
  ]))
}
