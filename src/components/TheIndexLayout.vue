<template>
  <div ref='index-layout'>
    <div v-if="store.isLoggedIn" ref='nav-container' class="nav-container">
      <TheNavLoggedIn />
    </div>
    <TheIndex />
  </div>
</template>

<script setup>
import TheNavLoggedIn from './TheNavLoggedIn.vue'
import TheIndex from './TheIndex.vue'
import {useAuthStore} from "@/features/auth";

const store = useAuthStore()

</script>

<style scoped>
</style>
