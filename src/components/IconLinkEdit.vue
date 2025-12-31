<template>
  <span>
    <b-link v-if="method" v-bind:title="title" v-on:click="method()">
      <IBiPencil class="edit-icon"></IBiPencil>
    </b-link>
    <router-link v-if="router_name" :to="{name: router_name, params: router_params}" v-bind:title="title">
      <IBiPencil class="edit-icon"></IBiPencil>
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
