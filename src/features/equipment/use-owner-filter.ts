

import type { ColumnFilterSpec, FilterOption } from '@/features/table'

/** An autocomplete row as a filter choice: its id on the wire, its name on the chip. */
function ownerOptions(rows: Api.AddressAutocompleteRow[]): FilterOption[] {
  return rows.map((row) => ({value: String(row.id), label: row.name ?? row.value}))
}

/**
 * The owner filter the three equipment lists share.
 *
 * The owner column shows the owner's name and filters on its id: a pick from
 * the branches on a tenant that has them, else from the customers — the same
 * shape and the same autocomplete reads as the order list's company filter
 * (`order/order/use-order-columns.ts`), against the `branch`/`customer`
 * parameters `apps/equipment/filters.py` declares as any-of id lists.
 *
 * The picks ride the wire comma-joined and the chip names a restored id
 * through `resolveLabels`, so a shared address shows names, not numbers.
 */
export function useOwnerFilter() {
  const queryClient = useQueryClient()
  const hasBranches = computed(() => Boolean(useMainStore().getMemberHasBranches))

  function loadOptions(term: string): Promise<FilterOption[]> {
    if (hasBranches.value) {
      return queryClient
        .fetchQuery(Api.CompanyBranchAutocomplete.list.options({query: {q: term}}))
        .then(ownerOptions)
    }
    return queryClient
      .fetchQuery(Api.CustomerCustomerAutocomplete.list.options({query: {q: term}}))
      .then(ownerOptions)
  }

  function resolveLabels(ids: string[]): Promise<FilterOption[]> {
    if (hasBranches.value) {
      return queryClient
        .fetchQuery(Api.CompanyBranchAutocomplete.list.options({query: {id: ids.join(',')}}))
        .then(ownerOptions)
    }
    return queryClient
      .fetchQuery(Api.CustomerCustomerAutocomplete.list.options({query: {id: ids.join(',')}}))
      .then(ownerOptions)
  }

  /** Read per column build, not once: the label follows the tenant's branch setting. */
  return function ownerFilter(): ColumnFilterSpec {
    return hasBranches.value
      ? {variant: 'select', label: $trans('Branch'), param: 'branch', loadOptions, resolveLabels}
      : {variant: 'select', label: $trans('Customer'), param: 'customer', loadOptions, resolveLabels}
  }
}
