<template>
  <div ref="app-layout" id="app-layout">
    <TheNavLoggedIn :only-settings="true" />

    <TheTopBar v-if="isShltrFamily" />

    <router-view :key="$route.fullPath" name="app-content" v-slot="{ Component }">
      <component :is="Component" v-bind="props" />
    </router-view>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TheNavLoggedIn from './TheNavLoggedIn.vue'
import TheTopBar from './TheTopBar.vue'
import {useMainStore} from '@/stores/main'

const route = useRoute()
const mainStore = useMainStore()
const isShltrFamily = computed(() => mainStore.getProductFamily === 'shltr')
const props = computed(() => ({
  ...route.params,
  ...(route.meta.props || {}),
  from_settings: true,
}))
</script>
