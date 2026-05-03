<template>
  <div ref='index-layout'>
    <TheNav v-if="store.isLoggedIn"/>
    <TheIndex />
  </div>
</template>

<script setup>
import TheNav from './TheNav.vue'
import TheIndex from './TheIndex.vue'
import {useAuthStore} from "@/stores/auth";

const store = useAuthStore()

</script>

<style scoped>
</style>
