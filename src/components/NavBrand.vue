<template>
  <b-navbar-brand ref="nav-brand" to="/">
    <img class="memberLogo" v-bind:src="memberLogo()" v-bind:alt="memberName()">
  </b-navbar-brand>
</template>

<script>
export default {
  name: "NavBrand",
  methods: {
    memberLogo() {
      return this.$store.getters.getMemberLogo;
    },
    memberName() {
      return this.$store.getters.getMemberName;
    },
  }
}
</script>

<style>
</style>
