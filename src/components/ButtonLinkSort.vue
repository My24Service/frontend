<template>
  <b-button size="sm" v-bind:title="$trans('Sort')" @click="method()">
    <b-icon-sort-down-alt aria-hidden="true"></b-icon-sort-down-alt>
  </b-button>
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
