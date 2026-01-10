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
import {useLoading} from 'vue-loading-overlay'
import {reactive} from "vue";
import {useRouter} from "vue-router";
import {$trans, errorToast, infoToast, isEmpty} from "@/utils";
import {useAuthStore} from "@/stores/auth";
import {useMainStore} from "@/stores/main";
import {useToast} from "bootstrap-vue-next";

const $loading = useLoading({
  // options
});

const authStore = useAuthStore()
const mainStore = useMainStore()
const {create} = useToast()
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

  let loader = $loading.show({
    // Optional parameters
    // container: this.fullPage ? null : this.$refs.formContainer,
    // canCancel: true,
    // onCancel: this.onCancel,
  });

  try {
    await authStore.login(form.username, form.password)
    await mainStore.getInitialData()

    loader.hide()

    infoToast(create, $trans('Logged in'), $trans('You are now logged in'))

    if (document.location.hash.indexOf('?') !== -1) {
      const nextPart = document.location.hash.split('?')[1]
      const nextPath = decodeURIComponent(nextPart.split('=')[1])
      await router.push({path: nextPath})
    } else{
      await router.push({ name: 'order-list' });
    }
  } catch (error) {
    console.log({error})
    await authStore.loginFailure();
    loader.hide()

    errorToast(create, $trans('Error logging you in'))
  }
}
</script>
<style scoped>

</style>
