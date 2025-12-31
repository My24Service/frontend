<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2>{{ $trans('Reset password') }}</h2>
        <b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('E-mail')"
              label-for="email"
            >
              <b-form-input
                v-model="email"
                id="email"
                size="sm"
                autofocus
                :state="isSubmitClicked ? !v$.email.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.email.$error : null">
                {{ $trans('Please enter an email') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Send reset link') }}
            </b-button>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import accountModel from '@/models/account/Account.js'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast} from "@/utils";
const {create} = useToast()

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  data() {
    return {
      email: null,
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
    }
  },
  validations() {
    return {
      email: {
        required,
      },
    }
  },
  computed: {
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  methods: {
    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()

      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid, this.v$)
        this.buttonDisabled = false
        this.isLoading = false
        return
      }

      this.buttonDisabled = true

      this.isLoading = true
      try {
        const result = await accountModel.sendResetPasswordLink(this.email)
        infoToast(create, this.$trans('Reset link sent'), this.$trans('Password reset link has been sent'))

        this.buttonDisabled = false
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        errorToast(create, this.$trans('Something went wrong, please try again'))

        this.buttonDisabled = false
        this.isLoading = false
      }
    },
  }
}
</script>

<style scoped>
</style>
