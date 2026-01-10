<template>
  <span>
    <router-link :to="{name: router_name, params: router_params}" v-bind:title="title">
      <IBiFile class="edit-icon"></IBiFile>
    </router-link>
  </span>
</template>

<script>
export default {
  props: {
    router_name: {
      type: [String],
    },
    router_params: {
      type: [Object],
    },
    title: {
      type: [String],
    },
  },
}
</script>

<style scoped>
</style>
