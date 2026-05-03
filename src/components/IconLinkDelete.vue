<template>
  <span>
    <BButton variant="light" :title="title" @click="method()">
      <IBiTrashFill class="edit-icon"></IBiTrashFill>
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
