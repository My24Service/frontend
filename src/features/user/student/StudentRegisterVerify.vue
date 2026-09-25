<template>
  <div class="register">
    <div v-if="phase === 'verify-failed'">
      <h3>{{ $trans('Error verifying') }}</h3>
      <p>{{ $trans('An error occurred when verifying') }}</p>
    </div>
    <div v-if="phase === 'verified'">
      <h3>{{ $trans('Verify success') }}</h3>
      <p>{{ $trans('Your account is now verified. Next you have to set your password') }}</p>
      <p>
        <BButton @click="sendResetPasswordLink" :disabled="isSending" type="button" variant="primary">
          {{ $trans('Send reset password link') }}
        </BButton>
      </p>
    </div>
    <div v-if="phase === 'link-sent'">
      <h3>{{ $trans('Email sent') }}</h3>
      <p>{{ $trans('An email is sent to reset your password') }}</p>
    </div>
    <div v-if="phase === 'link-failed'">
      <h3>{{ $trans('Error sending email') }}</h3>
      <p>{{ $trans('An error occurred when sending the password reset link email') }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>

import { readLinkParams } from '@/features/account'
/**
 * The activation link a registrant follows from their email: verify the
 * signed params on arrival, then let them ask for the link that sets their
 * first password. One phase at a time — the legacy screen tracked the same
 * flow across five booleans.
 */
type Phase = 'verifying' | 'verified' | 'verify-failed' | 'link-sent' | 'link-failed'

const route = useRoute()
const { create } = useToast()

const phase = ref<Phase>('verifying')

// A bad link never reaches the network. Same fail-fast as the shared
// set-password form.
const link = readLinkParams(route.query)

const verifyMutation = useMutation(Api.AccountsVerifyRegistration.create.mutation())
const sendLinkMutation = useMutation(Api.AccountsSendResetPasswordLink.create.mutation())

const isSending = computed(() => sendLinkMutation.isPending.value)

async function verify() {
  if (!link) {
    errorToast(create, $trans('Error verifying'))
    phase.value = 'verify-failed'
    return
  }
  try {
    await verifyMutation.mutateAsync({ body: link })
    infoToast(create, $trans('Verified'), $trans('Account has been verified'))
    phase.value = 'verified'
  } catch (error) {
    console.log('Error verifying studentuser', error)
    errorToast(create, $trans('Error verifying'))
    phase.value = 'verify-failed'
  }
}

async function sendResetPasswordLink() {
  if (!link || sendLinkMutation.isPending.value) return
  try {
    await sendLinkMutation.mutateAsync({
      body: { user_id: link.user_id, isRegistration: true },
    })
    infoToast(create, $trans('Sent'), $trans('Password reset link sent'))
    phase.value = 'link-sent'
  } catch (error) {
    console.log('Error sending password reset link', error)
    errorToast(create, $trans('Error sending password reset link'))
    phase.value = 'link-failed'
  }
}

verify()
</script>

<style scoped>
.register {
  padding-top: 68px;
}
</style>
