<template>
  <div ref='index-layout'>
    <TheNav />

    <div class="container main-app-container">
      <TheIndex />
    </div>
  </div>
</template>

<script>
import TheNav from './TheNav.vue'
import TheIndex from './TheIndex.vue'

export default {
  components: {
    TheNav,
    TheIndex
  },
  name: 'TheIndexLayout',
}
</script>

<style scoped>
</style>
