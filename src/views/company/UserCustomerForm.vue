<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New customer user') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit customer user') }}</h2>
        <b-row>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
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
                v-if="customeruser.username !== ''"
                :state="isSubmitClicked ? v$.customeruser.username.isUnique : null">
                {{ $trans('Username is already in use') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
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
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
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
                :state="isSubmitClicked ? v$.customeruser.password2.sameAs : null">
                {{ $trans('Passwords do not match') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
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
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
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
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
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
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Setings group')"
              label-for="customeruser_settings_group"
            >
              <b-form-input
                id="customeruser_settings_group"
                size="sm"
                v-model="customeruser.customer_user.settings_group"
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Search customer')"
              label-for="customeruser_customer_search"
            >
              <multiselect
                id="customeruser_customer_search"
                track-by="id"
                :placeholder="$trans('Type to search')"
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
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="10" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Customer')"
              label-for="customeruser_customer"
            >
              <b-form-input
                id="customeruser_customer"
                size="sm"
                readonly
                v-model="customer_info"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Clear')"
              label-for="customeruser_customer_clear"
            >
              <b-button @click="clearCustomer" size="sm" type="button" variant="danger">
                {{ $trans('Clear customer') }}</b-button>
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
import Multiselect from 'vue-multiselect'

import { usernameExists } from '@/models/helpers.js'
import customerUserModel from '@/models/company/UserCustomer.js'
import customerModel from '@/models/customer/Customer.js'

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
        if (this.orgUsername === this.customeruser.username || value === '' || value.length < 3) {
          return true
        }

        return helpers.withAsync(usernameExists(value))
      }

      validations.customeruser.username = {
        required,
        isUnique: helpers.withAsync(isUniqueEdit)
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
  created() {
    if (!this.isCreate) {
      this.loadData()
    } else {
      this.customeruser = customerUserModel.getFields()
    }
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
        this.errorToast(this.$trans('Error fetching customers'))
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
    submitForm() {
      this.isLoading = true

      if (this.isCreate) {
        this.customeruser.password = this.customeruser.password1
        return this.$store.dispatch('getCsrfToken').then((token) => {
          customerUserModel.insert(token, this.customeruser).then((action) => {
            this.infoToast(this.$trans('Created'), this.$trans('Customer user has been created'))
            this.isLoading = false
            this.cancelForm()
          }).catch(() => {
            this.errorToast(this.$trans('Error creating customer user'))
            this.isLoading = false
          })
        })
      }

      this.$store.dispatch('getCsrfToken').then((token) => {
        delete this.customeruser.date_joined
        delete this.customeruser.last_login

        if (this.customeruser.password1) {
          this.customeruser.password = this.customeruser.password1
        } else {
          delete this.customeruser.password
        }

        customerUserModel.update(token, this.pk, this.customeruser)
          .then(() => {
            this.infoToast(this.$trans('Updated'), this.$trans('Customer user has been updated'))
            this.isLoading = false
            this.cancelForm()
          })
          .catch(() => {
            this.errorToast(this.$trans('Error updating customer user'))
            this.isLoading = false
          })
      })
    },
    loadData() {
      this.isLoading = true

      customerUserModel.detail(this.pk).then((customeruser) => {
        this.customeruser = customeruser
        this.orgUsername = customeruser.username
        if (customeruser.customer_user.customer !== null) {
          this.customer_info = `${customeruser.customer_details.name}, ${customeruser.customer_details.address}, ${customeruser.customer_details.city}`
        }
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching customeruser', error)
        this.errorToast(this.$trans('Error loading customer user'))
        this.isLoading = false
      })
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
