<template>
  <div>
    <LoginModal ref="login-modal-component" />

    <b-navbar toggleable="sm" variant="primary">
      <b-container>

        <NavBrand />

        <b-collapse id="nav-collapse" is-nav>
          <!-- Right aligned nav items -->
          <b-navbar-nav class="ml-auto">
            <b-nav-item @click="showLogin">Login</b-nav-item>
            <TheLanguageChooser />
          </b-navbar-nav>
        </b-collapse>

        <Version />

      </b-container>
    </b-navbar>
  </div>
</template>

<script>
import TheLanguageChooser from "../components/TheLanguageChooser.vue"
import NavBrand from "../components/NavBrand.vue"
import Version from "../components/Version.vue"
import LoginModal from "./LoginModal";

export default {
  components: {
    TheLanguageChooser,
    NavBrand,
    Version,
    LoginModal,
  },
  name: "TheNavNotLoggedIn",
  data() {
    return {
    }
  },
  methods: {
    showLogin() {
      this.$refs['login-modal-component'].show()
    },
  }
}

</script>

<style scoped>
.navbar {
  padding: 0 !important;
}
</style>
