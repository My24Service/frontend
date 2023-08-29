<template>
  <span>
    <b-link class="px-1" v-bind:title="title" v-on:click="method()">
      <b-icon-trash class="edit-icon"></b-icon-trash>
    </b-link>
  </span>
</template>

<script>
export default {
  props: {
    title: {
      type: [String],
    },
    method: {
      type: [Function]
    }
  },
}
</script>

<style scoped>
</style>
