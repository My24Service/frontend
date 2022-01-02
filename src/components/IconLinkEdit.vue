<template>
  <span>
    <b-link v-if="method" class="px-1" v-bind:title="title" v-on:click.native="method()">
      <b-icon-pencil class="edit-icon"></b-icon-pencil>
    </b-link>
    <router-link v-if="router_name" class="px-1" :to="{name: router_name, params: router_params}" v-bind:title="title">
      <b-icon-pencil class="edit-icon"></b-icon-pencil>
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
