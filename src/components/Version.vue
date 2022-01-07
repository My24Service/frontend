<template>
  <div class="version">{{ version }}</div>
</template>

<script>
import { VERSION } from '@/version'

export default {
  name: "Version",
  data() {
    return {
      version: VERSION
    }
  }
}
</script>

<style scoped>
  .version {
    padding-left: 8px;
    color: white;
    font-size: 14px;
  }
</style>
