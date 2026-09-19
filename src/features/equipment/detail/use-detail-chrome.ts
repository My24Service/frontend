/**
 * The page chrome the four detail pages share: the orders-block search modal,
 * the refresh that re-reads both the orders and the record, and the back link.
 *
 * Every page names its search modal `searchModal`, so the ref is registered
 * here rather than in each page - it resolves against the caller's template,
 * because a composable runs in its caller's setup. Only the wiring differs
 * per page: the orders block's `setSearch`/`refresh` from `useDetailOrders`,
 * and a `refetch` for the record (a branch employee's page refetches whichever
 * of its two reads answered, so it passes a closure).
 */
export function useDetailChrome({orders, detail}: {
  orders: {
    /** The orders block's own search, which resets to page one. */
    setSearch: (value: string) => void
    /** Re-read the orders block. */
    refresh: () => unknown
  }
  detail: {
    /** Re-read the record the page shows. */
    refetch: () => unknown
  }
}) {
  const router = useRouter()

  const searchModal = useTemplateRef<{show: () => void, hide: () => void}>('searchModal')

  function handleSearchOk(value: string) {
    searchModal.value?.hide()
    orders.setSearch(value)
  }

  function showSearchModal() {
    searchModal.value?.show()
  }

  function refreshAll() {
    orders.refresh()
    detail.refetch()
  }

  function goBack() {
    router.go(-1)
  }

  return {handleSearchOk, showSearchModal, refreshAll, goBack}
}
