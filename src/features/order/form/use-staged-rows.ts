/**
 * A set of child rows staged in a form and replayed on save: the order's
 * orderlines and infolines both work this way (and the maintenance
 * contract's equipment rows before them). Rows the record already had keep
 * their id and are PATCHed, new ones are POSTed, removed ones are DELETEd —
 * in that order, after the parent write.
 *
 * The composable owns the rows, the one being edited and the ids to delete;
 * the writes are the caller's, so it stays free of any op.
 */
export function useStagedRows<TRow extends {id?: number}>(empty: () => TRow) {
  const rows = ref([]) as Ref<TRow[]>
  const deletedIds = ref<number[]>([])
  const rowEdit = ref(empty()) as Ref<TRow>
  const editingIndex = ref<number | null>(null)
  const isEditing = computed(() => editingIndex.value !== null)

  /** Replace the staged set with the record's rows (a load or a discard). */
  function seed(loaded: TRow[]) {
    rows.value = loaded.map((row) => ({...row}))
    deletedIds.value = []
    cancelEdit()
  }

  function add() {
    rows.value.push({...rowEdit.value})
    rowEdit.value = empty()
  }

  function edit(index: number) {
    editingIndex.value = index
    rowEdit.value = {...rows.value[index]}
  }

  function commitEdit() {
    if (editingIndex.value === null) return
    rows.value.splice(editingIndex.value, 1, {...rowEdit.value})
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
