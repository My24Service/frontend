<template>
  <component
    :is="to ? 'router-link' : 'div'"
    :to="to"
    class="tw:block tw:rounded-md tw:border tw:border-slate-200 tw:bg-white tw:p-5 tw:no-underline"
    :class="to ? 'tw:hover:border-teal-300' : ''"
  >
    <i :class="['bi', `bi-${icon}`, 'tw:text-lg', iconClass]"></i>
    <div class="tw:mt-3 tw:text-2xl tw:font-semibold tw:tabular-nums tw:text-slate-900">
      {{ value === null ? '—' : value }}
    </div>
    <div class="tw:text-xs tw:text-slate-500">{{ label }}</div>
    <!-- min-h keeps the cards in a row the same height when only some have a hint -->
    <div class="tw:mt-2 tw:min-h-4 tw:text-[11px] tw:text-slate-400">{{ hint }}</div>
  </component>
</template>

<script setup>
// One KPI tile on the shltr overview dashboard. Extracted from the page so
// the headline row and the secondary row are guaranteed to render alike.
//
// A null value renders as a dash: it means "no number to show" — not loaded
// yet, not requested for this member, or the widget failed server-side.
// Strings are allowed so a formatted amount can be passed straight in.
defineProps({
  value: {
    type: [Number, String],
    default: null,
  },
  label: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  iconClass: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
  to: {
    type: Object,
    default: null,
  },
});
</script>
