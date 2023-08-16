<template>
  <div ref="app-layout" id="app-layout">
    <TheNavLoggedIn v-if="isLoggedIn" />
    <TheNavLoggedOut v-if="!isLoggedIn" />

    <router-view :key="$route.fullPath" name="app-content"></router-view>

  </div>
</template>

<script>
import { componentMixin } from '@/utils.js'
import TheNavLoggedIn from './TheNavLoggedIn.vue'
import TheNavLoggedOut from './TheNavLoggedOut.vue'
export default {
  mixins: [componentMixin],
  props: {
    hasSubNav: {
      type: Boolean,
      default: true
    }
  },
  components: {
    TheNavLoggedIn,
    TheNavLoggedOut,
  },
}
</script>