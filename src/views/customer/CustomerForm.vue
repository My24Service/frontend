<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New customer') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit customer') }}</h2>
        <b-row>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Customer ID')"
              label-for="customer_customer_id"
            >
              <b-form-input
                id="customer_customer_id"
                size="sm"
                v-model="customer.customer_id"
                :readonly="customerIdCreated"
                :state="isSubmitClicked ? !v$.customer.customer_id.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.customer.customer_id.$error : null">
                {{ $trans('Please enter a customer ID') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Ext. identifier')"
              label-for="customer_external_identifier"
            >
              <b-form-input
                id="customer_external_identifier"
                size="sm"
                v-model="customer.external_identifier"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Name')"
              label-for="customer_name"
            >
              <b-form-input
                autofocus
                id="customer_name"
                size="sm"
                v-model="customer.name"
                :state="isSubmitClicked ? !v$.customer.name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.customer.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Address')"
              label-for="customer_address"
            >
              <b-form-input
                id="customer_address"
                size="sm"
                v-model="customer.address"
                :state="isSubmitClicked ? !v$.customer.address.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.customer.address.$error : null">
                {{ $trans('Please enter an address') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Postal')"
              label-for="customer_postal"
            >
              <b-form-input
                id="customer_postal"
                size="sm"
                v-model="customer.postal"
                :state="isSubmitClicked ? !v$.customer.postal.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.customer.postal.$error : null">
                {{ $trans('Please enter a postal') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('City')"
              label-for="customer_city"
            >
              <b-form-input
                id="customer_city"
                size="sm"
                v-model="customer.city"
                :state="isSubmitClicked ? !v$.customer.city.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.customer.city.$error : null">
                {{ $trans('Please enter a city') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Country')"
              label-for="customer_country"
            >
              <b-form-select v-model="customer.country_code" :options="countries" size="sm"></b-form-select>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Email')"
              label-for="customer_email"
            >
              <b-form-input
                id="customer_email"
                size="sm"
                v-model="customer.email"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Tel.')"
              label-for="customer_tel"
            >
              <b-form-input
                id="customer_tel"
                size="sm"
                v-model="customer.tel"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Mobile')"
              label-for="customer_mobile"
            >
              <b-form-input
                id="customer_mobile"
                size="sm"
                v-model="customer.mobile"
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Contact')"
              label-for="customer_contact"
            >
              <b-form-textarea
                id="customer_contact"
                v-model="customer.contact"
                rows="5"
              ></b-form-textarea>
            </b-form-group>
          </b-col>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Remarks')"
              label-for="customer_remarks"
            >
              <b-form-textarea
                id="customer_remarks"
                v-model="customer.remarks"
                rows="5"
              ></b-form-textarea>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="7" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Maintenance contract')"
              label-for="customer_maintenance_contract"
            >
              <b-form-textarea
                id="customer_maintenance_contract"
                v-model="customer.maintenance_contract"
                rows="5"
              ></b-form-textarea>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Standard hours/mins.')"
              label-for="customer_standard_hours_hour"
            >
              <b-form-input
                id="customer_standard_hours_hour"
                size="sm"
                v-model="customer.standard_hours_hour"
              ></b-form-input>
              <b-form-select v-model="customer.standard_hours_minute" :options="minutes" size="sm"></b-form-select>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Products without tax?')"
              label-for="customer_products_without_tax"
            >
              <b-form-checkbox
                id="customer_products_without_tax"
                v-model="customer.products_without_tax"
              >
              </b-form-checkbox>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="cancelForm" type="button" variant="secondary">
              {{ $trans('Cancel') }}</b-button>
            <b-button @click="submitForm" type="button" variant="primary">
              {{ $trans('Submit') }}</b-button>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'

import customerModel from '@/models/customer/Customer.js'

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
    return {
      customer: {
        customer_id: {
          required
        },
        name: {
          required,
        },
        address: {
          required,
        },
        postal: {
          required,
        },
        city: {
          required,
        },
      }
    }
  },
  data () {
    return {
      isLoading: false,
      countries: [],
      customerIdCreated: true,
      customerId: null,
      minutes: ['00', '15', '30', '45'],
      submitClicked: false,
      customer: customerModel.getFields(),
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
    this.countries = await this.$store.dispatch('getCountries')

    if (this.isCreate) {
      this.customer = customerModel.getFields()
      const result = await customerModel.getCustomerId()
      if (result.created) {
        this.customerIdCreated = true
        this.customer.customer_id = result.customer_id
      } else {
        this.customerIdCreated = false
      }
    } else {
      this.loadData()
    }
  },
  methods: {
    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      // remove null fields
      const null_fields = ['hours', 'time', 'time2', 'timealt', 'timealt2']
      for (let i=0; i<null_fields.length; i++) {
        if (this.customer[null_fields[i]] === null) {
          delete this.customer[null_fields[i]]
        }
      }

      this.isLoading = true

      if (this.isCreate) {
        try {
          await customerModel.insert(this.customer)
          this.infoToast(this.$trans('Created'), this.$trans('Customer has been created'))
          this.isLoading = false
          this.cancelForm()
        } catch(error) {
          console.log('Error creating customer', error)
          this.errorToast(this.$trans('Error creating customer'))
          this.isLoading = false
        }

        return
      }

      try {
        await customerModel.update(this.pk, this.customer)
        this.infoToast(this.$trans('Updated'), this.$trans('Customer has been updated'))
        this.isLoading = false
        this.cancelForm()
      } catch(error) {
        console.log('Error updating customer', error)
        this.errorToast(this.$trans('Error updating customer'))
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.customer = await customerModel.detail(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching customer', error)
        this.errorToast(this.$trans('Error loading customer'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
