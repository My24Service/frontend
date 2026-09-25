import { RouterLink } from 'vue-router'

import RowAction from '@/components/RowAction.vue'
import { createAppColumnHelper, type ListRow } from '@/features/table'
import { useOwnerFilter } from '../use-owner-filter'

export type EquipmentRow = ListRow<Api.PaginatedEquipmentList>

export interface EquipmentColumnOptions {
  /** The route name stem this mount answers to (`equipment-equipment`, `settings-equipment`, ...). */
  routePrefix: string
  /** The equipment type the address asked for; the router's path carries it. */
  type: Api.EquipmentTypeEnum
  /** Mounted by the settings layout, which adds the icons column. */
  fromSettings: boolean
  /** Neither a branch employee nor a customer: those two roles see neither the owner nor the brand column. */
  planning: boolean
  /** Open the kit's delete confirmation for a row. */
  onDelete: (id: number) => void
  /** Open the add-state modal for a row. */
  onAddState: (id: number) => void
}

/**
 * The equipment list's columns.
 *
 * Filters follow the columns the endpoint declares
 * (`apps/equipment/filters.py`): `name` and `brand` as text, `num_orders` as a
 * number, and the owner as a pick from the branches or the customers. The
 * endpoint also filters `identifier`, `serialnumber`, `description` and
 * `location`, but no column here renders them, so the screen declares no
 * filter for any of them — a control that narrows on something the user cannot
 * see is worse than no control. `latest_state` is the row's latest child
 * record, not a column, so there is nothing to filter on.
 *
 * `name`, `brand` and `num_orders` are each in the endpoint's ordering
 * allow-list, so they sort on the wire. `customer` and `branch` are not, so
 * those headers stay unsortable rather than sending an `ordering` term the
 * contract does not admit - the legacy screen sorted on them through the
 * older `sort_field` contract, which took any column name.
 */
export function useEquipmentColumns(options: EquipmentColumnOptions) {
  const ownerFilter = useOwnerFilter()
  const hasBranches = computed(() => Boolean(useMainStore().getMemberHasBranches))

  const helper = createAppColumnHelper<EquipmentRow>()

  // The owner column is the only difference between the customer and branch
  // variants. It is also the one cell that links on a foreign key - the row's
  // `customer`/`branch` - rather than on the row's own id.
  function ownerColumn(key: 'customer' | 'branch', routeName: RouteName) {
    return helper.display({
      id: key,
      header: key === 'customer' ? $trans('Customer') : $trans('Branch'),
      meta: {filter: ownerFilter()},
      cell: ({row}) => {
        const owner = row.original.customer_branch_view
        if (!owner) return ''
        const label = `${owner.name} - ${owner.city}`
        // The FK is nullable in the generated type, and a <router-link> with a
        // null param cannot resolve at all - it throws while the row renders.
        // The legacy screen linked unconditionally and would have thrown here;
        // the label is what the user needs, so it stays as plain text.
        const ownerId = row.original[key]
        if (ownerId == null) return label
        return h(RouterLink, {to: toRoute(routeName, {pk: ownerId})}, () => label)
      },
    })
  }

  return computed(() => helper.columns([
    helper.accessor('name', {
      header: $trans('Equipment'),
      meta: {filter: {variant: 'text', label: $trans('Equipment')}},
      cell: ({row}) => h(RouterLink, {
        to: hasBranches.value
          ? toRoute(`${options.routePrefix}-view-${options.type}` as RouteName, {pk: row.original.id})
          : toRoute(`${options.routePrefix}-view` as RouteName, {pk: row.original.id}),
      }, () => row.original.name),
    }),
    ...(options.planning && hasBranches.value ? [ownerColumn('branch', 'company-branch-view')] : []),
    ...(options.planning && !hasBranches.value ? [ownerColumn('customer', 'customer-view')] : []),
    ...(options.planning ? [helper.accessor('brand', {
      header: $trans('Brand'),
      meta: {filter: {variant: 'text', label: $trans('Brand')}},
    })] : []),
    helper.accessor('location_name', {header: $trans('Location')}),
    // State is the row's latest child record, not a column: nothing to sort or
    // filter on.
    helper.display({
      id: 'latest_state',
      header: $trans('State'),
      cell: ({row}) => {
        const latest = row.original.latest_state
        if (!latest) return ''
        return `${latest.state} (${$trans('replace in ')} ${latest.replace_months} ${$trans('months')})`
      },
    }),
    helper.accessor('num_orders', {
      header: $trans('Orders'),
      meta: {filter: {variant: 'number', label: $trans('Orders')}},
    }),
    ...(options.fromSettings ? [helper.display({
      id: 'icons',
      header: '',
      cell: ({row}) => h('div', {class: 'h2 float-right icons'}, [
        h(RowAction, {icon: 'plus',
          title: $trans('Add state'),
          method: () => options.onAddState(row.original.id),
        }),
        h(RowAction, {icon: 'edit',
          router_name: (hasBranches.value
            ? `${options.routePrefix}-edit-${options.type}`
            : `${options.routePrefix}-edit`) as RouteName,
          router_params: {pk: row.original.id},
          title: $trans('Edit'),
        }),
        h(RowAction, {icon: 'delete',
          title: $trans('Delete'),
          method: () => options.onDelete(row.original.id),
        }),
      ]),
    })] : []),
  ]))
}
