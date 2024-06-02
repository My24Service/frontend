<template>
  <div ref="app-layout">
    <TheNavLoggedIn v-if="isLoggedIn" />
    <TheNavLoggedOut v-if="!isLoggedIn" />
    
    <div class="container main-app-container">
      <router-view :key="$route.fullPath" name="app-content"></router-view>
    </div>
  </div>
</template>

<script>

import TheNavLoggedIn from './TheNavLoggedIn.vue'
import TheNavLoggedOut from './TheNavLoggedOut.vue'

export default {
  components: {
    TheNavLoggedIn,
    TheNavLoggedOut,
  },
}
</script>

