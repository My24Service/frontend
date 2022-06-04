<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New planning user') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit planning user') }}</h2>
        <b-row>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Username')"
              label-for="planninguser_username"
            >
              <b-form-input
                id="planninguser_username"
                size="sm"
                v-model="planninguser.username"
                :state="isSubmitClicked ? !v$.planninguser.username.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                v-if="planninguser.username === ''"
                :state="isSubmitClicked ? v$.planninguser.username.required : null">
                {{ $trans('Username is required') }}
              </b-form-invalid-feedback>
              <b-form-invalid-feedback
                v-if="planninguser.username !== ''"
                :state="isSubmitClicked ? !v$.planninguser.username.isUnique.$invalid : null">
                {{ $trans('Username is already in use') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Password')"
              label-for="planninguser_password"
            >
              <b-form-input
                id="planninguser_password"
                size="sm"
                type="password"
                v-model="planninguser.password1"
                @blur="v$.planninguser.password1.$touch()"
                :state="isSubmitClicked && v$.planninguser.password1 ? !v$.planninguser.password1.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked && v$.planninguser.password1 ? !v$.planninguser.password1.$error : null">
                {{ $trans('Please enter a password') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Password again')"
              label-for="planninguser_password_again"
            >
              <b-form-input
                id="planninguser_password_again"
                size="sm"
                type="password"
                v-model="planninguser.password2"
                @blur="v$.planninguser.password2.$touch()"
                :state="isSubmitClicked ? !v$.planninguser.password2.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.planninguser.password2.sameAs.$invalid : null">
                {{ $trans('Passwords do not match') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('First name')"
              label-for="planninguser_first_name"
            >
              <b-form-input
                id="planninguser_first_name"
                size="sm"
                v-model="planninguser.first_name"
                :state="isSubmitClicked ? !v$.planninguser.first_name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.planninguser.first_name.$error : null">
                {{ $trans('Please enter a first name') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Last name')"
              label-for="planninguser_last_name"
            >
              <b-form-input
                id="planninguser_last_name"
                size="sm"
                v-model="planninguser.last_name"
                :state="isSubmitClicked ? !v$.planninguser.last_name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.planninguser.last_name.$error : null">
                {{ $trans('Please enter a last name') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Email')"
              label-for="planninguser_email"
            >
              <b-form-input
                id="planninguser_email"
                size="sm"
                v-model="planninguser.email"
                :state="isSubmitClicked ? !v$.planninguser.email.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.planninguser.email.$error : null">
                {{ $trans('Please enter a valid email') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="cancelForm" type="button" variant="secondary">
              {{ $trans('Cancel') }}</b-button>
            <b-button @click="preSubmitForm" :disabled="buttonDisabled" type="button" variant="primary">
              {{ $trans('Submit') }}</b-button>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required, sameAs, email } from '@vuelidate/validators'
import { helpers } from '@vuelidate/validators'

import { usernameExists } from '@/models/helpers.js'
import planningUserModel from '@/models/company/UserPlanning.js'

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
      planninguser: {
        username: {
          required
        },
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

      validations.planninguser.username = {
        required,
        isUnique: helpers.withAsync(isUniqueCreate)
      }

      validations.planninguser.password1 = {
        required
      }

      validations.planninguser.password2 = {
        required,
        sameAs: sameAs(this.planninguser.password1)
      }
    } else {
      const isUniqueEdit = (value) => {
        if (this.orgUsername === value || value === '' || value.length < 3) {
          return true
        }

        return helpers.withAsync(usernameExists(value))
      }

      validations.planninguser.username = {
        required,
        isUnique: isUniqueEdit
      }

      validations.planninguser.password1 = {
      }

      validations.planninguser.password2 = {
        sameAs: sameAs(this.planninguser.password1)
      }
    }

    return validations
  },
  data () {
    return {
      isLoading: false,
      submitClicked: false,
      buttonDisabled: false,
      planninguser: planningUserModel.getFields(),
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
      this.planninguser = planningUserModel.getFields()
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
        this.submitClicked = false
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
        this.planninguser.password = this.planninguser.password1
        try {
          await planningUserModel.insert(this.planninguser)
          this.infoToast(this.$trans('Created'), this.$trans('planning user has been created'))
          this.isLoading = false
          this.cancelForm()
        } catch(error) {
          this.errorToast(this.$trans('Error creating planning user'))
          this.isLoading = false
        }

        return
      }

      delete this.planninguser.date_joined
      delete this.planninguser.last_login

      if (this.planninguser.password1) {
        this.planninguser.password = this.planninguser.password1
      } else {
        delete this.planninguser.password
      }

      try {
        await planningUserModel.update(this.pk, this.planninguser)
        this.infoToast(this.$trans('Updated'), this.$trans('planning user has been updated'))
        this.isLoading = false
        this.cancelForm()
      } catch(error) {
        this.errorToast(this.$trans('Error updating planning user'))
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.planninguser  = await planningUserModel.detail(this.pk)
        this.orgUsername = this.planninguser.username
        this.isLoading = false
      } catch(error) {
        console.log('error fetching planninguser', error)
        this.errorToast(this.$trans('Error loading planning user'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
