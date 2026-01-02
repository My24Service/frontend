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
        <BButton type="submit">log in</BButton>
        <BLink @click="function() { forgotPassword() }">{{ $trans('Forgot password?') }}</BLink>
      </div>
    </form>
</template>

<script setup>
import accountModel from "../models/account/Account"
import {reactive} from "vue";
import {useStore} from "vuex";
import {useRouter} from "vue-router";
import {$trans, errorToast, infoToast, isEmpty} from "@/utils";
import {useToast} from "bootstrap-vue-next";
const {create} = useToast()

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
  const valid = !isEmpty(form.password.value) && !isEmpty(form.username.valueOf())
  form.usernameState = valid;
  form.passwordState = valid;
  return valid;
}

async function doLogin(e) {
  e.preventDefault();

  if (!checkFormValidity()) {
    return;
  }

  // const loader = this.$loading.show()

  try {
    const loginResult = await accountModel.login(form.username, form.password)
    await store.dispatch('auth/authenticate', { accessToken: loginResult.token });
    await store.dispatch('getInitialData')
    const userDetails = await accountModel.getUserDetails()
    await store.dispatch('setStreamInfo', userDetails.stream)

    // loader.hide()

    infoToast(this.create, $trans('Logged in'), $trans('You are now logged in'))

    if (document.location.hash.indexOf('?') !== -1) {
      const nextPart = document.location.hash.split('?')[1]
      const nextPath = decodeURIComponent(nextPart.split('=')[1])
      await router.push({path: nextPath})
    }

    await router.push({ name: 'order-list' });

  } catch (error) {
    console.log(error)
    await store.dispatch('auth/loginFailure');
    // loader.hide()

    errorToast(this.create, $trans('Error logging you in'))
  }
}
</script>
<style scoped>

</style>
