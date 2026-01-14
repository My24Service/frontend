<template>
  <span>
    <span v-if="type === 'th'">
      <BButton v-if="method" variant="light" class="icon-th" :title="title" v-on:click="method()">
        <IBiPlus variant="info"></IBiPlus>
      </BButton>
      <router-link v-if="router_name" class="icon-th" :title="title" :to="{name: router_name, params: router_params}">
        <BButton variant="light"><IBiPlus variant="info"></IBiPlus></BButton>
      </router-link>
    </span>

    <span v-if="type === 'tr'">
      <BButton v-if="method" variant="light" :title="title" v-on:click="method()">
        <IBiPlus class="edit-icon"></IBiPlus>
      </BButton>
      <router-link v-if="router_name" :title="title" :to="{name: router_name, params: router_params}">
        <BButton variant="light"><IBiPlus class="edit-icon"></IBiPlus></BButton>
      </router-link>
    </span>
  </span>
</template>

<script>
export default {
  name: "IconLinkPlus",
  props: {
    // type can be "th" or "tr"
    type: {
      type: [String],
    },
    title: {
      type: [String],
    },
    method: {
      type: [Function]
    },
    router_name: {
      type: [String],
    },
    router_params: {
      type: [Object],
    },
  },
}
</script>

<style scoped>
</style>
