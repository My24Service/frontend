import { useQueryErrorToast, useSearch } from '@/features/forms'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'
import {
  emptyEntry,
  entryErrors,
  entryForMaterial,
  parseEntryRows,
  type EntryValues,
} from './schemas'

/** Every stock location: the two location selects offer the whole collection. */
export function useStockLocations() {
  const query = useQuery(() => Api.InventoryStockLocation.list.options({
    query: {page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE},
  }))
  useQueryErrorToast(query.error, $trans('Error fetching stock locations'))

  return {
    stockLocations: computed(() => query.data.value?.results ?? []),
    isLoading: computed(() => query.isLoading.value),
  }
}

/**
 * The create form's staged entries. Receiving a purchase order means booking
 * in what was ordered, so picking one stages an entry per ordered material;
 * the user then adjusts, adds, removes or re-locates them before one save
 * sends the whole set. Nothing is written from here: the save belongs to the
 * form, and a row the user removed is simply not in the body.
 *
 * `stockLocations` is read at use, so the names it stamps on rows follow the
 * list as it loads.
 */
export function useEntryRows(stockLocations: () => readonly Api.StockLocation[]) {
  const queryClient = useQueryClient()
  const {create: toast} = useToast()

  // The purchase order ------------------------------------------------------

  const orderSearch = useSearch(
    (q) => Api.InventoryPurchaseorder.list.options({query: {q}}),
    () => true,
    $trans('Error fetching purchase orders'),
    (data) => data.results ?? [],
  )

  const selectedOrder = ref<Api.PurchaseOrderList | null>(null)
  const materials = ref<Api.PurchaseOrderMaterial[]>([])
  const rows = ref<EntryValues[]>([])
  const isLoading = ref(false)

  /** Pick an order: its materials become the product options, and one staged entry each. */
  async function selectOrder(order: Api.PurchaseOrderList) {
    selectedOrder.value = order
    cancelEdit()

    isLoading.value = true
    try {
      // fetchQuery, not a query keyed on the pick: picking the same order again
      // must stage its rows again, which a cache hit on a watched query would not.
      const data = await queryClient.fetchQuery(Api.InventoryPurchaseorder.retrieve.options({path: {id: order.id}}))
      materials.value = [...data.materials]
      rows.value = materials.value.map((material) => entryForMaterial(material, order.id))
    } catch {
      errorToast(toast, $trans('Error fetching purchase order products'))
    } finally {
      isLoading.value = false
    }
  }

  // The default location ----------------------------------------------------

  const defaultLocation = ref<number | null>(null)

  const locationName = (id: number | null) => stockLocations().find((location) => location.id === id)?.name ?? ''

  watch(defaultLocation, (id) => {
    if (id === null) return
    for (const row of rows.value) {
      row.stock_location = id
      row.stock_location_name = locationName(id)
    }
  })

  // The row being composed --------------------------------------------------

  const draft = ref<EntryValues>(emptyEntry())
  const editingIndex = ref<number | null>(null)
  const draftErrors = computed(() => entryErrors(draft.value))
  const canCommit = computed(() => Object.keys(draftErrors.value).length === 0)

  function resetDraft() {
    draft.value = {...emptyEntry(), purchase_order: selectedOrder.value?.id ?? null}
  }

  /** A product picked: the draft takes it and shows what was ordered. */
  function selectMaterial(option: Api.PurchaseOrderMaterial) {
    Object.assign(draft.value, {
      purchase_order_material: option.id,
      material_name: option.material_view.name ?? '',
      unit: option.material_view.unit ?? '',
      ordered_amount: option.amount ?? null,
    })
  }

  const committed = (): EntryValues => ({...draft.value, stock_location_name: locationName(draft.value.stock_location)})

  function addRow() {
    if (!canCommit.value) return
    rows.value.push(committed())
    resetDraft()
  }

  function editRow(index: number) {
    editingIndex.value = index
    draft.value = {...rows.value[index]}
  }

  function saveEdit() {
    if (editingIndex.value === null || !canCommit.value) return
    rows.value.splice(editingIndex.value, 1, committed())
    cancelEdit()
  }

  function cancelEdit() {
    editingIndex.value = null
    resetDraft()
  }

  /** A removed row is just gone: it was never saved, so there is nothing to delete. */
  function deleteRow(index: number) {
    rows.value.splice(index, 1)
    if (editingIndex.value === index) cancelEdit()
    else if (editingIndex.value !== null && editingIndex.value > index) editingIndex.value -= 1
  }

  /** The bulk body: every staged row, the amount as a Number and the date as `YYYY-MM-DD`. */
  const bulkBody = () => parseEntryRows(rows.value)

  return {
    orderSearch,
    selectedOrder,
    selectOrder,
    materials,
    rows,
    isLoading,
    defaultLocation,
    draft,
    draftErrors,
    canCommit,
    editingIndex,
    selectMaterial,
    addRow,
    editRow,
    saveEdit,
    cancelEdit,
    deleteRow,
    bulkBody,
  }
}

/** What the rows panel is handed: the whole staged set and its editor. */
export type EntryRows = ReturnType<typeof useEntryRows>
