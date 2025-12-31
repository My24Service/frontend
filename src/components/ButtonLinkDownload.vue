<template>
  <b-button size="sm" :title="title" @click="method()">
    <IBiCloudDownload aria-hidden="true"></IBiCloudDownload>
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
