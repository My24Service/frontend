<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2>{{ $trans('Reset password') }}</h2>
        <b-row>
          <b-col cols="12" role="group">
            <ValidatedFormField
              id="email"
              :label="$trans('E-mail')"
              v-model="email"
              autofocus
              :error="errors.email"
              :submitted="submitClicked"
            />
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
import { accountsSendResetPasswordLinkCreateMutation } from '@/api/@tanstack/vue-query.gen'
import ValidatedFormField from '@/features/forms/ValidatedFormField.vue'
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
