<template>
  <span>
    <BButton variant="light" :title="title" v-on:click="method()">
      <IBiPersonCheckFill class="edit-icon"></IBiPersonCheckFill>
    </BButton>
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
