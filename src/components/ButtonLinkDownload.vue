<template>
  <BButton size="sm" :title="title" @click="method()">
    <IBiCloudDownload aria-hidden="true"></IBiCloudDownload>
  </BButton>
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
