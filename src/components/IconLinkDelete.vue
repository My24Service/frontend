<template>
  <span>
    <b-link v-bind:title="title" v-on:click="method()">
      <b-icon-trash-fill class="edit-icon"></b-icon-trash-fill>
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
