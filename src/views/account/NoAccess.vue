<template>
  <b-row align-h="center">
    <LoginModal ref="login-modal-component" />
    <b-col cols="4">
      <div class="no-access">
        <h3>{{ $trans('You are not allowed to see this') }}</h3>
        <p v-if="!isLoggedIn" align="center">
          {{ $trans('Please login') }}
        </p>
        <p>
          <b-button @click="showLogin" type="button" variant="secondary">
            {{ $trans('Log in') }}</b-button>
        </p>
        <p v-if="isLoggedIn" align="center">{{ $trans('You might not have enough rights') }}</p>
      </div>
    </b-col>
  </b-row>
</template>

<script>
import LoginModal from "../../components/LoginModal";

export default {
  name: 'NoAccess',
  components: {
    LoginModal,
  },
  computed: {
    isLoggedIn() {
      return this.$store.getters.isLoggedIn
    },
  },
  methods: {
    showLogin() {
      this.$refs['login-modal-component'].show()
    }
  }
}
</script>

<style scoped>
  .no-access {
    padding-top: 120px;
    text-align: center;
  }
</style>
