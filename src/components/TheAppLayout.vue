<template>
  <div ref="app-layout" id="app-layout">
    <TheNavLoggedIn v-if="store.isLoggedIn" />
    <TheNavLoggedOut v-if="!store.isLoggedIn" />

    <TheTopBar v-if="store.isLoggedIn && isShltrFamily" />

    <router-view :key="$route.fullPath" name="app-content" v-slot="{ Component }">
      <component :is="Component" v-bind="props" />
    </router-view>

  </div>
</template>

<script setup>
import {computed} from 'vue'
import {useRoute} from 'vue-router'
import {useAuthStore} from "@/features/auth";
import TheNavLoggedIn from './TheNavLoggedIn.vue'
import TheNavLoggedOut from './TheNavLoggedOut.vue'
import TheTopBar from './TheTopBar.vue'
import {useMainStore} from '@/stores/main'

const store = useAuthStore()
const mainStore = useMainStore()
const isShltrFamily = computed(() => mainStore.getProductFamily === 'shltr')
const route = useRoute()
const props = computed(() => ({
  ...route.params,
  ...(route.meta.props || {}),
  from_settings: false,
}))
</script>
