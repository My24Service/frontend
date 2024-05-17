<template>
  <div class="app-page" v-if="apiuser && !isLoading">
    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="people"></b-icon>
          <span class="backlink"  @click="cancelForm">{{ $trans("People") }}</span> /
          <strong> {{ apiuser.username }}</strong>
          <span class="dimmed" v-if="isCreate && !apiuser.username">{{ $trans('new') }}</span>
          <span class="dimmed" v-if="!isCreate && !apiuser.username">{{ $trans('edit') }}</span>
        </h3>
        <div class='flex-columns'>
          <b-button @click="cancelForm" type="button" variant="secondary" class="outline">
            {{ $trans('Cancel') }}</b-button>
          <b-button @click="preSubmitForm" :disabled="buttonDisabled" type="button" variant="primary">
            {{ $trans('Submit') }}</b-button>
        </div>
      </div>
    </header>
    <form class="page-detail">
      <div class="flex-columns">
        <div class="panel col-1-3">
          <h6>{{ $trans('User info')}}</h6>

          <b-form-group
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Username')"
            label-for="apiuser_username"
          >
            <b-form-input
              id="apiuser_username"
              size="sm"
              v-model="apiuser.username"
              :state="isSubmitClicked ? !v$.apiuser.username.$error : null"
            ></b-form-input>
            <b-form-invalid-feedback
              v-if="apiuser.username === ''"
              :state="isSubmitClicked ? v$.apiuser.username.required : null">
              {{ $trans('Username is required') }}
            </b-form-invalid-feedback>
            <b-form-invalid-feedback
              v-if="apiuser.username !== '' && apiuser.username !== orgUsername"
              :state="isSubmitClicked ? !v$.apiuser.username.isUnique.$invalid : null">
              {{ $trans('Username is already in use') }}
            </b-form-invalid-feedback>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Password')"
            label-for="apiuser_password"
          >
            <b-form-input
              id="apiuser_password"
              size="sm"
              type="password"
              v-model="apiuser.password1"
              @blur="v$.apiuser.password1.$touch()"
              :state="isSubmitClicked && v$.apiuser.password1 ? !v$.apiuser.password1.$error : null"
            ></b-form-input>
            <b-form-invalid-feedback
              :state="isSubmitClicked && v$.apiuser.password1 ? !v$.apiuser.password1.$error : null">
              {{ $trans('Please enter a password') }}
            </b-form-invalid-feedback>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Password again')"
            label-for="apiuser_password_again"
          >
            <b-form-input
              id="apiuser_password_again"
              size="sm"
              type="password"
              v-model="apiuser.password2"
              @blur="v$.apiuser.password2.$touch()"
              :state="isSubmitClicked ? !v$.apiuser.password2.$error : null"
            ></b-form-input>
            <b-form-invalid-feedback
              v-if="apiuser.password2 !== '' && apiuser.password2"
              :state="isSubmitClicked ? !v$.apiuser.password2.sameAs.$invalid : null">
              {{ $trans('Passwords do not match') }}
            </b-form-invalid-feedback>
          </b-form-group>
        </div>

        <div class="panel col-1-3">
            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Name')"
              label-for="apiuser_name"
            >
              <b-form-input
                id="apiuser_name"
                size="sm"
                v-model="apiuser.api_user.name"
                :state="isSubmitClicked ? !v$.apiuser.api_user.name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? v$.apiuser.api_user.name.required : null">
                {{ $trans('Name is required') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              :label="$trans('Valid from')"
              label-for="expire_start_dt"
            >
              <b-form-datepicker
                id="expire_start_dt"
                size="sm"
                class="p-sm-0"
                v-model="apiuser.api_user.expire_start_dt"
                :placeholder="$trans('Choose a date')"
                value="apiuser.api_user.expire_start_dt"
                locale="nl"
                :state="isSubmitClicked ? !v$.apiuser.api_user.expire_start_dt.$error : null"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></b-form-datepicker>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.apiuser.api_user.expire_start_dt.$error : null">
                {{ $trans('Please enter date') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Expire in days')"
              label-for="apiuser_expire_in_days"
            >
              <b-form-input
                id="apiuser_expire_in_days"
                v-model="apiuser.api_user.expire_in_days"
                :state="isSubmitClicked ? !v$.apiuser.api_user.expire_in_days.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? v$.apiuser.api_user.expire_in_days.required : null">
                {{ $trans('Name is required') }}
              </b-form-invalid-feedback>
            </b-form-group>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import moment from 'moment/min/moment-with-locales'

import {useVuelidate} from '@vuelidate/core'
import {email, helpers, required, sameAs} from '@vuelidate/validators'

import {ApiUserService, ApiUserUserModel} from '@/models/company/UserApi'
import {usernameExists} from "@/models/helpers";

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  components: {
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  validations() {
    let validations = {
      apiuser: {
        username: {
          required
        },
        api_user: {
          name: {
            required
          },
          expire_start_dt: {
            required
          },
          expire_in_days: {
            required
          }
        }
      }
    }

    if (this.isCreate) {
      const isUniqueCreate = (value) => {
        if (value === '') return true

        return usernameExists(value)
      }

      validations.apiuser.username = {
        required,
        isUnique: helpers.withAsync(isUniqueCreate)
      }

      validations.apiuser.password1 = {
        required
      }

      validations.apiuser.password2 = {
        required,
        sameAs: sameAs(this.apiuser.password1)
      }
    } else {
      const isUniqueEdit = (value) => {
        if (this.orgUsername === value || value === '' || value.length < 3) {
          return true
        }

        return helpers.withAsync(usernameExists(value))
      }

      validations.apiuser.username = {
        required,
        isUnique: isUniqueEdit
      }

      validations.apiuser.password1 = {
      }

      validations.apiuser.password2 = {
        sameAs: sameAs(this.apiuser.password1)
      }
    }

    return validations
  },
  data () {
    return {
      isLoading: false,
      submitClicked: false,
      buttonDisabled: false,
      apiuser: new ApiUserUserModel({}),
      orgUsername: null,
      apiUserService: new ApiUserService()
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
    const lang = this.$store.getters.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)

    if (!this.isCreate) {
      await this.loadData()
    } else {
      this.apiuser = new ApiUserUserModel({})
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

      this.submitForm()
    },
    async submitForm() {
      this.isLoading = true

      if (this.isCreate) {
        try {
          this.apiuser.password = this.apiuser.password1
          await this.apiUserService.insert(this.apiuser)
          this.infoToast(this.$trans('Created'), this.$trans('API user has been created'))
          this.isLoading = false
          await this.$router.push({name: 'users-apiusers'})
        } catch(error) {
          this.errorToast(this.$trans('Error creating API user'))
          this.isLoading = false
          this.buttonDisabled = false
        }

        return
      }

      try {
        await this.apiUserService.update(this.pk, this.apiuser)
        this.infoToast(this.$trans('Updated'), this.$trans('API user has been updated'))
        this.isLoading = false
        await this.$router.push({name: 'users-apiusers'})
      } catch(error) {
        console.log(error)
        this.errorToast(this.$trans('Error updating API user'))
        this.isLoading = false
        this.buttonDisabled = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        const apiuser = await this.apiUserService.detail(this.pk)
        this.apiuser = new ApiUserUserModel(apiuser)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching apiuser', error)
        this.errorToast(this.$trans('Error loading API user'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
