<template>
  <span>
    <router-link class="icon-th" v-bind:title="title" :to="{name: router_name, params: router_params}">
      <b-icon-plus variant="info"></b-icon-plus>
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
