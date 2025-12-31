<template>
  <b-button size="sm" v-bind:title="title" @click="method()">
    <IBiArrowRepeat aria-hidden="true"></IBiArrowRepeat>
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
