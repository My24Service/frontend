<template>
  <div ref="app-layout">
    <TheNav />
    <router-view/>
    <div class="container main-app-container">
      <router-view :key="$route.fullPath" name="app-content"></router-view>
    </div>
  </div>
</template>

<script>
import TheNav from './TheNav';

export default {
  components: {
    TheNav,
    SubNav
  },
}
</script>

<style scoped>
</style>
