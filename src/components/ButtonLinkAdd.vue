<template>
  <span>
    <b-button v-if="method" :title="title" size="sm">
      <b-link v-on:click.native="method()">
        <b-icon-plus aria-hidden="true"></b-icon-plus>
      </b-link>
    </b-button>
    <b-button v-if="router_name" size="sm" v-bind:title="title" :to="{name: router_name, params: router_params}">
      <b-icon-plus aria-hidden="true"></b-icon-plus>
    </b-button>
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
