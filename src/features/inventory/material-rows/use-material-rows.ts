import * as v from 'valibot'

import { fieldErrors, useStagedRows, type FieldErrors, type FieldLabels, type FieldMessages } from '@/features/forms'

/**
 * A material row as the panel holds it: a product, an amount and a remark.
 *
 * `id` is what tells a stored row from a staged one, and the whole protocol of
 * the parent's `with-materials` save rests on it: a row carrying one updates
 * that stored row, a row without one is created, and a stored row the set no
 * longer names is deleted. So a row that has never been saved has none, never
 * a placeholder id.
 */
export interface MaterialRow {
  id?: number
  material: number
  /** The product's name, for the table and the read-only Name input. */
  name: string
  /** Bound to a text input, so text until the save turns it into a number. */
  amount: string
  remarks: string | null
}

/** The row editor's state: a row whose product is null until one is picked. */
export type MaterialDraft = Omit<MaterialRow, 'material'> & {material: number | null}

/** A stored row, of a purchase order or a reservation (a reservation's products, taken over). */
export type MaterialRowRecord = Api.PurchaseOrderMaterial | Api.SupplierReservationMaterial

/** What the product picker hands back when an option is selected. */
export interface MaterialOption {
  id: number
  name?: string | null
}

/** The product picker's read: the typed term, the options it found, and whether it is busy. */
export interface ProductSearch {
  term: Ref<string>
  options: ComputedRef<MaterialOption[]>
  loading: ComputedRef<boolean>
}

export function emptyMaterialRow(): MaterialDraft {
  return {material: null, name: '', amount: '0', remarks: ''}
}

/** A stored row, as the panel edits it: its id kept, so a save updates it. */
export function rowFromRecord(record: MaterialRowRecord): MaterialRow {
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
export function newRowFromRecord(record: MaterialRowRecord): MaterialRow {
  const {id: _reservationRowId, ...row} = rowFromRecord(record)
  return row
}

/**
 * The row component of a with-materials request body - the purchase order's
 * or the reservation's. Each carries its own parent key beside these four, and
 * the panel fills only these.
 */
type ReservationRow = (typeof Api.InventorySupplierReservationWithMaterials.create.body.entries.materials)['wrapped']['item']
type MaterialRowEntries = Pick<ReservationRow['entries'], 'id' | 'material' | 'amount' | 'remarks'>
export type MaterialRowSchema = v.ObjectSchema<MaterialRowEntries & v.ObjectEntries, undefined>

export type MaterialRowErrors = FieldErrors<'material' | 'amount' | 'remarks'>

const DRAFT_LABELS = {
  material: () => $trans('Product'),
  amount: () => $trans('Amount'),
  remarks: () => $trans('Remarks'),
} as const satisfies FieldLabels<keyof MaterialRowErrors>

// An empty amount and an amount of zero, a fraction or not a number all read as
// "enter an amount", as the legacy editor said it.
const DRAFT_MESSAGES = {
  amount: () => $trans('Please enter an amount'),
} as const satisfies FieldMessages<keyof MaterialRowErrors>

/** The row as the request reads it; the amount the input left blank is absent, not zero. */
function rowInput(row: MaterialDraft) {
  return {
    ...(row.id === undefined ? {} : {id: row.id}),
    material: row.material,
    amount: row.amount.trim() === '' ? undefined : Number(row.amount),
    remarks: row.remarks,
  }
}

/**
 * A draft the editor let through, as a staged row. `addRow` and `commitEdit`
 * commit only a valid draft, and a valid draft has its product; a throw here
 * is a bug in that check, not a row to leave out.
 */
function committed(draft: MaterialDraft): MaterialRow {
  if (draft.material === null) throw new Error('A material row needs a product before it is staged')
  return {...draft, material: draft.material}
}

/**
 * The staged material rows of a purchase order or a supplier reservation: the
 * set, the row being edited, and the `materials` list a save sends.
 *
 * `rowSchema` is the row component of the body the parent saves. The editor
 * checks the whole row against it, so nothing the save's parse would refuse -
 * a remark over its 255 characters - can be staged; the one rule it adds is
 * that an amount is at least one, where the request allows zero.
 *
 * No write is made from here. The parent form saves the set in the same body
 * as its own fields, in the one request the with-materials endpoints take, so
 * a failed save leaves no half-written rows behind.
 */
export function useMaterialRows<S extends MaterialRowSchema>(rowSchema: S) {
  // The set, the edit on a copy and the index bookkeeping are the forms kit's.
  // The rows ride the parent's body, so its `replay`/`deletedIds` go unused.
  const staged = useStagedRows(emptyMaterialRow, committed)
  const {rows, rowEdit: draft, editingIndex, isEditing} = staged

  const draftSchema = v.object({
    ...rowSchema.entries,
    amount: v.pipe(v.unwrap(rowSchema.entries.amount), v.minValue(1)),
  })

  const draftErrorsOf = (row: MaterialDraft): MaterialRowErrors =>
    fieldErrors(draftSchema, rowInput(row), DRAFT_MESSAGES, DRAFT_LABELS)

  /** Errors stay quiet on a blank editor; they speak once a product was picked or a commit tried. */
  const touched = ref(false)

  const isDraftValid = computed(() => Object.keys(draftErrorsOf(draft.value)).length === 0)
  const draftErrors = computed<MaterialRowErrors>(() => (touched.value ? draftErrorsOf(draft.value) : {}))

  function selectMaterial(option: MaterialOption) {
    draft.value.material = option.id
    draft.value.name = option.name ?? ''
    // A row being edited keeps its amount and remark when the product changes.
    if (editingIndex.value === null) {
      draft.value.amount = '0'
      draft.value.remarks = ''
    }
    touched.value = true
  }

  function addRow() {
    touched.value = true
    if (!isDraftValid.value) return
    staged.add()
    touched.value = false
  }

  function editRow(index: number) {
    staged.edit(index)
    // A stored row is already valid; touched, so an edit into an invalid amount says why.
    touched.value = true
  }

  /** Write the edit back. False, with the draft's errors showing, when it is not a valid row. */
  function commitEdit(): boolean {
    if (!isEditing.value) return false
    touched.value = true
    if (!isDraftValid.value) return false
    staged.commitEdit()
    touched.value = false
    return true
  }

  function cancelEdit() {
    staged.cancelEdit()
    touched.value = false
  }

  function deleteRow(index: number) {
    // Dropping the row is the whole delete: the save sends the set, and a
    // stored row the set leaves out is what the server removes.
    const deletingEdited = editingIndex.value === index
    staged.remove(index)
    if (deletingEdited) touched.value = false
  }

  /** Replace the whole set: a stored one loaded, a supplier changed, a reservation taken over. */
  function setRows(next: MaterialRow[]) {
    staged.seed(next)
    touched.value = false
  }

  /**
   * The set as the `materials` of a save, every row in it: a deleted one is
   * simply gone. Parsed against the request's row rather than the editor's
   * rules, so a stored row the request accepts (an amount of zero) still saves.
   */
  function materialsBody(): v.InferOutput<S>[] {
    return rows.value.map((row) => v.parse(rowSchema, rowInput(row)))
  }

  return {
    rows,
    setRows,
    materialsBody,
    selectMaterial,
    draft,
    draftErrors,
    isDraftValid,
    editingIndex,
    isEditing,
    addRow,
    editRow,
    commitEdit,
    cancelEdit,
    deleteRow,
  }
}

/** What a form hands its material rows panel: the whole staged set. */
export type MaterialRows = ReturnType<typeof useMaterialRows>
