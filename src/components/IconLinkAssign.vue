<template>
  <span>
    <b-link class="px-1" v-bind:title="title" v-on:click.native="method()">
      <b-icon-arrow-bar-right class="edit-icon"></b-icon-arrow-bar-right>
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
