<template>
  <div
    v-if="chips.length > 0"
    class="column-filter-chips"
    role="group"
    :aria-label="$trans('Column filters')"
  >
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
      @opened="hold(chip.id)"
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
import type { RowData, VueTable } from '@tanstack/vue-table'
import type { AppFeatures } from '../table'
import { useColumnFilters } from './use-column-filters'
import ColumnFilterChip from './ColumnFilterChip.vue'

/**
 * The filters in force, one chip each, with a "Clear all" once there is more
 * than one. It lives in the list's subnav area, before whatever the page
 * puts there, and renders nothing when no filter is set.
 *
 * The chips and the header's menu share one state (`use-column-filters.ts`),
 * which is what lets the menu open the editor of the column it just added.
 * `held`/`added` are that state's, not this component's: a chip whose editor
 * is open stays on screen after its value is cleared, and the chip the menu
 * just added opens on arrival.
 */
const props = defineProps<{
  table: VueTable<AppFeatures, TData>
}>()

const { chips, active, labels, added, hold, set, remove, release, clearAll, remember } = useColumnFilters(props.table)
</script>

<style scoped>
.column-filter-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.clear-all {
  display: inline-flex;
  align-items: center;
  height: 2rem;
  padding: 0 0.625rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--shltr-slate-500, #64748b);
  text-decoration: none;
  border-radius: 9999px;
  transition: all 0.15s ease;
}

.clear-all:hover {
  color: #e11d48;
  background-color: #fff1f2;
}
</style>
