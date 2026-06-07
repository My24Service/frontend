<template>
  <div ref="app-layout" id="app-layout">
    <TheNavLoggedIn v-if="store.isLoggedIn" />
    <TheNavLoggedOut v-if="!store.isLoggedIn" />

    <router-view :key="$route.fullPath" name="app-content"></router-view>

  </div>
</template>

<script setup>
import TheNavLoggedIn from './TheNavLoggedIn.vue'
import TheNavLoggedOut from './TheNavLoggedOut.vue'
import {useAuthStore} from "@/stores/auth";

const store = useAuthStore()

</script>
