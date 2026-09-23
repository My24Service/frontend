<template>
  <BDropdown
    class="order-view-dropdown"
    size="sm"
    variant="outline-secondary"
    toggle-class="order-view-toggle"
    :aria-label="$trans('Order view')"
  >
    <template #button-content>{{ active.label }}</template>
    <BDropdownItemButton
      v-for="view in views"
      :key="view.id"
      :active="view.id === active.id"
      :aria-label="`${$trans('View')} ${view.label}`"
      @click="emit('select', view)"
    >
      {{ view.label }}
    </BDropdownItemButton>
  </BDropdown>
</template>

<script setup lang="ts">
import type { OrderViewOption } from './use-order-views'

/**
 * The order list's view picker, in the page header beside the "Filter" menu.
 *
 * It renders the views it is handed and names the active one on its trigger:
 * the screen owns the state (`use-order-views.ts`), so exactly one entry is
 * ever marked active — which is what replaces the pills whose "All" stayed
 * highlighted through the router's own matching.
 */
defineProps<{
  views: OrderViewOption[]
  active: OrderViewOption
}>()

const emit = defineEmits<{(event: 'select', view: OrderViewOption): void}>()
</script>

<style scoped>
/* A gap after the control while it is on screen, matching the filter menu. */
.order-view-dropdown {
  margin-right: 0.5rem;
}

:deep(.order-view-toggle) {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 2rem;
  padding: 0 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: var(--bs-border-radius, 0.375rem);
  background-color: white;
  border: 1px solid var(--shltr-slate-200, #e2e8f0);
  color: var(--shltr-slate-700, #334155);
}

:deep(.order-view-toggle:hover) {
  background-color: var(--shltr-slate-50, #f8fafc);
  border-color: var(--shltr-slate-300, #cbd5e1);
  color: var(--shltr-slate-900, #0f172a);
}

:deep(.order-view-toggle:focus-visible) {
  outline: 2px solid var(--bs-primary, #30BFBF);
  outline-offset: 1px;
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

:deep(.dropdown-item.active) {
  background-color: var(--shltr-teal-50, rgba(48, 191, 191, 0.08));
  color: var(--shltr-teal-700, #0f766e);
}
</style>
