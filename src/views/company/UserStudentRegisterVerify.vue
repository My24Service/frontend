<template>
  <div class="register">
    <div v-if="verifyError">
      <h3>{{ $trans('Error verifying') }}</h3>
      <p>{{ $trans('An error occurred when verifying') }}</p>
    </div>
    <div v-if="verifySuccess && !sendPasswordResetClicked">
      <h3>{{ $trans('Verify success') }}</h3>
      <p>{{ $trans('Your account is now verified. Next you have to set your password') }}</p>
      <p>
        <b-button @click="sendResetPasswordLink" type="button" variant="primary">
          {{ $trans('Send reset password link') }}
        </b-button>
      </p>
    </div>
    <div v-if="passwordLinkSent && sendPasswordResetClicked">
      <h3>{{ $trans('Email sent') }}</h3>
      <p>{{ $trans('An email is sent to reset your password') }}</p>
    </div>
    <div v-if="sendPasswordResetError">
      <h3>{{ $trans('Error sending email') }}</h3>
      <p>{{ $trans('An error occurred when sending the password reset link email') }}</p>
    </div>
  </div>
</template>

<script>
import accountModel from '../../models/account/Account.js'
import my24 from "../../services/my24";

export default {
  name: "UserStudentVerify",
  data () {
    return {
      verifySuccess: false,
      verifyError: false,
      sendPasswordResetError: false,
      sendPasswordResetClicked: false,
      passwordLinkSent: false,
      params: {}
    }
  },
  methods: {
    async sendResetPasswordLink() {
      this.sendPasswordResetClicked = true
      try {
        await accountModel.sendResetPasswordLink(this.params.user_id, true)
        this.passwordLinkSent = true
        this.infoToast(this.$trans('Sent'), this.$trans('Password reset link sent'))
      } catch (e) {
        console.log('Error sending password reset link', e)
        this.errorToast(this.$trans('Error sending password reset link'))
        this.sendPasswordResetError = true
      }
    },
    async doVerify() {
      try {
        const result = await accountModel.verify(this.params)
        console.log('HOI')
        this.verifySuccess = true
        this.infoToast(this.$trans('Verified'), this.$trans('Account has been verified'))
      } catch (e) {
        console.log('Error verifying studentuser', e)
        this.errorToast(this.$trans('Error verifying'))
        this.verifyError = true
      }
    }
  },
  async created() {
    this.params = {
      user_id: my24.getParameterByName('user_id'),
      timestamp: my24.getParameterByName('timestamp'),
      signature: my24.getParameterByName('signature'),
    }

    await this.doVerify()
  }
}
</script>
<style scoped>
.register {
  padding-top: 68px;
}
</style>
