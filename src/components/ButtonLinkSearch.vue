<template>
  <b-button size="sm" v-bind:title="$trans('Search')" @click="method()">
    <IBiSearch aria-hidden="true"></IBiSearch>
  </b-button>
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
