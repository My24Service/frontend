<template>
  <ValidatedForm
    name="login"
    v-model="credentials"
    :errors="errors"
    :labels="FIELD_LABELS"
    :submitted="submitClicked"
  >
    <form @submit="doLogin">
      <ValidatedFormField
        name="username"
        autocomplete="username"
        autofocus
      />
      <ValidatedFormField
        name="password"
        type="password"
        autocomplete="current-password"
        @keyup.enter="doLogin"
      />
      <div class='flex-columns align-items-center justify-content-center'>
        <BButton type="submit" :disabled="isSubmitting">{{ $trans('Log in') }}</BButton>
        <BLink @click="forgotPassword">{{ $trans('Forgot password?') }}</BLink>
      </div>
    </form>
  </ValidatedForm>
</template>

<script lang="ts" setup>
import { useLoading } from 'vue-loading-overlay'
import { useAuthStore } from '@/features/auth'
import ValidatedForm from '@/features/forms/ValidatedForm.vue'
import ValidatedFormField from '@/features/forms/ValidatedFormField.vue'
import type { FieldLabels } from '@/features/forms/validated-form-context'
import { requiredMessage, type FieldErrors } from '@/features/forms/validation'
import { useMainStore } from '@/stores/main'
import { $trans, errorToast, infoToast } from '@/services/i18n'

interface LoginFormValues {
  username: string
  password: string
}

type LoginFieldErrors = FieldErrors<'username' | 'password'>

const FIELD_LABELS = {
  username: () => $trans('Username'),
  password: () => $trans('Password'),
} satisfies FieldLabels<'username' | 'password'>

const $loading = useLoading()

const authStore = useAuthStore()
const mainStore = useMainStore()
const { create } = useToast()
const router = useRouter()

const credentials = ref<LoginFormValues>({ username: '', password: '' })
const errors = ref<LoginFieldErrors>({})
const submitClicked = ref(false)
const isSubmitting = ref(false)

function forgotPassword() {
  router.push({ name: 'reset-password' })
}

const usernameFilled = computed(() => credentials.value.username.trim() !== '')
const passwordFilled = computed(() => credentials.value.password !== '')
const isValid = computed(() => usernameFilled.value && passwordFilled.value)

async function doLogin(event: Event) {
  event.preventDefault()
  if (isSubmitting.value) return

  submitClicked.value = true
  // Per field, so a filled username is not flagged for an empty password.
  errors.value = {
    ...(usernameFilled.value ? {} : { username: requiredMessage(FIELD_LABELS.username()) }),
    ...(passwordFilled.value ? {} : { password: requiredMessage(FIELD_LABELS.password()) }),
  }
  if (!isValid.value) return

  isSubmitting.value = true
  const loader = $loading.show()

  try {
    await authStore.login(credentials.value.username, credentials.value.password)
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
