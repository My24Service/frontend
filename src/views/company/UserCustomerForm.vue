<template>
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <b-icon icon="people"></b-icon>
            <span class="backlink"  @click="cancelForm">{{ $trans("People") }}</span> /
            <strong> {{ customeruser.username }}</strong>
            <span class="dimmed" v-if="isCreate && !customeruser.username">{{ $trans('new') }}</span>
            <span class="dimmed" v-if="!isCreate && !customeruser.username">{{ $trans('edit') }}</span>
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
                label-for="customeruser_username"
              >
                <b-form-input
                  id="customeruser_username"
                  size="sm"
                  v-model="customeruser.username"
                  :state="isSubmitClicked ? !v$.customeruser.username.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  v-if="customeruser.username === ''"
                  :state="isSubmitClicked ? v$.customeruser.username.required : null">
                  {{ $trans('Username is required') }}
                </b-form-invalid-feedback>
                <b-form-invalid-feedback
                  v-if="customeruser.username !== '' && customeruser.username !== orgUsername"
                  :state="isSubmitClicked ? !v$.customeruser.username.isUnique.$invalid : null">
                  {{ $trans('Username is already in use') }}
                </b-form-invalid-feedback>
              </b-form-group>

              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Password')"
                label-for="customeruser_password"
              >
                <b-form-input
                  id="customeruser_password"
                  size="sm"
                  type="password"
                  v-model="customeruser.password1"
                  @blur="v$.customeruser.password1.$touch()"
                  :state="isSubmitClicked && v$.customeruser.password1 ? !v$.customeruser.password1.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked && v$.customeruser.password1 ? !v$.customeruser.password1.$error : null">
                  {{ $trans('Please enter a password') }}
                </b-form-invalid-feedback>
              </b-form-group>

              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Password again')"
                label-for="customeruser_password_again"
              >
                <b-form-input
                  id="customeruser_password_again"
                  size="sm"
                  type="password"
                  v-model="customeruser.password2"
                  @blur="v$.customeruser.password2.$touch()"
                  :state="isSubmitClicked ? !v$.customeruser.password2.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  v-if="customeruser.password2 !== '' && customeruser.password2"
                  :state="isSubmitClicked ? !v$.customeruser.password2.sameAs.$invalid : null">
                  {{ $trans('Passwords do not match') }}
                </b-form-invalid-feedback>
              </b-form-group>
          </div>

          <div class="panel col-1-3">
            <h6>{{ $trans('Personal details')}}</h6>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('First name')"
              label-for="customeruser_first_name"
            >
              <b-form-input
                id="customeruser_first_name"
                size="sm"
                v-model="customeruser.first_name"
                :state="isSubmitClicked ? !v$.customeruser.first_name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.customeruser.first_name.$error : null">
                {{ $trans('Please enter a first name') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Last name')"
              label-for="customeruser_last_name"
            >
              <b-form-input
                id="customeruser_last_name"
                size="sm"
                v-model="customeruser.last_name"
                :state="isSubmitClicked ? !v$.customeruser.last_name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.customeruser.last_name.$error : null">
                {{ $trans('Please enter a last name') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Email')"
              label-for="customeruser_email"
            >
              <b-form-input
                id="customeruser_email"
                size="sm"
                v-model="customeruser.email"
                :state="isSubmitClicked ? !v$.customeruser.email.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.customeruser.email.$error : null">
                {{ $trans('Please enter a valid email') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Settings group')"
              label-for="customeruser_settings_group"
            >
              <b-form-input
                id="customeruser_settings_group"
                size="sm"
                v-model="customeruser.customer_user.settings_group"
              ></b-form-input>
            </b-form-group>

          </div>
          <div class="panel col-1-3">
            <h6>{{  $trans('Customer') }}</h6>
            <div class='flex-columns'>
              <b-form-group
                label-size="sm"
                label=""
                label-for="customeruser_customer_search"
                class="inline"
              >
                <multiselect
                  id="customeruser_customer_search"
                  track-by="id"
                  :placeholder="$trans('Type to search customer')"
                  open-direction="bottom"
                  :options="customers"
                  :multiple="false"
                  :loading="isLoading"
                  :internal-search="false"
                  :clear-on-select="true"
                  :close-on-select="true"
                  :options-limit="30"
                  :limit="10"
                  :max-height="600"
                  :show-no-results="false"
                  :hide-selected="true"
                  @search-change="getCustomers"
                  @select="selectCustomer"
                  :custom-label="customerLabel"
                >
                  <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
                </multiselect>
              </b-form-group>
              <b-button @click="clearCustomer" size="sm" type="button" variant="danger" :title="$trans('Clear customer')">
                  <b-icon icon="backspace"></b-icon>
              </b-button>
            </div>

            <br>
            <b-form-group
              label-size="sm"
              label=""
              label-for="customeruser_customer"
            >
              <b-form-input
                id="customeruser_customer"
                size="sm"
                readonly
                v-model="customer_info"
              ></b-form-input>
            </b-form-group>
          </div>
        </div>
      </form>
    </div>
</template>

<style scoped>
.form-group.inline {
  margin-bottom: 0;
}
</style>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required, sameAs, email } from '@vuelidate/validators'
import { helpers } from '@vuelidate/validators'
import Multiselect from 'vue-multiselect'

import { usernameExists } from '@/models/helpers'
import customerUserModel from '../../models/company/UserCustomer.js'
import customerModel from '../../models/customer/Customer.js'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast} from "@/utils";
const {create} = useToast()

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  components: {
    Multiselect,
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  validations() {
    let validations = {
      customeruser: {
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
        }
      }
    }

    if (this.isCreate) {
      const isUniqueCreate = (value) => {
        if (value === '') return true

        return usernameExists(value)
      }

      validations.customeruser.username = {
        required,
        isUnique: helpers.withAsync(isUniqueCreate)
      }

      validations.customeruser.password1 = {
        required
      }

      validations.customeruser.password2 = {
        required,
        sameAs: sameAs(this.customeruser.password1)
      }
    } else {
      const isUniqueEdit = (value) => {
        if (this.orgUsername === value || value === '' || value.length < 3) {
          return true
        }

        return helpers.withAsync(usernameExists(value))
      }

      validations.customeruser.username = {
        required,
        isUnique: isUniqueEdit
      }

      validations.customeruser.password1 = {
      }

      validations.customeruser.password2 = {
        sameAs: sameAs(this.customeruser.password1)
      }
    }

    return validations
  },
  data () {
    return {
      isLoading: false,
      submitClicked: false,
      buttonDisabled: false,
      customeruser: customerUserModel.getFields(),
      errorMessage: null,
      customers: [],
      customer_info: '',
      orgUsername: null
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
      this.customeruser = customerUserModel.getFields()
    }
    this.isLoading = false
  },
  methods: {
    clearCustomer() {
      this.customeruser.customer_user.customer = null
      this.customer_info = ''
    },
    getCustomers(query) {
      this.isLoading = true

      customerModel.search(query).then((response) => {
        this.customers = response
        this.isLoading = false
      }).catch(() => {
        errorToast(create, this.$trans('Error fetching customers'))
        this.isLoading = false
      })
    },
    customerLabel({ name, city}) {
      return `${name} - ${city}`
    },
    selectCustomer(option) {
      this.customeruser.customer_user.customer = option.id
      this.customer_info = `${option.name}, ${option.address}, ${option.city}`
    },

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
        this.customeruser.password = this.customeruser.password1

        try {
          await customerUserModel.insert(this.customeruser)
          infoToast(create, this.$trans('Created'), this.$trans('Customer user has been created'))
          this.isLoading = false
          this.cancelForm()
        } catch(error) {
          errorToast(create, this.$trans('Error creating customer user'))
          this.isLoading = false
          this.buttonDisabled = false
        }

        return
      }

      try {
        delete this.customeruser.date_joined
        delete this.customeruser.last_login

        if (this.customeruser.password1) {
          this.customeruser.password = this.customeruser.password1
        } else {
          delete this.customeruser.password
        }

        await customerUserModel.update(this.pk, this.customeruser)
        infoToast(create, this.$trans('Updated'), this.$trans('Customer user has been updated'))
        this.isLoading = false
        this.cancelForm()
      } catch(error) {
        errorToast(create, this.$trans('Error updating customer user'))
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.customeruser = await customerUserModel.detail(this.pk)
        this.orgUsername = this.customeruser.username
        if (this.customeruser.customer_user.customer !== null) {
          this.customer_info = `${this.customeruser.customer_details.name}, ${this.customeruser.customer_details.address}, ${this.customeruser.customer_details.city}`
        }
        this.isLoading = false
      } catch(error) {
        console.log('error fetching customeruser', error)
        errorToast(create, this.$trans('Error loading customer user'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
