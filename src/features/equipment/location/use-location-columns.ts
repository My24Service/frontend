import { RouterLink } from 'vue-router'
import type { PaginatedLocationList } from '@/api/types.gen'
import { createActionColumn, createAppColumnHelper, type ListRow } from '@/features/table'
import { useOwnerFilter } from '../use-owner-filter'

export type LocationRow = ListRow<PaginatedLocationList>

export interface LocationColumnOptions {
  /** The route name stem this mount answers to (`equipment-location`, `settings-location`, ...). */
  routePrefix: string
  /** Mounted by the settings layout, which adds the row actions. */
  fromSettings: boolean
  /** Neither a branch employee nor a customer: those two roles see no owner column. */
  planning: boolean
  /** Open the kit's delete confirmation for a row. */
  onDelete: (id: number) => void
}

/**
 * The location list's columns.
 *
 * `created` and `modified` filter as dates and sort: the endpoint declares both
 * in its ordering allow-list (`apps/equipment/views.py`) and reads them as
 * whole periods through the filterset's `__date` transform.
 *
 * The owner column is a display column — it shows the related name and filters
 * on the key — so it carries a filter but no sort: ordering by the id would
 * not order the labels the table shows, which is why the endpoint's allow-list
 * leaves `customer`/`branch` out.
 */
export function useLocationColumns(options: LocationColumnOptions) {
  const ownerFilter = useOwnerFilter()
  const hasBranches = computed(() => Boolean(useMainStore().getMemberHasBranches))

  const helper = createAppColumnHelper<LocationRow>()

  // "Name · City" as one dimmed suffix, the shape both owner cells share.
  function ownerLabel(row: LocationRow) {
    const owner = row.customer_branch_view
    if (!owner) return null
    return [owner.name, h('span', {class: 'dimmed'}, ` · ${owner.city}`)]
  }

  return computed(() => helper.columns([
    helper.accessor('name', {
      header: $trans('Name'),
      meta: {filter: {variant: 'text', label: $trans('Name')}},
      cell: ({row}) => h(RouterLink, {
        to: toRoute(`${options.routePrefix}-view` as RouteName, {pk: row.original.id}),
      }, () => row.original.name),
    }),
    ...(options.planning && !hasBranches.value ? [helper.display({
      id: 'customer',
      header: $trans('Customer'),
      meta: {filter: ownerFilter()},
      cell: ({row}) => ownerLabel(row.original) ?? '-',
    })] : []),
    ...(options.planning && hasBranches.value ? [helper.display({
      id: 'branch',
      header: $trans('Branch'),
      meta: {filter: ownerFilter()},
      cell: ({row}) => {
        const label = ownerLabel(row.original)
        if (!label) return '-'
        // The legacy cell passed the row's own id to a route that resolves a
        // branch. Preserved as-is: see the module README's preserved-defects list.
        return h(RouterLink, {to: toRoute('company-branch-view', {pk: row.original.id})}, () => label)
      },
    })] : []),
    helper.accessor('created', {
      header: $trans('Created'),
      meta: {filter: {variant: 'date', label: $trans('Created')}},
      cell: ({row}) => h('small', row.original.created),
    }),
    helper.accessor('modified', {
      header: $trans('Modified'),
      meta: {filter: {variant: 'date', label: $trans('Modified')}},
      cell: ({row}) => h('small', row.original.modified),
    }),
    ...(options.fromSettings ? [createActionColumn(helper, {
      editRoute: `${options.routePrefix}-edit` as RouteName,
      onDelete: options.onDelete,
    })] : []),
  ]))
}
