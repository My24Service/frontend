<template>
    <form ref="login-form" @submit="doLogin">
      <BFormGroup
        v-bind:label="$trans('Username')"
        label-for="username-input"
        v-bind:invalid-feedback="$trans('Username is required')"
        :state="form.usernameState"
      >
        <BFormInput
          id="username-input"
          :autofocus="true"
          v-model="form.username"
          :state="form.usernameState"
          :required="true"
          autocomplete="username"
        ></BFormInput>
      </BFormGroup>
      <BFormGroup
        v-bind:label="$trans('Password')"
        label-for="password-input"
        v-bind:invalid-feedback="$trans('Password is required')"
        :state="form.passwordState"
      >
        <BFormInput
          id="password-input"
          type="password"
          autocomplete="current-password"
          v-model="form.password"
          :state="form.passwordState"
          :required="true"
          v-on:keyup.enter="doLogin"
        ></BFormInput>
      </BFormGroup>
      <div class='flex-columns align-items-center justify-content-center'>
        <b-button type="submit">log in</b-button>
        <b-link @click="function() { forgotPassword() }">{{ $trans('Forgot password?') }}</b-link>
      </div>
    </form>
</template>

<script setup>
import accountModel from "../models/account/Account"
import {reactive} from "vue";
import {useStore} from "vuex";
import {useRouter} from "vue-router";
import {$trans} from "@/utils";

const store = useStore()
const router = useRouter()

const form = reactive({
  username: '',
  usernameState: null,
  password: '',
  passwordState: null,
})

function forgotPassword() {
  router.push({name: 'reset-password'})
}

function checkFormValidity() {
  const valid = this.$refs['login-form'].checkValidity();
  this.usernameState = valid;
  this.passwordState = valid;
  return valid;
}

async function doLogin(e) {
  e.preventDefault();

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
    await store.dispatch('auth/authenticate', { accessToken: loginResult.token });


    await store.dispatch('getInitialData')
    const userDetails = await accountModel.getUserDetails()
    await store.dispatch('setStreamInfo', userDetails.stream)

    loader.hide()

    this.infoToast(this.$trans('Logged in'), this.$trans('You are now logged in'))

    if (document.location.hash.indexOf('?') !== -1) {
      const nextPart = document.location.hash.split('?')[1]
      const nextPath = decodeURIComponent(nextPart.split('=')[1])
      await router.push({path: nextPath})
    }

    await router.push({ name: 'order-list' });

  } catch (error) {
    console.log(error)
    await store.dispatch('auth/loginFailure');
    loader.hide()

    this.errorToast(this.$trans('Error logging you in'))
  }
}
</script>
<style scoped>

</style>
