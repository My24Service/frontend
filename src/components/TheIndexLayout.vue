<template>
  <div ref='index-layout'>
    <TheNav v-if="store.state.auth.loggedIn"/>
    <TheIndex />
  </div>
</template>

<script setup>
import TheNav from './TheNav.vue'
import TheIndex from './TheIndex.vue'
import {useStore} from "vuex";

const store = useStore()

</script>

<style scoped>
</style>
