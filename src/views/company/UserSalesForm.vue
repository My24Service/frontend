<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <b-icon icon="people"></b-icon>
            <span class="backlink"  @click="cancelForm">{{ $trans("People") }}</span> /
            <strong> {{ salesuser.username }}</strong>
            <span class="dimmed" v-if="isCreate && !salesuser.username">{{ $trans('new') }}</span>
            <span class="dimmed" v-if="!isCreate && !salesuser.username">{{ $trans('edit') }}</span>
          </h3>
          <div class='flex-columns'>
            <b-button @click="cancelForm" type="button" variant="secondary" class="outline">
              {{ $trans('Cancel') }}</b-button>
            <b-button @click="preSubmitForm" :disabled="buttonDisabled" type="button" variant="primary">
              {{ $trans('Submit') }}</b-button>
        </div>
        </div>
      </header>

      <div class="page-detail">
        <div class='flex-columns'>
          <div class="panel">
              <h6>{{ $trans('User info')}}</h6>
              <b-form-group
                label-cols="4"
                v-bind:label="$trans('Username')"
                label-for="salesuser_username"
              >
                <b-form-input
                  id="salesuser_username"
                  size="sm"
                  v-model="salesuser.username"
                  :state="isSubmitClicked ? !v$.salesuser.username.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  v-if="salesuser.username === ''"
                  :state="isSubmitClicked ? v$.salesuser.username.required : null">
                  {{ $trans('Username is required') }}
                </b-form-invalid-feedback>
                <b-form-invalid-feedback
                  v-if="salesuser.username !== '' && salesuser.username !== orgUsername"
                  :state="isSubmitClicked ? !v$.salesuser.username.isUnique.$invalid : null">
                  {{ $trans('Username is already in use') }}
                </b-form-invalid-feedback>
              </b-form-group>


              <b-form-group
                label-cols="4"
                v-bind:label="$trans('Password')"
                label-for="salesuser_password"
              >
                <b-form-input
                  id="salesuser_password"
                  size="sm"
                  type="password"
                  v-model="salesuser.password1"
                  @blur="v$.salesuser.password1.$touch()"
                  :state="isSubmitClicked && v$.salesuser.password1 ? !v$.salesuser.password1.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked && v$.salesuser.password1 ? !v$.salesuser.password1.$error : null">
                  {{ $trans('Please enter a password') }}
                </b-form-invalid-feedback>
              </b-form-group>


              <b-form-group

                label-cols="4"
                v-bind:label="$trans('Confirm password')"
                label-for="salesuser_password_again"
              >
                <b-form-input
                  id="salesuser_password_again"
                  size="sm"
                  type="password"
                  v-model="salesuser.password2"
                  @blur="v$.salesuser.password2.$touch()"
                  :state="isSubmitClicked ? !v$.salesuser.password2.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  v-if="salesuser.password2 !== '' && salesuser.password2"
                  :state="isSubmitClicked ? !v$.salesuser.password2.sameAs.$invalid : null">
                  {{ $trans('Passwords do not match') }}
                </b-form-invalid-feedback>
              </b-form-group>

          </div>

          <div class="panel">
              <h6>{{ $trans('Personal details')}}</h6>
              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('First name')"
                label-for="salesuser_first_name"
              >
                <b-form-input
                  id="salesuser_first_name"
                  size="sm"
                  v-model="salesuser.first_name"
                  :state="isSubmitClicked ? !v$.salesuser.first_name.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.salesuser.first_name.$error : null">
                  {{ $trans('Please enter a first name') }}
                </b-form-invalid-feedback>
              </b-form-group>

              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Last name')"
                label-for="salesuser_last_name"
              >
                <b-form-input
                  id="salesuser_last_name"
                  size="sm"
                  v-model="salesuser.last_name"
                  :state="isSubmitClicked ? !v$.salesuser.last_name.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.salesuser.last_name.$error : null">
                  {{ $trans('Please enter a last name') }}
                </b-form-invalid-feedback>
              </b-form-group>

              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Email address')"
                label-for="salesuser_email"
              >
                <b-form-input
                  id="salesuser_email"
                  size="sm"
                  v-model="salesuser.email"
                  :state="isSubmitClicked ? !v$.salesuser.email.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.salesuser.email.$error : null">
                  {{ $trans('Please enter a valid email address') }}
                </b-form-invalid-feedback>
              </b-form-group>

          </div>

          <div class="panel">
              <h6>{{ $trans('Contract')}} &amp; {{  $trans('Time registration') }} </h6>
              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Contract hours per week')"
                label-for="sales_user_contract_hours_week"
              >
                <b-form-input
                  id="sales_user_contract_hours_week"
                  size="sm"
                  v-model="salesuser.sales_user.contract_hours_week"
                ></b-form-input>
              </b-form-group>

              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Uses time registration')"
                label-for="sales_user_uses_time_registration"
              >
                <b-form-checkbox
                  id="sales_user_uses_time_registration"
                  size="sm"
                  v-model="salesuser.sales_user.uses_time_registration"
                >
                </b-form-checkbox>
              </b-form-group>

          </div>
        </div>

      </div>
    </div>
  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required, sameAs, email } from '@vuelidate/validators'
