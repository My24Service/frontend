<template>
  <BButton size="sm" v-bind:title="$trans('Search')" @click="method()">
    <IBiSearch aria-hidden="true"></IBiSearch>
  </BButton>
</template>

<script>
export default {
  props: {
    method: {
      type: [Function]
    }
  },
}
</script>

<style scoped>
</style>
