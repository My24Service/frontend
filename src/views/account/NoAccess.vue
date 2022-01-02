<template>
  <b-row align-h="center">
    <b-col cols="4">
      <div class="no-access">
        <h3>{{ $trans('You are not allowed to see this') }}</h3>
        <p v-if="!isLoggedIn" align="center">{{ $trans('Please login') }}</p>
        <p v-if="isLoggedIn" align="center">{{ $trans('You might not have enough rights') }}</p>
      </div>
    </b-col>
  </b-row>
</template>

<script>
export default {
  name: 'NoAccess',
  computed: {
    isLoggedIn() {
      return this.$store.getters.isLoggedIn
    },
  },
}
</script>

<style scoped>
  .no-access {
    padding-top: 120px;
    text-align: center;
  }
</style>
