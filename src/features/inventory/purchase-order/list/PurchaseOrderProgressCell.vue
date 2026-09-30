<template>
  <div class="flex-columns">
    <b-progress
      :style="`--delay: ${delay}`"
      :value="percentage"
    />
    <small class="dimmed">{{ entries || 0 }} / {{ materials }}</small>
  </div>
</template>

<script setup lang="ts">
/**
 * How much of an order has come in: the entries booked against the products
 * ordered, as a bar and as the two numbers.
 */
const props = defineProps<{
  entries: number | string | null
  materials: number | string | null
  /** The row's position, which staggers the bar's entrance. */
  delay: number
}>()

const percentage = computed(() => {
  const total = Number(props.materials)
  return total > 0 ? (Number(props.entries) / total) * 100 : 0
})
</script>

<style scoped>
.flex-columns {
  align-items: center;
}

.dimmed {
  min-width: 3rem;
  text-align: center;
}
</style>
