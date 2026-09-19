<template>
  <b-form>
    <h2>{{ $trans('Reset password') }}</h2>
    <b-row>
      <b-col cols="6" role="group">
        <ValidatedFormField
          id="password1"
          :label="$trans('Password')"
          v-model="password1"
          type="password"
          autofocus
          :error="errors.password1"
          :submitted="submitClicked"
        >
          <password-meter :password="password1" />
        </ValidatedFormField>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="6" role="group">
        <ValidatedFormField
          id="password2"
          :label="$trans('Password again')"
          v-model="password2"
          type="password"
          :error="errors.password2"
          :submitted="submitClicked"
        />
      </b-col>
    </b-row>

    <div class="mx-auto">
      <footer class="modal-footer">
        <BButton @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
          {{ $trans('Reset password') }}
        </BButton>
      </footer>
    </div>
  </b-form>
</template>

<script lang="ts" setup>
import PasswordMeter from 'vue-simple-password-meter'

import { accountsResetPasswordCreateMutation } from '@/api/@tanstack/vue-query.gen'
import ValidatedFormField from '@/features/forms/ValidatedFormField.vue'
import { errorToast, infoToast, $trans } from '@/services/i18n'

import { readLinkParams } from './link-params'
import {
  parseSetPassword,
  validateSetPassword,
  type SetPasswordErrors,
} from './schemas'

const route = useRoute()
const router = useRouter()
const { create } = useToast()

const password1 = ref('')
const password2 = ref('')
const errors = ref<SetPasswordErrors>({})
const submitClicked = ref(false)

const resetMutation = useMutation({
  ...accountsResetPasswordCreateMutation(),
})

const buttonDisabled = computed(() => resetMutation.isPending.value)

async function submitForm() {
  if (resetMutation.isPending.value) return

  submitClicked.value = true

  const found = validateSetPassword({ password1: password1.value, password2: password2.value })
  errors.value = found
  if (Object.keys(found).length > 0) return

  const link = readLinkParams(route.query as Record<string, unknown>)
  if (!link) {
    errorToast(create, $trans('Something went wrong, please try again'))
    return
  }

  try {
    await resetMutation.mutateAsync({ body: parseSetPassword(link, password1.value) })
    infoToast(create, $trans('Password reset'), $trans('Reset password successful'))
    router.push({ path: '/' })
  } catch (error) {
    errorToast(create, $trans('Something went wrong, please try again'))
  }
}
</script>

<style scoped>
</style>
