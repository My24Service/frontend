<template>
  <div ref="app-layout">
    <TheNavLoggedIn v-if="isLoggedIn" />
    <TheNavLoggedOut v-if="!isLoggedIn" />

    <TheTopBar v-if="isLoggedIn && isShltrTheme" />

    <div class="container main-app-container">
      <router-view :key="$route.fullPath" name="app-content"></router-view>
    </div>
  </div>
</template>

<script>

import TheNavLoggedIn from './TheNavLoggedIn.vue'
import TheNavLoggedOut from './TheNavLoggedOut.vue'
import TheTopBar from './TheTopBar.vue'
import componentMixin from "@/mixins/common";

export default {
  mixins: [componentMixin],
  components: {
    TheNavLoggedIn,
    TheNavLoggedOut,
    TheTopBar,
  },
}
</script>

