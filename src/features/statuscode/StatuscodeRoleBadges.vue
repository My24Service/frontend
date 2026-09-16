<template>
  <span class="statuscode-roles">
    <span v-for="key in roles" :key="key" class="badge text-bg-secondary me-1">{{ roleLabel(key) }}</span>
  </span>
</template>

<script lang="ts" setup>
import { roleLabel } from './statuscode/roles'

defineProps<{
  roles: string[]
}>()
</script>
