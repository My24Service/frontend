<template>
  <span>
    <span v-if="type === 'th'">
      <b-link v-if="method" class="icon-th" v-bind:title="title" v-on:click="method()">
        <IBiPlus variant="info"></IBiPlus>
      </b-link>
      <router-link v-if="router_name" class="icon-th" v-bind:title="title" :to="{name: router_name, params: router_params}">
        <IBiPlus variant="info"></IBiPlus>
      </router-link>
    </span>

    <span v-if="type === 'tr'">
      <b-link v-if="method" v-bind:title="title" v-on:click="method()">
        <IBiPlus class="edit-icon"></IBiPlus>
      </b-link>
      <router-link v-if="router_name" v-bind:title="title" :to="{name: router_name, params: router_params}">
        <IBiPlus class="edit-icon"></IBiPlus>
      </router-link>
    </span>
  </span>
</template>

<script>
export default {
  name: "IconLinkPlus",
  props: {
    // type can be "th" or "tr"
    type: {
      type: [String],
    },
    title: {
      type: [String],
    },
    method: {
      type: [Function]
    },
    router_name: {
      type: [String],
    },
    router_params: {
      type: [Object],
    },
  },
}
</script>

<style scoped>
</style>
