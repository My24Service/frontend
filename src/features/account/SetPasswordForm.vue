<template>
  <b-form>
    <h2>{{ $trans('Reset password') }}</h2>
    <b-row>
      <b-col cols="6" role="group">
        <BFormGroup
          label-size="sm"
          v-bind:label="$trans('Password')"
          label-for="password1"
        >
          <BFormInput
            v-model="password1"
            id="password1"
            size="sm"
            type='password'
            :autofocus="true"
            :state="submitClicked ? !errors.password1 : null"
          ></BFormInput>
          <password-meter :password="password1" />
          <b-form-invalid-feedback
            :state="submitClicked ? !errors.password1 : null">
            {{ errors.password1 }}
          </b-form-invalid-feedback>
        </BFormGroup>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="6" role="group">
        <BFormGroup
          label-size="sm"
          v-bind:label="$trans('Password again')"
          label-for="password2"
        >
          <BFormInput
            v-model="password2"
            id="password2"
            size="sm"
            type='password'
            :state="submitClicked ? !errors.password2 : null"
          ></BFormInput>
          <b-form-invalid-feedback
            :state="submitClicked ? !errors.password2 : null">
            {{ errors.password2 }}
          </b-form-invalid-feedback>
        </BFormGroup>
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
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'
import PasswordMeter from 'vue-simple-password-meter'

import { accountsResetPasswordCreateMutation } from '@/api/@tanstack/vue-query.gen'
import { errorToast, infoToast, $trans } from '@/utils'

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
