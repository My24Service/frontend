<template>
  <span>
    <BLink v-if="method" class="icon-th" v-bind:title="title" v-on:click="method()">
      <IBiPlus variant="info"></IBiPlus>
    </BLink>
    <router-link v-if="router_name" class="icon-th" v-bind:title="title" :to="{name: router_name, params: router_params}">
      <IBiPlus variant="info"></IBiPlus>
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
