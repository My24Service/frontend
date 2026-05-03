<template>
  <span>
    <BButton v-if="method" variant="light" :title="title" v-on:click="method()">
      <IBiPencil class="edit-icon"></IBiPencil>
    </BButton>
    <router-link
      v-if="router_name"
      :to="{name: router_name, params: router_params}"
      :title="title"
    >
      <BButton variant="light"><IBiPencil class="edit-icon"></IBiPencil></BButton>
    </router-link>
  </span>
</template>

<script>
export default {
  props: {
    router_name: {
      type: [String],
    },
    router_params: {
      type: [Object],
    },
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
