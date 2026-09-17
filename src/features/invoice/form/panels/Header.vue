<template>
  <p>
    <span class="header">
      {{ text }}
    </span>
  </p>
</template>

<script setup lang="ts">
defineOptions({ name: 'HeaderComponent' })
defineProps<{ text?: string }>()
</script>

<style scoped>
.header {
  font-size: 14px;
  font-weight: bold;
}
</style>
