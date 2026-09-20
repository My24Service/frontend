<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2>{{ $trans('Reset password') }}</h2>
        <ValidatedForm
          name="send-reset-link"
          v-model="values"
          :errors="errors"
          :messages="SEND_RESET_LINK_FIELD_MESSAGES"
          :labels="SEND_RESET_LINK_FIELD_LABELS"
          :submitted="submitClicked"
        >
          <b-row>
            <b-col cols="12" role="group">
              <ValidatedFormField
                name="email"
                id="email"
                autofocus
              />
            </b-col>
          </b-row>
        </ValidatedForm>

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
import ValidatedForm from '@/features/forms/ValidatedForm.vue'
import ValidatedFormField from '@/features/forms/ValidatedFormField.vue'
import { errorToast, infoToast, $trans } from '@/services/i18n'

import {
  parseSendResetLink,
  SEND_RESET_LINK_FIELD_LABELS,
  SEND_RESET_LINK_FIELD_MESSAGES,
  validateSendResetLink,
  type SendResetLinkErrors,
  type SendResetLinkValues,
} from './schemas'

const router = useRouter()
const { create } = useToast()

const values = ref<SendResetLinkValues>({ email: '' })
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

  const found = validateSendResetLink(values.value)
  errors.value = found
  if (Object.keys(found).length > 0) return

  try {
    await sendLinkMutation.mutateAsync({ body: parseSendResetLink(values.value) })
    infoToast(create, $trans('Reset link sent'), $trans('Password reset link has been sent'))
    router.go(-1)
  } catch (error) {
    errorToast(create, $trans('Something went wrong, please try again'))
  }
}
</script>

<style scoped>
</style>
