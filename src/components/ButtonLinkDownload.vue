<template>
  <b-button size="sm" :title="title" @click="method()">
    <b-icon-cloud-download aria-hidden="true"></b-icon-cloud-download>
  </b-button>
</template>

<script>
export default {
  props: {
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
