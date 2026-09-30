import * as v from 'valibot'

import { fieldErrors, useSearch, type FieldErrors, type FieldMessages } from '@/features/forms'

/**
 * A material row as the panel holds it: a product, an amount and a remark.
 *
 * `id` is what tells a stored row from a staged one, and the whole protocol of
 * the parent's `with-materials` save rests on it: a row carrying one updates
 * that stored row, a row without one is created, and a stored row the set no
 * longer names is deleted. So a row that has never been saved holds `null`,
 * never a placeholder id.
 */
export interface MaterialRowState {
  id: number | null
  /** The product picked; null until one is. */
  material: number | null
  /** The product's name, for the table and the read-only Name input. */
  name: string
  /** Bound to a text input, so text until the save turns it into a number. */
  amount: string
  remarks: string | null
}

/** What a stored row (or a reservation's) tells the panel: the product, how many, and why. */
export interface MaterialRowRecord {
  id: number
  material: number
  amount?: number
  remarks?: string | null
  material_view: {name?: string | null}
}

/** One `materials` row of a with-materials request body. */
export interface MaterialRowBody {
  id?: number
  material: number
  amount: number
  remarks: string | null
}

/** What the product picker hands back when an option is selected. */
export interface MaterialOption {
  id: number
  name?: string | null
}

export function emptyMaterialRow(): MaterialRowState {
  return {id: null, material: null, name: '', amount: '0', remarks: ''}
}

/** A stored row, as the panel edits it: its id kept, so a save updates it. */
export function rowFromRecord(record: MaterialRowRecord): MaterialRowState {
  return {
    id: record.id,
    material: record.material,
    name: record.material_view.name ?? '',
    amount: String(record.amount ?? 0),
    remarks: record.remarks ?? null,
  }
}

/**
 * A row taken over from another record - a reservation's products, on the
 * purchase order made from it. The product, amount and remark come along; the
 * id does not. It belongs to the reservation's row, and sent in the order's
 * replace-set it would name a stored order row that is not the reservation's
 * to address.
 */
export function newRowFromRecord(record: MaterialRowRecord): MaterialRowState {
  return {...rowFromRecord(record), id: null}
}

// The row's rules are the request's own: a product, and a whole number of it.
// Both parents' row components declare them alike, so one is read here; each
// form parses its whole body against its own schema on save. The one thing the
// request allows and the panel does not is an amount of zero.
const rowSchema = v.unwrap(Api.InventorySupplierReservationWithMaterials.create.body.entries.materials).item

const draftSchema = v.object({
  material: rowSchema.entries.material,
  amount: v.pipe(v.unwrap(rowSchema.entries.amount), v.minValue(1)),
})

const DRAFT_MESSAGES = {
  material: () => $trans('Please select a product'),
  amount: () => $trans('Please enter an amount'),
} as const satisfies FieldMessages<'material' | 'amount'>

export type MaterialRowErrors = FieldErrors<'material' | 'amount'>

function draftErrorsOf(row: MaterialRowState): MaterialRowErrors {
  return fieldErrors(
    draftSchema,
    {
      material: row.material,
      amount: row.amount.trim() === '' ? undefined : Number(row.amount),
    },
    DRAFT_MESSAGES,
  )
}

/** The product picker's read: the typed term, the options it found, and whether it is busy. */
export interface ProductSearch {
  term: Ref<string>
  options: ComputedRef<MaterialOption[]>
  loading: ComputedRef<boolean>
}

/**
 * The purchase order's product search: the supplier's materials through the
 * autocomplete, which answers the current year's price rows (or the latest
 * year's), as the legacy order form searched.
 */
export function useAutocompleteProductSearch(supplierId: () => number | null): ProductSearch {
  return useSearch(
    (q) => Api.InventoryMaterialAutocomplete.list.options({
      query: {q, supplier: supplierId() ?? undefined},
    }),
    () => supplierId() !== null,
    $trans('Error fetching products'),
    (found): MaterialOption[] => found,
  )
}

/**
 * The reservation's product search: the supplier's catalogue itself, as the
 * legacy reservation form searched it. Not the autocomplete, which answers
 * only materials with a price row for this year, and so would hide part of the
 * catalogue from a reservation.
 */
