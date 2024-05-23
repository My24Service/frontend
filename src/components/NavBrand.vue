<template>
  <b-navbar-brand ref="nav-brand" to="/" :title="memberName()" >
    <img class="memberLogo" v-bind:src="memberLogo()" v-bind:alt="memberName()" >
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

<style scoped>
.memberLogo {
  max-width: 200px;
  max-height: 100px
}
</style>

