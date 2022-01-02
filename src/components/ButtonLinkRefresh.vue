<template>
  <b-button size="sm" v-bind:title="title" @click="method()">
    <b-icon-arrow-repeat aria-hidden="true"></b-icon-arrow-repeat>
  </b-button>
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
