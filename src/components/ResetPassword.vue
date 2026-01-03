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
            autofocus
            @blur="v$.password1.$touch()"
            :state="isSubmitClicked ? !v$.password1.$error : null"
          ></BFormInput>
          <password v-model="password1" :strength-meter-only="true"/>
          <b-form-invalid-feedback
            :state="isSubmitClicked ? !v$.password1.$error : null">
            {{ $trans('Please enter a password') }}
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
            @blur="v$.password2.$touch()"
            :state="isSubmitClicked ? !v$.password2.$error : null"
          ></BFormInput>
          <b-form-invalid-feedback
            :state="isSubmitClicked ? v$.password2.sameAs : null">
            {{ $trans('Passwords do not match') }}
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

<script>
import { useVuelidate } from '@vuelidate/core'
import { required, sameAs } from '@vuelidate/validators'
import Password from 'vue-password-strength-meter'

import {AccountService} from '@/models/account/Account'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

export default {
  setup() {
    const {create} = useToast()
    return {
      v$: useVuelidate(),
      create
    }
  },
  components: {
    Password,
  },
  data() {
    return {
      password1: null,
      password2: null,
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      accountService: new AccountService()
    }
  },
  validations() {
    return {
      password1: {
        required
      },
      password2: {
        required,
        sameAs: sameAs(this.password1)
      }

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
        const result = await this.accountService.resetPassword(this.password1)
        infoToast(this.create, $trans('Password reset'), $trans('Reset password successful'))

        this.buttonDisabled = false
        this.isLoading = false
        this.$router.push({path: '/'})
      } catch(error) {
        errorToast(this.create, $trans('Something went wrong, please try again'))

        this.buttonDisabled = false
        this.isLoading = false
      }
    },
  }
}
</script>

<style scoped>
</style>
