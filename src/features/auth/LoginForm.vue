<template>
    <form @submit="doLogin">
      <BFormGroup
        v-bind:label="$trans('Username')"
        label-for="username-input"
        v-bind:invalid-feedback="$trans('Username is required')"
        :state="usernameState"
      >
        <BFormInput
          id="username-input"
          :autofocus="true"
          v-model="username"
          :state="usernameState"
          :required="true"
          autocomplete="username"
        ></BFormInput>
      </BFormGroup>
      <BFormGroup
        v-bind:label="$trans('Password')"
        label-for="password-input"
        v-bind:invalid-feedback="$trans('Password is required')"
        :state="passwordState"
      >
        <BFormInput
          id="password-input"
          type="password"
          autocomplete="current-password"
          v-model="password"
          :state="passwordState"
          :required="true"
          v-on:keyup.enter="doLogin"
        ></BFormInput>
      </BFormGroup>
      <div class='flex-columns align-items-center justify-content-center'>
        <BButton type="submit" :disabled="isSubmitting">{{ $trans('Log in') }}</BButton>
        <BLink @click="forgotPassword">{{ $trans('Forgot password?') }}</BLink>
      </div>
    </form>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useLoading } from 'vue-loading-overlay'
import { useRouter } from 'vue-router'
import { useToast } from 'bootstrap-vue-next'

import { useAuthStore } from '@/features/auth'
import { useMainStore } from '@/stores/main'
import { $trans, errorToast, infoToast } from '@/utils'

const $loading = useLoading()

const authStore = useAuthStore()
const mainStore = useMainStore()
const { create } = useToast()
const router = useRouter()

const username = ref('')
const password = ref('')
const submitClicked = ref(false)
const isSubmitting = ref(false)

function forgotPassword() {
  router.push({ name: 'reset-password' })
}

/**
 * The plain required check both fields share. Unlike the member and account
 * slices this form has no generated request schema for its wire shape —
 * login posts through the store's hand-written call — so the check stays
 * here next to the only fields it reads.
 */
const isValid = computed(() => username.value.trim() !== '' && password.value !== '')
const usernameState = computed(() => (submitClicked.value ? isValid.value : null))
const passwordState = computed(() => (submitClicked.value ? isValid.value : null))

async function doLogin(event: Event) {
  event.preventDefault()
  if (isSubmitting.value) return

  submitClicked.value = true
  if (!isValid.value) return

  isSubmitting.value = true
  const loader = $loading.show()

  try {
    await authStore.login(username.value, password.value)
    await mainStore.getInitialData()

    infoToast(create, $trans('Logged in'), $trans('You are now logged in'))

    // redirect logic is handled at a higher level
    // @see ./TheIndex.vue
  } catch (error) {
    console.log({ error })
    errorToast(create, $trans('Error logging you in'))
  } finally {
    loader.hide()
    isSubmitting.value = false
  }
}

</script>
<style scoped>

</style>
