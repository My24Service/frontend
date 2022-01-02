<template>
  <b-button size="sm" v-bind:title="$trans('Search')" @click="method()">
    <b-icon-search aria-hidden="true"></b-icon-search>
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
