<template>
  <div>
    <b-modal
      id="login-modal"
      ref="login-modal"
      v-bind:title="$trans('Login')"
      @show="resetModal"
      @hidden="resetModal"
      @ok="handleOk"
    >
      <form ref="login-form" @submit.stop.prevent="doLogin">
        <b-form-group
          v-bind:label="$trans('Username')"
          label-for="username-input"
          v-bind:invalid-feedback="$trans('Username is required')"
          :state="usernameState"
        >
          <b-form-input
            autofocus
            id="username-input"
            v-model="username"
            :state="usernameState"
            required
          ></b-form-input>
        </b-form-group>
        <b-form-group
          v-bind:label="$trans('Password')"
          label-for="password-input"
          v-bind:invalid-feedback="$trans('Password is required')"
          :state="passwordState"
        >
          <b-form-input
            id="password-input"
            type="password"
            v-model="password"
            :state="passwordState"
            required
          ></b-form-input>
        </b-form-group>
        <div>
          <b-link @click="function() { forgotPassword() }">{{ $trans('Forgot your password?') }}</b-link>
        </div>
      </form>
    </b-modal>

    <b-navbar toggleable="sm" variant="primary">
      <b-container>

        <NavBrand />

        <b-collapse id="nav-collapse" is-nav>
          <!-- Right aligned nav items -->
          <b-navbar-nav class="ml-auto">
            <b-nav-item v-b-modal.login-modal>Login</b-nav-item>
            <TheLanguageChooser />
          </b-navbar-nav>
        </b-collapse>
      </b-container>
    </b-navbar>
  </div>
</template>

<script>
import TheLanguageChooser from "@/components/TheLanguageChooser";
import NavBrand from "@/components/NavBrand";

export default {
  components: {
    TheLanguageChooser,
    NavBrand,
  },
  name: "TheNavNotLoggedIn",
  data() {
    return {
      username: '',
      usernameState: null,
      password: '',
      passwordState: null,
    }
  },
  methods: {
    forgotPassword() {
      this.$refs['login-modal'].hide()
      setTimeout(() => {
        this.$router.push({name: 'reset-password'})
      }, 500)
    },
    handleOk(modalEvt) {
      modalEvt.preventDefault()
      this.doLogin();
    },
    checkFormValidity() {
      const valid = this.$refs['login-form'].checkValidity();
      this.usernameState = valid;
      this.passwordState = valid;
      return valid;
    },
    resetModal() {
      this.username = ''
      this.usernameState = null
      this.password = ''
      this.passwordState = null
    },
    doLogin() {
      // do login
      if (!this.checkFormValidity()) {
        return;
      }

      this.$store.dispatch('getCsrfToken').then((token) => {
        const data = {
          token,
          username: this.username,
          password: this.password
        };

        this.$store.dispatch('login', data)
          .then(() => {
            this.flashMessage.show({
              status: 'info',
              title: this.$trans('Logged in'),
              message: this.$trans('You are now logged in')
            });

            if (document.location.hash.indexOf('?') !== -1) {
              const nextPart = document.location.hash.split('?')[1]
              const nextPath = decodeURIComponent(nextPart.split('=')[1])
              this.$router.push({path: nextPath})
            }
          })
          .catch((error) => {
            this.flashMessage.show({
              status: 'error',
              title: this.$trans('Error'),
              message: this.$trans('Error logging you in')
            });
          });
      });
    },

  }
}

</script>

<style scoped>
.navbar {
  padding: 0 !important;
}
</style>
