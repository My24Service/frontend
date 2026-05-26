<template>
  <div ref="app-layout">
    <router-view :key="$route.fullPath" name="app-content"></router-view>
  </div>
</template>

<script>
export default {
}
</script>

<style scoped>
</style>
