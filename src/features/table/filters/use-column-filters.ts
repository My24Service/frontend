import type { ColumnFiltersState, RowData, VueTable } from '@tanstack/vue-table'
import type { ComputedRef, Ref } from 'vue'
import type { AppFeatures, FilterOption } from '../table'
import { filterableColumns, type FilterableColumn } from './column-filter'
import { splitArrayItems } from './filter-grammar'

/** One filter in force, or the one being edited, as a chip renders it. */
export interface FilterChip extends FilterableColumn {
  value: string
}

/**
 * The column filters of one table, as state.
 *
 * The state is the table's own (`columnFilters`: the engine commits it and
 * mirrors it into the address bar); this only reads and sets the entry each
 * column filters under — its id, or the `param` a select names when the
 * column shows a name but filters on a key.
 *
 * It is ONE state per table, not one per caller: the menu lives in the page
 * header and the chips in the subnav, so two components read and write the
 * same filters. The menu's "the column just added" is what opens that
 * column's editor in the chips, and it can only work if both share this.
 * Hence the cache: `useColumnFilters(table)` hands every caller of the same
 * table instance the same refs.
 *
 * A chip lives while its column has a value, plus one exception: the chip
 * being edited stays put even when its editor empties the value, and the
 * one just added stays until its editor closes, so neither vanishes
 * under the cursor.
 */
export interface ColumnFilters {
  /** The columns the menu can offer, in table order. */
  columns: ComputedRef<FilterableColumn[]>
  /** Chips in the order the filters were applied, the held one last if it has no value yet. */
  chips: ComputedRef<FilterChip[]>
  /** The chips that carry a value — what "Clear all" and the pinned chip count mean. */
  active: ComputedRef<FilterChip[]>
  /** The columns the menu still offers: those without a chip. */
  available: ComputedRef<FilterableColumn[]>
  /** Select labels learned since the specs were built, by value. */
  labels: Map<string, string>
  /** The chip whose editor is open: it stays on screen even once its value is empty. */
  held: Ref<string | null>
  /** The column the menu just added: its chip opens its editor on arrival. */
  added: Ref<string | null>
  /** A chip's editor opened: that chip is now the held one. */
  hold: (id: string) => void
  /** The menu picked this column: its chip appears with the editor open. */
  add: (id: string) => void
  set: (column: FilterableColumn, value: string) => void
  remove: (column: FilterableColumn) => void
  release: (id: string) => void
  clearAll: () => void
  /** A select editor listed these options: their labels are worth remembering. */
  remember: (options: FilterOption[]) => void
}

const byTable = new WeakMap<object, ColumnFilters>()

export function useColumnFilters<TData extends RowData>(table: VueTable<AppFeatures, TData>): ColumnFilters {
  const cached = byTable.get(table)
  if (cached) return cached

  const columns = computed(() => filterableColumns(table))

  /** The chip whose editor is open, or was just added: kept on screen regardless of its value. */
  const held = ref<string | null>(null)
  /** The column the menu just added: its chip opens on arrival. */
  const added = ref<string | null>(null)

  // The engine's state getter reads its own ref, so this is reactive.
  const filters = computed<ColumnFiltersState>(() => table.options.state?.columnFilters ?? [])

  const chips = computed<FilterChip[]>(() => {
    const result: FilterChip[] = []
    for (const filter of filters.value) {
      const column = columns.value.find((candidate) => candidate.param === filter.id)
      if (column && typeof filter.value === 'string' && filter.value !== '') result.push({...column, value: filter.value})
    }
    const heldId = held.value
    const heldColumn = columns.value.find((column) => column.id === heldId)
    if (heldColumn && !result.some((chip) => chip.id === heldId)) {
      result.push({...heldColumn, value: ''})
    }
    return result
  })

  const active = computed(() => chips.value.filter((chip) => chip.value !== ''))
  const available = computed(() => columns.value.filter((column) => !chips.value.some((chip) => chip.id === column.id)))

  const labels = reactive(new Map<string, string>())
  const resolving = new Set<string>()

  function add(id: string) {
    held.value = id
    added.value = id
  }

  /** A chip's editor opened: it is now the held one, kept on screen while its value is empty. */
  function hold(id: string) {
    held.value = id
  }

  function set(column: FilterableColumn, value: string) {
    table.setColumnFilters((old) => [
      ...old.filter((filter) => filter.id !== column.param),
      ...(value === '' ? [] : [{id: column.param, value}]),
    ])
  }

  function release(id: string) {
    if (held.value === id) held.value = null
    if (added.value === id) added.value = null
  }

  function remove(column: FilterableColumn) {
    set(column, '')
    release(column.id)
  }

  function clearAll() {
    const params = new Set(columns.value.map((column) => column.param))
    table.setColumnFilters((old) => old.filter((filter) => !params.has(filter.id)))
    held.value = null
    added.value = null
  }

  function remember(options: FilterOption[]) {
    for (const option of options) labels.set(option.value, option.label)
  }

  // A restored select value the chips cannot name is looked up once; a value
  // that is still unknown afterwards stays as it is, and is not asked again.
  watch(chips, (current) => {
    for (const chip of current) {
      const spec = chip.spec
      if (spec.variant !== 'select' || !spec.resolveLabels || chip.value === '') continue
      const known = new Set((spec.options ?? []).map((option) => option.value))
      const unknown = splitArrayItems(chip.value).filter((item) => !known.has(item) && !labels.has(item) && !resolving.has(item))
      if (unknown.length === 0) continue
      for (const item of unknown) resolving.add(item)
      spec.resolveLabels(unknown).then(remember, () => {})
    }
  }, {immediate: true})

  const state: ColumnFilters = {
    columns,
    chips,
    active,
    available,
    labels,
    held,
    added,
    hold,
    add,
    set,
    remove,
    release,
    clearAll,
    remember,
  }
  byTable.set(table, state)
  return state
}
