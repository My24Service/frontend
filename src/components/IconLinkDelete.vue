<template>
  <span>
    <b-link v-bind:title="title" v-on:click="method()">
      <IBiTrashFill class="edit-icon"></IBiTrashFill>
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
