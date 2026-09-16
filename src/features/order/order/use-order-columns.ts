import { computed, h, type Ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'

import { orderFilterGetStatusesRetrieveOptions } from '@/api/@tanstack/vue-query.gen'
import type { PaginatedOrderList, Statuscode } from '@/api/types.gen'
import IconLinkAssign from '@/components/IconLinkAssign.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import IBiClock from '~icons/bi/clock'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { createAppColumnHelper, type ListRow } from '@/features/table'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import { tempsAssigneesCell } from '../temps/assignees-cell'
import { useTempsTenant } from '../temps/use-temps-tenant'
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

function selectOptions(values: string[]) {
  return values.map((value) => ({value, label: value}))
}

/**
 * The order list's columns. The filters over the type and the status are
 * selects: the types come from the tenant, the statuses from a read of
 * every distinct status on record — the free text a status row carries,
 * not the tenant's configured codes (a code is only the prefix of a
 * status, and the codes are what the status cell offers to *set*).
 */
export function useOrderColumns(actions: OrderColumnActions) {
  const mainStore = useMainStore()

  const statuscodes = computed<Statuscode[]>(() => mainStore.getStatuscodes ?? [])
  const orderTypes = computed<string[]>(() => mainStore.getOrderTypes ?? [])
  const includeReference = computed<boolean>(() => !!mainStore.getOrderListMustIncludeReference)
  const isTemps = useTempsTenant()

  const statusesQuery = useQuery(orderFilterGetStatusesRetrieveOptions())
  const statuses = computed<string[]>(() => statusesQuery.data.value ?? [])
  useQueryErrorToast(statusesQuery.error, $trans('Error loading statuses'))

  const columnHelper = createAppColumnHelper<OrderRow>()

  // A computed, so the status filter's options follow their read.
  return computed(() => columnHelper.columns([
    columnHelper.accessor('order_id', {
      header: $trans('order id'),
      enableColumnFilter: true,
      meta: {filterVariant: 'text'},
      cell: (info) => {
        const row = info.row.original
        const reference = includeReference.value && row.order_reference ? ` / ${row.order_reference}` : ''
        return orderLink(row, () => `#${row.order_id}${reference}`)
      },
    }),
    columnHelper.accessor('order_name', {
      header: $trans('company'),
      enableColumnFilter: true,
      meta: {filterVariant: 'text'},
    }),
    columnHelper.accessor('order_type', {
      header: $trans('type'),
      enableColumnFilter: true,
      meta: {filterVariant: 'select', selectOptions: selectOptions(orderTypes.value)},
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
      enableColumnFilter: true,
      enableSorting: false,
      meta: {filterVariant: 'select', selectOptions: selectOptions(statuses.value)},
      cell: (info) => h(OrderStatusCell, {
        order: info.row.original,
        statuscodes: statuscodes.value,
        onChanged: () => actions.reload(),
      }),
    }),
    columnHelper.accessor('start_date', {
      header: $trans('start date'),
      enableColumnFilter: true,
      meta: {filterVariant: 'text', filterPlaceholder: '2026-03 or 2026-03-01...2026-03-31'},
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
            ? h(IconLinkAssign, {title: $trans('Assign'), method: () => actions.select(row)})
            : null,
          actions.canDelete.value
            ? h(IconLinkDelete, {title: $trans('Delete'), method: () => actions.confirmDelete(row.id)})
            : null,
        ])
      },
    }),
  ]))
}
