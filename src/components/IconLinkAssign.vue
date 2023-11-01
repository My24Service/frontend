<template>
  <span>
    <b-link v-bind:title="title" v-on:click.native="method()">
      <b-icon-person-check-fill class="edit-icon"></b-icon-person-check-fill>
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
