<template>
  <div ref="app-layout" id="app-layout">
    <TheNavLoggedIn v-if="store.isLoggedIn" />
    <TheNavLoggedOut v-if="!store.isLoggedIn" />

    <router-view :key="$route.fullPath" name="app-content" v-slot="{ Component }">
      <component :is="Component" v-bind="props" />
    </router-view>

  </div>
</template>

<script setup>
import {computed} from 'vue'
import {useRoute} from 'vue-router'
import {useAuthStore} from "@/stores/auth";
import TheNavLoggedIn from './TheNavLoggedIn.vue'
import TheNavLoggedOut from './TheNavLoggedOut.vue'

const store = useAuthStore()
const route = useRoute()
const props = computed(() => ({
  ...route.params,
  ...(route.meta.props || {}),
  from_settings: false,
}))
</script>
