<template>
  <b-form>
    <h2>{{ $trans('Reset password') }}</h2>
    <b-row>
      <b-col cols="6" role="group">
        <b-form-group
          label-size="sm"
          v-bind:label="$trans('Password')"
          label-for="password1"
        >
          <b-form-input
            v-model="password1"
            id="password1"
            size="sm"
            type='password'
            autofocus
            @blur="v$.password1.$touch()"
            :state="isSubmitClicked ? !v$.password1.$error : null"
          ></b-form-input>
          <password v-model="password1" :strength-meter-only="true"/>
          <b-form-invalid-feedback
            :state="isSubmitClicked ? !v$.password1.$error : null">
            {{ $trans('Please enter a password') }}
          </b-form-invalid-feedback>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="6" role="group">
        <b-form-group
          label-size="sm"
          v-bind:label="$trans('Password again')"
          label-for="password2"
        >
          <b-form-input
            v-model="password2"
            id="password2"
            size="sm"
            type='password'
            @blur="v$.password2.$touch()"
            :state="isSubmitClicked ? !v$.password2.$error : null"
          ></b-form-input>
          <b-form-invalid-feedback
            :state="isSubmitClicked ? v$.password2.sameAs : null">
            {{ $trans('Passwords do not match') }}
          </b-form-invalid-feedback>
        </b-form-group>
      </b-col>
    </b-row>

    <div class="mx-auto">
      <footer class="modal-footer">
        <b-button @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
          {{ $trans('Reset password') }}
        </b-button>
      </footer>
    </div>
  </b-form>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required, sameAs } from '@vuelidate/validators'
import Password from 'vue-password-strength-meter'

import accountModel from '../models/account/Account.js'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
const {create} = useToast()

export default {
  setup() {
    return { v$: useVuelidate() }
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
        const result = await accountModel.resetPassword(this.password1)
        infoToast(create, $trans('Password reset'), $trans('Reset password successful'))

        this.buttonDisabled = false
        this.isLoading = false
        this.$router.push({path: '/'})
      } catch(error) {
        errorToast(create, $trans('Something went wrong, please try again'))

        this.buttonDisabled = false
        this.isLoading = false
      }
    },
  }
}
</script>

<style scoped>
</style>
