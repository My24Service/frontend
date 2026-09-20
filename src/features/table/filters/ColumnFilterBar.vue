<template>
  <div
    v-if="columns.length > 0"
    class="column-filter-bar"
    role="group"
    :aria-label="$trans('Column filters')"
  >
    <BDropdown
      v-if="available.length > 0"
      size="sm"
      variant="outline-secondary"
      toggle-class="add-filter-toggle"
      :aria-label="$trans('Add filter')"
    >
      <template #button-content>
        <IBiFunnel /> {{ $trans('Filter') }}
      </template>
      <BDropdownItemButton
        v-for="column in available"
        :key="column.id"
        @click="add(column.id)"
      >
        {{ column.label }}
      </BDropdownItemButton>
    </BDropdown>

    <ColumnFilterChip
      v-for="chip in chips"
      :key="chip.id"
      :column-id="chip.id"
      :label="chip.label"
      :spec="chip.spec"
      :value="chip.value"
      :labels="labels"
      :auto-open="chip.id === added"
      @update:value="set(chip, $event)"
      @remove="remove(chip)"
      @opened="held = chip.id"
      @closed="release(chip.id)"
      @options="remember"
    />

    <button
      v-if="active.length > 1"
      type="button"
      class="btn btn-link btn-sm clear-all"
      @click="clearAll"
    >
      {{ $trans('Clear all') }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="TData extends RowData">
import type { ColumnFiltersState, RowData, VueTable } from '@tanstack/vue-table'
import { $trans } from '@/services/i18n'
import type { AppFeatures, FilterOption } from '../table'
import { filterableColumns, type FilterableColumn } from './column-filter'
import { splitArrayItems } from './filter-grammar'
import ColumnFilterChip from './ColumnFilterChip.vue'

/**
 * The column filters of a list, outside its table: a menu to add one, a
 * chip per filter in force, and a way to clear them all. The state is the
 * table's own (`columnFilters`, the engine commits it and mirrors it into
 * the address bar); this only reads and sets the entry each column filters
 * under — its id, or the `param` a select names when the column shows a
 * name but filters on a key.
 *
 * A chip lives while its column has a value, plus one exception: the chip
 * being edited stays put even when its editor empties the value, and the
 * one just added stays until its editor closes, so neither vanishes
 * under the cursor.
 */
const props = defineProps<{
  table: VueTable<AppFeatures, TData>
}>()

interface Chip extends FilterableColumn {
  value: string
}

const columns = computed(() => filterableColumns(props.table))

/** The chip whose editor is open, or was just added: kept in the bar regardless of its value. */
const held = ref<string | null>(null)
/** The column the menu just added: its chip opens on arrival. */
const added = ref<string | null>(null)

// The engine's state getter reads its own ref, so this is reactive.
const filters = computed<ColumnFiltersState>(() => props.table.options.state?.columnFilters ?? [])

/** Chips in the order the filters were applied, the held one last if it has no value yet. */
const chips = computed<Chip[]>(() => {
  const result: Chip[] = []
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

function add(id: string) {
  held.value = id
  added.value = id
}

function set(column: FilterableColumn, value: string) {
  props.table.setColumnFilters((old) => [
    ...old.filter((filter) => filter.id !== column.param),
    ...(value === '' ? [] : [{id: column.param, value}]),
  ])
}

function remove(column: FilterableColumn) {
  set(column, '')
  release(column.id)
}

function release(id: string) {
  if (held.value === id) held.value = null
  if (added.value === id) added.value = null
}

function clearAll() {
  const params = new Set(columns.value.map((column) => column.param))
  props.table.setColumnFilters((old) => old.filter((filter) => !params.has(filter.id)))
  held.value = null
  added.value = null
}

// ---- select labels: what the chips call a value the spec's options do not name

/** Labels learned from the editors' lists and from `resolveLabels`, by value. */
const labels = reactive(new Map<string, string>())
const resolving = new Set<string>()

function remember(options: FilterOption[]) {
  for (const option of options) labels.set(option.value, option.label)
}

// A restored select value the bar cannot name is looked up once; a value
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
</script>

<style scoped>
.column-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem;
}

.clear-all {
  text-decoration: none;
}
</style>
