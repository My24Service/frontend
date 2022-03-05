<template>
  <div ref="app-layout">
    <div class="container">
      <router-view :key="$route.fullPath" name="app-content"></router-view>
    </div>
  </div>
</template>

<script>
export default {
}
</script>

<style scoped>
</style>
