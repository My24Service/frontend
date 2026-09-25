import { RouterLink } from 'vue-router'

import { createActionColumn, createAppColumnHelper, type ListRow } from '@/features/table'
import { useOwnerFilter } from '../use-owner-filter'

export type BuildingRow = ListRow<Api.PaginatedBuildingList>

export interface BuildingColumnOptions {
  /** Neither a branch employee nor a customer: those two roles see no owner column. */
  planning: boolean
  /** Open the kit's delete confirmation for a row. */
  onDelete: (id: number) => void
}

/**
 * The building list's columns — the location list's shape, one screen over.
 *
 * Both owner cells pass the row's own id where the legacy screen did, which is
 * not the related entity's id; preserved, see the README. The guard is not
 * optional: the generated `customer_branch_view` is nullable, and the legacy
 * template dereferenced it unguarded.
 */
export function useBuildingColumns(options: BuildingColumnOptions) {
  const ownerFilter = useOwnerFilter()
  const hasBranches = computed(() => Boolean(useMainStore().getMemberHasBranches))

  const helper = createAppColumnHelper<BuildingRow>()

  function ownerLabel(row: BuildingRow) {
    const owner = row.customer_branch_view
    if (!owner) return null
    return `${owner.name} - ${owner.city}`
  }

  return computed(() => helper.columns([
    ...(options.planning && !hasBranches.value ? [helper.display({
      id: 'customer',
      header: $trans('Customer'),
      meta: {filter: ownerFilter()},
      cell: ({row}) => {
        const label = ownerLabel(row.original)
        if (!label) return ''
        return h(RouterLink, {to: {name: 'customer-view', params: {pk: row.original.id}}}, () => label)
      },
    })] : []),
    ...(options.planning && hasBranches.value ? [helper.display({
      id: 'branch',
      header: $trans('Branch'),
      meta: {filter: ownerFilter()},
      cell: ({row}) => {
        const label = ownerLabel(row.original)
        if (!label) return ''
        return h(RouterLink, {to: {name: 'company-branch-view', params: {pk: row.original.id}}}, () => label)
      },
    })] : []),
    helper.accessor('name', {
      header: $trans('Name'),
      meta: {filter: {variant: 'text', label: $trans('Name')}},
      cell: ({row}) => h(RouterLink, {
        to: {name: 'equipment-building-view', params: {pk: row.original.id}},
      }, () => row.original.name),
    }),
    helper.accessor('created', {
      header: $trans('Created'),
      meta: {filter: {variant: 'date', label: $trans('Created')}},
    }),
    helper.accessor('modified', {
      header: $trans('Modified'),
      meta: {filter: {variant: 'date', label: $trans('Modified')}},
    }),
    createActionColumn(helper, {
      editRoute: 'equipment-building-edit',
      onDelete: options.onDelete,
    }),
  ]))
}
