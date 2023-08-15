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
    }
  }
}

</script>

<style scoped>
div {
  text-align: center;
}
</style>
