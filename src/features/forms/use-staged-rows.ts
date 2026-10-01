/** The staged set a form edits: the rows, the draft being composed or edited, and what was removed. */
export interface StagedRows<TRow extends {id?: number}, TDraft = TRow> {
  rows: Ref<TRow[]>
  deletedIds: Ref<number[]>
  rowEdit: Ref<TDraft>
  editingIndex: Ref<number | null>
  isEditing: ComputedRef<boolean>
  // Function-typed properties rather than methods: they are closures with no
  // `this`, and callers destructure them.
  /** Replace the staged set with the record's rows (a load or a discard). */
  seed: (loaded: TRow[]) => void
  add: () => void
  edit: (index: number) => void
  commitEdit: () => void
  cancelEdit: () => void
  remove: (index: number) => void
  replay: (
    parentId: number,
    writes: {
      create: (row: TRow, parentId: number) => Promise<{id?: number} | void>
      update: (id: number, row: TRow, parentId: number) => Promise<unknown>
      destroy: (id: number) => Promise<unknown>
    },
  ) => Promise<void>
}

/**
 * A set of child rows staged in a form: the rows, the one being edited (on a
 * copy, so Cancel discards it) and the ids of stored rows removed.
 *
 * Two ways to save them. Rows that are their own resource are replayed after
 * the parent write (the order's orderlines, infolines and documents): rows the
 * record already had keep their id and are PATCHed, new ones are POSTed,
 * removed ones are DELETEd, in that order. Rows that ride the parent's body
 * (a trip's orders, a purchase order's products) are simply read off `rows`,
 * and `replay`/`deletedIds` go unused.
 *
 * The composable owns the state; the writes are the caller's, so it stays free
 * of any op.
 *
 * The editor may hold less than a row: a product not picked yet is `null` in
 * the draft and never in a staged row. Such a caller passes `commit`, which
 * turns a draft it has checked into a row, and `rows` is typed as what it
 * holds. Without one, the draft is a row and is committed as a copy.
 */
export function useStagedRows<TRow extends {id?: number}>(empty: () => TRow): StagedRows<TRow, TRow>
export function useStagedRows<TDraft, TRow extends TDraft & {id?: number}>(
  empty: () => TDraft,
  commit: (draft: TDraft) => TRow,
): StagedRows<TRow, TDraft>
export function useStagedRows<TDraft, TRow extends TDraft & {id?: number}>(
  empty: () => TDraft,
  // Omitted only through the first overload, where the draft is the row.
  commit: (draft: TDraft) => TRow = (draft) => ({...draft}) as unknown as TRow,
): StagedRows<TRow, TDraft> {
  const rows = ref([]) as Ref<TRow[]>
  const deletedIds = ref<number[]>([])
  const rowEdit = ref(empty()) as Ref<TDraft>
  const editingIndex = ref<number | null>(null)
  const isEditing = computed(() => editingIndex.value !== null)

  /** Replace the staged set with the record's rows (a load or a discard). */
  function seed(loaded: TRow[]) {
    rows.value = loaded.map((row) => ({...row}))
    deletedIds.value = []
    cancelEdit()
  }

  function add() {
    rows.value.push(commit(rowEdit.value))
    rowEdit.value = empty()
  }

  function edit(index: number) {
    editingIndex.value = index
    rowEdit.value = {...rows.value[index]}
  }

  function commitEdit() {
    if (editingIndex.value === null) return
    rows.value.splice(editingIndex.value, 1, commit(rowEdit.value))
    cancelEdit()
  }

  function cancelEdit() {
    editingIndex.value = null
    rowEdit.value = empty()
  }

  function remove(index: number) {
    const row = rows.value[index]
    if (row.id) deletedIds.value.push(row.id)
    rows.value.splice(index, 1)
    if (editingIndex.value === null) return
    if (editingIndex.value === index) cancelEdit()
    else if (editingIndex.value > index) editingIndex.value -= 1
  }

  /**
   * Write the staged set against `parentId`: existing rows updated, new
   * rows created, removed rows deleted. Each write is the caller's.
   *
   * A created row keeps the id the create returned, so a replay that runs
   * again — the parent write succeeded but a later panel failed, and the user
   * retries — updates that row rather than creating a second one.
   */
  async function replay(
    parentId: number,
    writes: {
      create: (row: TRow, parentId: number) => Promise<{id?: number} | void>
      update: (id: number, row: TRow, parentId: number) => Promise<unknown>
      destroy: (id: number) => Promise<unknown>
    },
  ) {
    for (const row of rows.value) {
      if (row.id) {
        await writes.update(row.id, row, parentId)
      } else {
        const created = await writes.create(row, parentId)
        if (created?.id != null) row.id = created.id
      }
    }
    for (const id of deletedIds.value) await writes.destroy(id)
    deletedIds.value = []
  }

  return {rows, deletedIds, rowEdit, editingIndex, isEditing, seed, add, edit, commitEdit, cancelEdit, remove, replay}
}
