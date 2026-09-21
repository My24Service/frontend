<template>
  <div v-if="layoutProps.bare" ref="app-layout">
    <router-view :key="$route.fullPath" name="app-content"></router-view>
  </div>
  <div v-else ref="app-layout" id="app-layout">
    <TheNavLoggedIn v-if="store.isLoggedIn" :only-settings="layoutProps.settings" />

    <NavBrand
      v-if="!store.isLoggedIn && memberInfo"
      :member-info="memberInfo"
    />

    <TheTopBar v-if="showTopBar" />

    <router-view :key="$route.fullPath" name="app-content" v-slot="{ Component }">
      <component :is="Component" v-bind="props" />
    </router-view>

  </div>
</template>

<script setup lang="ts">
import {useAuthStore} from '@/features/auth'
import TheNavLoggedIn from './TheNavLoggedIn.vue'
import NavBrand from './NavBrand.vue'
import TheTopBar from './TheTopBar.vue'
import {useMainStore} from '@/stores/main'

const layoutProps = withDefaults(defineProps<{
  bare?: boolean
  settings?: boolean
}>(), {
  bare: false,
  settings: false,
})

const store = useAuthStore()
const mainStore = useMainStore()
const isShltrFamily = computed(() => mainStore.getProductFamily === 'shltr')
// The settings shell always showed the TopBar on shltr; the default shell
// only when logged in.
const showTopBar = computed(() => isShltrFamily.value && (layoutProps.settings || store.isLoggedIn))
// Logged-out branch (previously a separate component): brand for
// logged-out visitors, fetched from the initial data.
const memberInfo = computed(() => mainStore.memberInfo)
if (!store.isLoggedIn) {
  mainStore.checkInitialData()
}
const route = useRoute()

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

const props = computed(() => ({
  ...route.params,
  ...(isRecord(route.meta.props) ? route.meta.props : {}),
  from_settings: layoutProps.settings,
}))
</script>
