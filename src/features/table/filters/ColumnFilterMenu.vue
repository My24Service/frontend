<template>
  <BDropdown
    v-if="available.length > 0"
    class="column-filter-menu"
    size="sm"
    variant="outline-secondary"
    toggle-class="add-filter-toggle"
    :aria-label="$trans('Add filter')"
  >
    <template #button-content>
      <IBiFunnel class="filter-icon" />
      <span class="filter-label">{{ $trans('Filter') }}</span>
    </template>
    <BDropdownItemButton
      v-for="column in available"
      :key="column.id"
      @click="add(column.id)"
    >
      {{ column.label }}
    </BDropdownItemButton>
  </BDropdown>
</template>

<script setup lang="ts" generic="TData extends RowData">
import type { RowData, VueTable } from '@tanstack/vue-table'
import type { AppFeatures } from '../table'
import { useColumnFilters } from './use-column-filters'

/**
 * The "Filter" button and its menu: the filterable columns that have no
 * chip yet. Picking one adds its filter and opens its editor over in
 * `ColumnFilterChips` — the two halves share one state (see
 * `use-column-filters.ts`).
 *
 * It lives in the page header, next to the search input, and renders
 * nothing when the table declares no filterable column (`table.ts`,
 * `ColumnMeta.filter`), so a list without filters keeps the header it had.
 * The button is a plain `v-if` on "is there anything left to add": a menu
 * whose every entry is already a chip offers nothing.
 */
const props = defineProps<{
  table: VueTable<AppFeatures, TData>
}>()

const { available, add } = useColumnFilters(props.table)
</script>

<style scoped>
:deep(.add-filter-toggle) {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 2rem;
  padding: 0 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 9999px;
  background-color: white;
  border: 1px solid var(--shltr-slate-200, #e2e8f0);
  color: var(--shltr-slate-700, #334155);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.15s ease;
}

:deep(.add-filter-toggle:hover) {
  background-color: var(--shltr-slate-50, #f8fafc);
  border-color: var(--shltr-slate-300, #cbd5e1);
  color: var(--shltr-slate-900, #0f172a);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.08);
}

:deep(.add-filter-toggle:focus-visible) {
  outline: 2px solid var(--bs-primary, #30BFBF);
  outline-offset: 1px;
}

:deep(.add-filter-toggle.show),
:deep(.add-filter-toggle[aria-expanded="true"]) {
  background-color: var(--shltr-teal-50, rgba(48, 191, 191, 0.08));
  border-color: var(--bs-primary, #30BFBF);
  color: var(--shltr-teal-700, #0f766e);
}

:deep(.add-filter-toggle::after) {
  margin-left: 0.25rem;
  vertical-align: 0.125em;
  opacity: 0.6;
}

:deep(.filter-icon) {
  color: var(--bs-primary, #30BFBF);
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

:deep(.dropdown-menu) {
  border: 1px solid var(--shltr-slate-200, #e2e8f0);
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.03);
  padding: 0.375rem;
  min-width: 10rem;
}

:deep(.dropdown-item) {
  border-radius: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--shltr-slate-700, #334155);
}

:deep(.dropdown-item:hover),
:deep(.dropdown-item:focus) {
  background-color: var(--shltr-slate-50, #f8fafc);
  color: var(--shltr-slate-900, #0f172a);
}

/* The header has less room on a phone: the icon keeps the control, the word goes. */
@media (max-width: 575.98px) {
  .filter-label {
    display: none;
  }

  :deep(.add-filter-toggle) {
    padding: 0 0.5rem;
  }
}
</style>
