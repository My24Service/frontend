<template>
  <b-form>
    <h2>{{ $trans('Reset password') }}</h2>
    <ValidatedForm
      name="set-password"
      v-model="values"
      :errors="errors"
      :messages="SET_PASSWORD_FIELD_MESSAGES"
      :labels="SET_PASSWORD_FIELD_LABELS"
      :submitted="submitClicked"
    >
      <b-row>
        <b-col cols="6" role="group">
          <ValidatedFormField
            name="password1"
            id="password1"
            type="password"
            autofocus
          >
            <password-meter :password="values.password1" />
          </ValidatedFormField>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="6" role="group">
          <ValidatedFormField
            name="password2"
            id="password2"
            type="password"
          />
        </b-col>
      </b-row>
    </ValidatedForm>

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
import { ValidatedForm } from '@/features/forms'
import { ValidatedFormField } from '@/features/forms'
import { errorToast, infoToast, $trans } from '@/services/i18n'

import { readLinkParams } from './link-params'
import {
  parseSetPassword,
  SET_PASSWORD_FIELD_LABELS,
  SET_PASSWORD_FIELD_MESSAGES,
  validateSetPassword,
  type SetPasswordErrors,
  type SetPasswordValues,
} from './schemas'

const route = useRoute()
const router = useRouter()
const { create } = useToast()

const values = ref<SetPasswordValues>({ password1: '', password2: '' })
const errors = ref<SetPasswordErrors>({})
const submitClicked = ref(false)

const resetMutation = useMutation({
  ...accountsResetPasswordCreateMutation(),
})

const buttonDisabled = computed(() => resetMutation.isPending.value)

async function submitForm() {
  if (resetMutation.isPending.value) return

  submitClicked.value = true

  const found = validateSetPassword(values.value)
  errors.value = found
  if (Object.keys(found).length > 0) return

  const link = readLinkParams(route.query as Record<string, unknown>)
  if (!link) {
    errorToast(create, $trans('Something went wrong, please try again'))
    return
  }

  try {
    await resetMutation.mutateAsync({ body: parseSetPassword(link, values.value.password1) })
    infoToast(create, $trans('Password reset'), $trans('Reset password successful'))
    router.push({ path: '/' })
  } catch (error) {
    errorToast(create, $trans('Something went wrong, please try again'))
  }
}
</script>

<style scoped>
</style>