import { helpers } from '@vuelidate/validators'

import { usernameExists } from '@/models/helpers.js'
import salesUserModel from '@/models/company/UserSales.js'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
const {create} = useToast()

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  validations() {
    let validations = {
      salesuser: {
        first_name: {
          required
        },
        last_name: {
          required,
        },
        email: {
          required,
          email
        },
        password1: {},
        password2: {},
      }
    }

    if (this.isCreate) {
      const isUniqueCreate = (value) => {
        if (value === '') return true

        return usernameExists(value)
      }

      validations.salesuser.username = {
        required,
        isUnique: helpers.withAsync(isUniqueCreate)
      }

      validations.salesuser.password1 = {
        required
      }

      validations.salesuser.password2 = {
        required,
        sameAs: sameAs(this.salesuser.password1)
      }
    } else {
      const isUniqueEdit = (value) => {
        if (this.orgUsername === value || value === '' || value.length < 3) {
          return true
        }

        return helpers.withAsync(usernameExists(value))
      }

      validations.salesuser.username = {
        required,
        isUnique: isUniqueEdit
      }

      validations.salesuser.password1 = {
      }

      validations.salesuser.password2 = {
        sameAs: sameAs(this.salesuser.password1)
      }
    }

    return validations
  },
  data () {
    return {
      isLoading: false,
      submitClicked: false,
      buttonDisabled: false,
      salesuser: salesUserModel.getFields(),
      orgUsername: null,
    }
  },
  computed: {
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  async created() {
    if (!this.isCreate) {
      await this.loadData()
    } else {
      this.salesuser = salesUserModel.getFields()
    }
    this.isLoading = false
  },
  methods: {
    preSubmitForm() {
      this.buttonDisabled = true
      this.submitClicked = true
      this.v$.$reset()
      this.v$.$touch()

      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        this.buttonDisabled = false
        return
      }

      setTimeout(() => {
        this.submitForm()
      }, 1000)
    },
    async submitForm() {
      this.isLoading = true

      if (this.isCreate) {
        this.salesuser.password = this.salesuser.password1
        try {
          await salesUserModel.insert(this.salesuser)
          infoToast(create, $trans('Created'), $trans('sales user has been created'))
          this.isLoading = false
          this.cancelForm()
        } catch(error) {
          console.log('Error creating sales user', error)
          errorToast(create, $trans('Error creating sales user'))
          this.isLoading = false
          this.buttonDisabled = false
        }

        return
      }

      try {
        delete this.salesuser.date_joined
        delete this.salesuser.last_login

        if (this.salesuser.password1) {
          this.salesuser.password = this.salesuser.password1
        } else {
          delete this.salesuser.password
        }

        await salesUserModel.update(this.pk, this.salesuser)
        infoToast(create, $trans('Updated'), $trans('sales user has been updated'))
        this.isLoading = false
        this.cancelForm()
      } catch(error) {
        console.log('Error updating sales user', error)
        errorToast(create, $trans('Error updating sales user'))
        this.isLoading = false
        this.buttonDisabled = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.salesuser = await salesUserModel.detail(this.pk)
        this.orgUsername = this.salesuser.username
        this.isLoading = false
      } catch(error) {
        console.log('error fetching salesuser', error)
        errorToast(create, $trans('Error loading sales user'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
