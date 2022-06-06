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
.memberLogo {
  position: absolute;
  top: 0;
  z-index: 10;
  max-height: 120px;
  max-width: 120px;
}
</style>
