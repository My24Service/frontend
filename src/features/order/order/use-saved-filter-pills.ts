import type { ColumnFiltersState } from '@tanstack/vue-table'

import { orderFilterSimpleListListOptions } from '@/api/@tanstack/vue-query.gen'

const USER_FILTER = 'user_filter'

/**
 * The saved filters (`/order/filter/`) are the legacy way of narrowing the
 * order list, kept as pills. Picking one sets a `user_filter` column filter
 * on the kit — a filter without a column, which the kit still commits,
 * mirrors into the address and hands to `listOptions` — and the screen
 * forwards it on the wire. The screens that edit them are not this Slice's.
 */
export function useSavedFilterPills(columnFilters: Ref<ColumnFiltersState>) {
  const query = useQuery(orderFilterSimpleListListOptions())
  const filters = computed(() => query.data.value ?? [])

  const active = computed(() => {
    const filter = columnFilters.value.find((entry) => entry.id === USER_FILTER)
    const value = Number(filter?.value)
    return Number.isInteger(value) && value > 0 ? value : null
  })

  function toggle(id: number) {
    const next = active.value === id ? null : id
    columnFilters.value = [
      ...columnFilters.value.filter((entry) => entry.id !== USER_FILTER),
      ...(next ? [{id: USER_FILTER, value: String(next)}] : []),
    ]
  }

  return {filters, active, toggle}
}
