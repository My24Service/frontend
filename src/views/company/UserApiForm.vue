<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New API user') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit API user') }}</h2>
        <b-row>
          <b-col cols="8" role="group">
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
          </b-col>
          <b-col cols="2" role="group">
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
          </b-col>
          <b-col cols="2" role="group">
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
import {useVuelidate} from '@vuelidate/core'
import {required} from '@vuelidate/validators'
import moment from 'moment'

import apiUserModel from '../../models/company/UserApi.js'

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
    return {
      apiuser: {
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
  },
  data () {
    return {
      isLoading: false,
      submitClicked: false,
      buttonDisabled: false,
      apiuser: apiUserModel.getFields(),
      errorMessage: null,
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
      this.apiuser = apiUserModel.getFields()
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
          await apiUserModel.insert(this.apiuser)
          this.infoToast(this.$trans('Created'), this.$trans('API user has been created'))
          this.isLoading = false
          this.cancelForm()
        } catch(error) {
          this.errorToast(this.$trans('Error creating API user'))
          this.isLoading = false
        }

        return
      }


      try {
        await apiUserModel.update(this.pk, this.customeruser)
        this.infoToast(this.$trans('Updated'), this.$trans('API user has been updated'))
        this.isLoading = false
        this.cancelForm()
      } catch(error) {
        this.errorToast(this.$trans('Error updating API user'))
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.apiuser = await apiUserModel.detail(this.pk)
        this.apiuser.api_user.expire_start_dt = this.$moment(this.apiuser.api_user.expire_start_dt, 'DD/MM/YYYY hh:mm:ss').toDate()
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
