<template>
  <span>
    <BButton v-if="method" :title="title" size="sm">
      <BLink v-on:click="method()">
        <IBiPlus aria-hidden="true"></IBiPlus>
      </BLink>
    </BButton>
    <BButton v-if="router_name" size="sm" v-bind:title="title" :to="{name: router_name, params: router_params}">
      <IBiPlus aria-hidden="true"></IBiPlus>
    </BButton>
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
