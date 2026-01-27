<template>
  <BButton size="sm" v-bind:title="$trans('Sort')" @click="method()">
    <IBiSortDownAlt aria-hidden="true"></IBiSortDownAlt>
  </BButton>
</template>

<script>
import componentMixin from "@/mixins/common";

export default {
  setup() {
    return {
    }
  },
  mixins: [componentMixin],
  name: "ButtonLinkSort",
  props: {
    method: {
      type: Function
    }
  },
}
</script>

<style scoped>
</style>
