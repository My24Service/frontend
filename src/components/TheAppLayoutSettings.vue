<template>
  <div ref="app-layout" id="app-layout">
    <TheNavLoggedIn :only-settings="true" />

    <router-view :key="$route.fullPath" name="app-content"></router-view>

  </div>
</template>

<script setup>
import TheNavLoggedIn from './TheNavLoggedIn.vue'

</script>
