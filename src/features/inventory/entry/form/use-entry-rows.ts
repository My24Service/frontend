import { useSearch, useStagedRows } from '@/features/forms'
import {
  emptyEntry,
  entryErrors,
  entryForMaterial,
  parseEntryRows,
  type EntryValues,
} from './schemas'

/**
 * The create form's staged entries. Receiving a purchase order means booking
 * in what was ordered, so picking one stages an entry per ordered material;
 * the user then adjusts, adds, removes or re-locates them before one save
 * sends the whole set. Nothing is written from here: the save belongs to the
 * form, and a row the user removed is simply not in the body.
 *
 * The set and its row editor are the forms kit's `useStagedRows`; what is
 * left here is the entry's own: the order pick, the default location, the
 * row's rules and the bulk body. The rows ride one request, so the kit's
 * `replay` and `deletedIds` go unused.
 *
 * `stockLocations` is read at use, so the names it stamps on rows follow the
 * list as it loads.
 */
export function useEntryRows(stockLocations: () => readonly Api.StockLocation[]) {
  const queryClient = useQueryClient()
  const {create: toast} = useToast()

  const selectedOrder = ref<Api.PurchaseOrderList | null>(null)
  const materials = ref<Api.PurchaseOrderMaterial[]>([])
  const isLoading = ref(false)

  // The default location ----------------------------------------------------

  const defaultLocation = ref<number | null>(null)

  const locationName = (id: number | null) => stockLocations().find((location) => location.id === id)?.name ?? ''

  /** A row as it lands: on the default location, once one is chosen. */
  function located(entry: EntryValues): EntryValues {
    const id = defaultLocation.value
    return id === null ? entry : {...entry, stock_location: id, stock_location_name: locationName(id)}
  }

  // The set and the row being composed ---------------------------------------

  // `useStagedRows` replays rows that carry an `id`; entries ride the bulk
  // body instead and have none, so the slot satisfies the constraint
  // structurally without growing one.
  const staged = useStagedRows<EntryValues & {id?: number}>(
    () => located({...emptyEntry(), purchase_order: selectedOrder.value?.id ?? null}),
  )
  const {rows, rowEdit: draft, editingIndex, isEditing} = staged

  // The same set of rows the default reaches, the one being edited included:
  // the legacy editor was bound to its row, so it moved with the rest.
  watch(defaultLocation, (id) => {
    if (id === null) return
    for (const row of [...rows.value, draft.value]) {
      row.stock_location = id
      row.stock_location_name = locationName(id)
    }
  })

  /**
   * Errors stay quiet on a blank editor, and speak once a product was picked,
   * a row opened for editing, or a commit tried.
   */
  const touched = ref(false)
  const draftErrors = computed(() => entryErrors(draft.value))
  const isDraftValid = computed(() => Object.keys(draftErrors.value).length === 0)

  /** A product picked: the draft takes it and shows what was ordered. */
  function selectMaterial(option: Api.PurchaseOrderMaterial) {
    draft.value = {
      ...draft.value,
      purchase_order_material: option.id,
      material_name: option.material_view.name ?? '',
      unit: option.material_view.unit ?? '',
      ordered_amount: option.amount ?? null,
    }
    touched.value = true
  }

  /** The draft as the table shows it: the picked location named. */
  function nameLocation() {
    draft.value.stock_location_name = locationName(draft.value.stock_location)
  }

  function addRow() {
    if (!isDraftValid.value) return
    nameLocation()
    staged.add()
    touched.value = false
  }

  function editRow(index: number) {
    staged.edit(index)
    // A staged row is already valid; touched, so an edit into an invalid amount says why.
    touched.value = true
  }

  /** Write the edit back. False, with the draft's errors showing, when it is not a valid row. */
  function commitEdit(): boolean {
    if (!isEditing.value) return false
    touched.value = true
    if (!isDraftValid.value) return false
    nameLocation()
    staged.commitEdit()
    touched.value = false
    return true
  }

  function cancelEdit() {
    staged.cancelEdit()
    touched.value = false
  }

  /** A removed row is just gone: it was never saved, so there is nothing to delete. */
  function deleteRow(index: number) {
    if (editingIndex.value === index) touched.value = false
    staged.remove(index)
  }

  // The purchase order ------------------------------------------------------

  const orderSearch = useSearch(
    (q) => Api.InventoryPurchaseorder.list.options({query: {q}}),
    () => true,
    $trans('Error fetching purchase orders'),
    (data) => data.results ?? [],
  )

  /** Counts the picks, so an answer can tell whether its pick is still the latest. */
  let picks = 0

  /**
   * Pick an order: its materials become the product options, and one staged
   * entry each. The previous order's rows go at once, so a failed read leaves
   * nothing of them under the new order's header; an answer that arrives after
   * a later pick is dropped.
   */
  async function selectOrder(order: Api.PurchaseOrderList) {
    const pick = ++picks
    selectedOrder.value = order
    materials.value = []
    staged.seed([])
    touched.value = false

    isLoading.value = true
    try {
      // fetchQuery, not a query keyed on the pick: picking the same order again
      // must stage its rows again, which a cache hit on a watched query would not.
      const data = await queryClient.fetchQuery(Api.InventoryPurchaseorder.retrieve.options({path: {id: order.id}}))
      if (pick !== picks) return
      materials.value = [...data.materials]
      staged.seed(materials.value.map((material) => located(entryForMaterial(material, order.id))))
    } catch {
      if (pick === picks) errorToast(toast, $trans('Error fetching purchase order products'))
    } finally {
      if (pick === picks) isLoading.value = false
    }
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
    isDraftValid,
    showDraftErrors: computed(() => touched.value),
    editingIndex,
    isEditing,
    selectMaterial,
    addRow,
    editRow,
    commitEdit,
    cancelEdit,
    deleteRow,
    bulkBody,
  }
}

/** What the rows panel is handed: the whole staged set and its editor. */
export type EntryRows = ReturnType<typeof useEntryRows>
