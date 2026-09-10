<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2>{{ $trans('Reset password') }}</h2>
        <b-row>
          <b-col cols="12" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('E-mail')"
              label-for="email"
            >
              <BFormInput
                v-model="email"
                id="email"
                size="sm"
                autofocus
                :state="submitClicked ? !errors.email : null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="submitClicked ? !errors.email : null">
                {{ errors.email }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
        </b-row>

        <div class="mx-auto">
          <footer class="modal-footer">
            <BButton @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Send reset link') }}
            </BButton>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

import { accountsSendResetPasswordLinkCreateMutation } from '@/api/@tanstack/vue-query.gen'
import { errorToast, infoToast, $trans } from '@/services/i18n'

import {
  parseSendResetLink,
  validateSendResetLink,
  type SendResetLinkErrors,
} from './schemas'

const router = useRouter()
const { create } = useToast()

const email = ref('')
const errors = ref<SendResetLinkErrors>({})
const submitClicked = ref(false)

const sendLinkMutation = useMutation({
  ...accountsSendResetPasswordLinkCreateMutation(),
})

const isLoading = computed(() => sendLinkMutation.isPending.value)
const buttonDisabled = computed(() => sendLinkMutation.isPending.value)

async function submitForm() {
  if (sendLinkMutation.isPending.value) return

  submitClicked.value = true

  const found = validateSendResetLink({ email: email.value })
  errors.value = found
  if (Object.keys(found).length > 0) return

  try {
    await sendLinkMutation.mutateAsync({ body: parseSendResetLink({ email: email.value }) })
    infoToast(create, $trans('Reset link sent'), $trans('Password reset link has been sent'))
    router.go(-1)
  } catch (error) {
    errorToast(create, $trans('Something went wrong, please try again'))
  }
}
</script>

<style scoped>
</style>
