<template>
  <section class="tw:flex tw:flex-col tw:overflow-hidden tw:rounded-md tw:border tw:border-slate-200 tw:bg-white">
    <header
      class="tw:flex tw:shrink-0 tw:items-center tw:gap-2 tw:border-b tw:border-slate-200 tw:px-4 tw:py-3"
    >
      <i v-if="iconName" :class="['bi', `bi-${iconName}`, 'tw:text-slate-400']"></i>
      <span class="tw:h-4 tw:w-px tw:bg-slate-200" v-if="iconName"></span>
      <h2 class="tw:m-0 tw:text-sm tw:font-semibold tw:text-slate-900">{{ title }}</h2>
      <div class="tw:ml-auto" v-if="$slots.actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="tw:min-h-0 tw:flex-1 tw:overflow-y-auto">
      <slot />
    </div>
  </section>
</template>

<script setup>
// Card primitive for the shltr dashboard: flat, border-only, no shadow.
// Same props as DashboardBlock so pages can swap one for the other; `height`
// is deliberately absent — the shltr layout sizes cards from the grid.
defineProps({
  title: {
    type: String,
    required: true,
  },
  iconName: {
    type: String,
    required: false,
  },
});
</script>
