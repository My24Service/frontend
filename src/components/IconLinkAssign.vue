<template>
  <span>
    <BLink v-bind:title="title" v-on:click="method()">
      <IBiPersonCheckFill class="edit-icon"></IBiPersonCheckFill>
    </BLink>
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
