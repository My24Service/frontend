<template>
  <BButton size="sm" v-bind:title="$trans('Sort')" @click="method()">
    <IBiSortDownAlt aria-hidden="true"></IBiSortDownAlt>
  </BButton>
</template>

<script>
export default {
  name: "IconLinkSort",
  props: {
    method: {
      type: Function
    }
  },
}
</script>

<style scoped>
</style>
