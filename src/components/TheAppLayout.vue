<template>
  <div ref="app-layout" id="app-layout">
    <TheNavLoggedIn v-if="store.state.auth.loggedIn" />
    <TheNavLoggedOut v-if="!store.state.auth.loggedIn" />

    <router-view :key="$route.fullPath" name="app-content"></router-view>

  </div>
</template>

<script setup>
import TheNavLoggedIn from './TheNavLoggedIn.vue'
import TheNavLoggedOut from './TheNavLoggedOut.vue'
import {useStore} from "vuex";

const props = defineProps({
  hasSubNav: Boolean
})

const store = useStore()

// export default {
//
//   props: {
//     hasSubNav: {
//       type: Boolean,
//       default: true
//     }
//   },
//   components: {
//     TheNavLoggedIn,
//     TheNavLoggedOut,
//   },
// }
</script>
