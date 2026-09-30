<template>
  <span
    v-if="materials.length"
    :title="`${materials.length} materials`"
  >
    {{ materials.length }} {{ materials.length > 1 ? $trans('materials') : $trans('material') }}
    &nbsp;&nbsp;&mdash;&nbsp;&nbsp;
    <span class="dimmed">
      {{ materials[0].amount }} {{ materials[0].material_view.name }}
      <small
        v-if="materials.length > 1"
        class="dimmed"
      >
        {{ $trans("and") }} {{ materials.length - 1 }} {{ $trans("more") }}
      </small>
    </span>
  </span>
</template>

<script setup lang="ts">
/**
 * What a reservation holds, in one line: how many products, then the first
 * with its amount and "and N more" for the rest.
 */
defineProps<{
  materials: readonly {amount?: number; material_view: {name?: string | null}}[]
}>()
</script>
