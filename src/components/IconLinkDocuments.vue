<template>
  <span>
    <router-link class="px-1" :to="{name: router_name, params: router_params}" v-bind:title="title">
      <b-icon-file class="edit-icon"></b-icon-file>
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
