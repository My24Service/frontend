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
      <form ref="login-form" @submit="doLogin">
        <b-form-group
          v-bind:label="$trans('Username')"
          label-for="username-input"
          v-bind:invalid-feedback="$trans('Username is required')"
          :state="usernameState"
        >
          <b-form-input
            id="username-input"
            autofocus
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
            v-on:keyup.enter="doLogin"
          ></b-form-input>
        </b-form-group>
        <div>
          <b-link @click="function() { forgotPassword() }">{{ $trans('Forgot your password?') }}</b-link>
        </div>
      </form>
    </b-modal>
  </div>
</template>

<script>
import accountModel from "../models/account/Account"

export default {
  name: "LoginModal",
  data() {
    return {
      username: '',
      usernameState: null,
      password: '',
      passwordState: null,
    }
  },
  methods: {
    show() {
      this.$refs['login-modal'].show()
    },
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
    async doLogin() {
      // do login
      if (!this.checkFormValidity()) {
        return;
      }

      this.$nextTick(() => {
        this.$bvModal.hide('login-modal')
      })

      const loader = this.$loading.show()

      try {
        const loginResult = await accountModel.login(this.username, this.password)
        this.$auth.authenticate({ accessToken: loginResult.token })

        await this.$store.dispatch('getInitialData')
        const userDetails = await accountModel.getUserDetails()
        await this.$store.dispatch('setStreamInfo', userDetails.stream)

        loader.hide()

        this.infoToast(this.$trans('Logged in'), this.$trans('You are now logged in'))

        if (document.location.hash.indexOf('?') !== -1) {
          const nextPart = document.location.hash.split('?')[1]
          const nextPath = decodeURIComponent(nextPart.split('=')[1])
          await this.$router.push({path: nextPath})
        }
      } catch (error) {
        console.log(error)
        loader.hide()

        if (this.$refs['login-modal']) {
          this.$refs['login-modal'].hide()
        }

        this.errorToast(this.$trans('Error logging you in'))
      }

    }

  }
}
</script>

<style scoped>

</style>
