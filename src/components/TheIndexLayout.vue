<template>
  <div ref='index-layout'>
    <TheNav v-if="isLoggedIn"/>
    <TheIndex />
  </div>
</template>

<script>
import TheNav from './TheNav.vue'
import TheIndex from './TheIndex.vue'
import { componentMixin } from '@/utils.js'

export default {
  mixins: [componentMixin],
  components: {
    TheNav,
    TheIndex
  },
  name: 'TheIndexLayout',
}
</script>

<style scoped>
</style>
