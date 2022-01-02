<template>
  <div id="app">
    <FlashMessage :position="'right top'"></FlashMessage>
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App',
};
</script>

<style>
</style>
