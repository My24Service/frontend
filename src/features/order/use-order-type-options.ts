/**
 * The order-type select options both order forms draw: the blank "Select
 * order type" row plus the tenant's own types. One copy — the two forms
 * and the stats range each wrote this out with a different first row, and
 * only the forms' pair is actually the same.
 */
export function useOrderTypeOptions() {
  const mainStore = useMainStore()
  return computed(() => [
    {value: '', text: $trans('Select order type')},
    ...((mainStore.getOrderTypes ?? []).map((type) => ({value: type, text: type}))),
  ])
}