export function useCatalogueProductSearch(supplierId: () => number | null): ProductSearch {
  return useSearch(
    (q) => Api.InventoryMaterial.list.options({
      query: {q, supplier_relation: supplierId() ?? undefined, page: 1},
    }),
    () => supplierId() !== null,
    $trans('Error fetching products'),
    (data): MaterialOption[] => data.results ?? [],
  )
}

interface MaterialRowsOptions {
  /** The picker's search: the form decides which catalogue its products come from. */
  products: ProductSearch
}

/**
 * The staged material rows of a purchase order or a supplier reservation: the
 * set, the row being edited, the picker that fills it, and the `materials`
 * list a save sends.
 *
 * No write is made from here. The parent form saves the set in the same body
 * as its own fields, in the one request the with-materials endpoints take, so
 * a failed save leaves no half-written rows behind.
 */
export function useMaterialRows(options: MaterialRowsOptions) {
  const rows = ref<MaterialRowState[]>([])

  // The picker ---------------------------------------------------------------

  const {term: searchTerm, options: productOptions, loading: searching} = options.products

  // The row being edited -----------------------------------------------------

  const draft = ref<MaterialRowState>(emptyMaterialRow())
  const editingIndex = ref<number | null>(null)
  /** Errors stay quiet on a blank editor; they speak once a product was picked or a commit tried. */
  const touched = ref(false)

  const isDraftValid = computed(() => Object.keys(draftErrorsOf(draft.value)).length === 0)
  const draftErrors = computed<MaterialRowErrors>(() => (touched.value ? draftErrorsOf(draft.value) : {}))

  const amountInput = ref<{focus: () => void} | null>(null)

  function resetDraft() {
    draft.value = emptyMaterialRow()
    editingIndex.value = null
    touched.value = false
  }

  function selectMaterial(option: MaterialOption) {
    draft.value.material = option.id
    draft.value.name = option.name ?? ''
    // A row being edited keeps its amount and remark when the product changes.
    if (editingIndex.value === null) {
      draft.value.amount = '0'
      draft.value.remarks = ''
    }
    touched.value = true
    void nextTick(() => amountInput.value?.focus())
  }

  function addRow() {
    touched.value = true
    if (!isDraftValid.value) return
    rows.value.push({...draft.value})
    resetDraft()
  }

  function editRow(index: number) {
    // The editor works on a copy: Cancel then has nothing to undo.
    draft.value = {...rows.value[index]}
    editingIndex.value = index
    // A stored row is already valid; touched, so an edit into an invalid amount says why.
    touched.value = true
  }

  function commitEdit() {
    touched.value = true
    if (editingIndex.value === null || !isDraftValid.value) return
    rows.value.splice(editingIndex.value, 1, {...draft.value})
    resetDraft()
  }

  function cancelEdit() {
    resetDraft()
  }

  function deleteRow(index: number) {
    // Dropping the row is the whole delete: the save sends the set, and a
    // stored row the set leaves out is what the server removes.
    rows.value.splice(index, 1)
    if (editingIndex.value === null) return
    if (editingIndex.value === index) resetDraft()
    else if (editingIndex.value > index) editingIndex.value -= 1
  }

  // The set ------------------------------------------------------------------

  /** Replace the whole set: a stored one loaded, a supplier changed, a reservation taken over. */
  function setRows(next: MaterialRowState[]) {
    rows.value = next
    resetDraft()
  }

  /** The set as the `materials` of a save, every row in it: a deleted one is simply gone. */
  function materialsBody(): MaterialRowBody[] {
    return rows.value.flatMap((row) => (row.material === null ? [] : [{
      ...(row.id === null ? {} : {id: row.id}),
      material: row.material,
      amount: Number(row.amount),
      remarks: row.remarks,
    }]))
  }

  return {
    rows,
    setRows,
    materialsBody,
    searchTerm,
    productOptions,
    searching,
    selectMaterial,
    draft,
    draftErrors,
    isDraftValid,
    editingIndex,
    addRow,
    editRow,
    commitEdit,
    cancelEdit,
    deleteRow,
    amountInput,
  }
}

/** What a form hands its material rows panel: the whole staged set. */
export type MaterialRows = ReturnType<typeof useMaterialRows>
