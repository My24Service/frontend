<template>
  <span>
    <b-link v-if="method" class="icon-th" v-bind:title="title" v-on:click.native="method()">
      <b-icon-plus variant="info"></b-icon-plus>
    </b-link>
    <router-link v-if="router_name" class="icon-th" v-bind:title="title" :to="{name: router_name, params: router_params}">
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
    method: {
      type: [Function]
    },
    title: {
      type: [String],
    },
  },
}
</script>

<style scoped>
</style>
