<template>
  <b-button size="sm" v-bind:title="title" :to="{name: router_name, params: router_params}">
    <b-icon-plus aria-hidden="true"></b-icon-plus>
  </b-button>
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
