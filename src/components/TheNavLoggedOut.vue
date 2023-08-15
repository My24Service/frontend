<template>
  <div>
    <NavBrand />
  </div>
</template>

<script>
import NavBrand from "./NavBrand.vue"

export default {
  components: {
    NavBrand,
  },
  name: "TheNavLoggedOut",
  data() {
    return {
      username: '',
      usernameState: null,
      password: '',
      passwordState: null,
    }
  }
}

</script>

<style scoped>
div {
  text-align: center;
}
</style>
