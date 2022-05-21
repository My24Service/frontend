<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New maintenance product') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit maintenance product') }}</h2>
        <b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Customer')"
              label-for="maintenance_product_name"
            >
              <b-form-input
                id="maintenance_product_name"
                size="sm"
                v-model="customer.name"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Address')"
              label-for="maintenance_product_address"
            >
              <b-form-input
                id="maintenance_product_address"
                size="sm"
                v-model="customer.address"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('City')"
              label-for="maintenance_product_city"
            >
              <b-form-input
                id="maintenance_product_city"
                size="sm"
                v-model="customer.city"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="1" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Country')"
              label-for="maintenance_product_country_code"
            >
              <b-form-input
                id="maintenance_product_country_code"
                size="sm"
                v-model="customer.country_code"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Tel.')"
              label-for="maintenance_product_tel"
            >
              <b-form-input
                id="maintenance_product_tel"
                size="sm"
                v-model="customer.tel"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Product')"
              label-for="maintenance_product_product"
            >
              <b-form-input
                id="maintenance_product_product"
                size="sm"
                ref="product"
                v-model="maintenanceProduct.product_name"
                :state="isSubmitClicked ? !v$.maintenanceProduct.product_name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.maintenanceProduct.product_name.$error : null">
                {{ $trans('Please enter a product') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Brand')"
              label-for="maintenance_product_brand"
            >
              <b-form-input
                id="maintenance_product_brand"
                size="sm"
                v-model="maintenanceProduct.brand"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Amount')"
              label-for="maintenance_product_amount"
            >
              <b-form-input
                id="maintenance_product_amount"
                size="sm"
                v-model="maintenanceProduct.amount"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.maintenanceProduct.amount.$error : null">
                {{ $trans('Please enter an amount') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Times / year')"
              label-for="maintenance_product_times_per_year"
            >
              <b-form-input
                id="maintenance_product_times_per_year"
                size="sm"
                v-model="maintenanceProduct.times_per_year"
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Installation date')"
              label-for="maintenance_product_installation_date"
            >
              <b-form-datepicker
                id="maintenance_product_installation_date"
                size="sm"
                class="p-sm-0"
                v-model="maintenanceProduct.installation_date"
                v-bind:placeholder="$trans('Choose a date')"
                value="maintenanceProduct.installation_date"
                locale="nl"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></b-form-datepicker>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Production date')"
              label-for="maintenance_product_production_date"
            >
              <b-form-datepicker
                id="maintenance_product_production_date"
                size="sm"
                class="p-sm-0"
                v-model="maintenanceProduct.production_date"
                v-bind:placeholder="$trans('Choose a date')"
                value="maintenanceProduct.production_date"
                locale="nl"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></b-form-datepicker>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Serial number')"
              label-for="maintenance_product_serialnumber"
            >
              <b-form-input
                id="maintenance_product_serialnumber"
                size="sm"
                v-model="maintenanceProduct.serialnumber"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Contract value')"
              label-for="maintenance_product_contract_value"
            >
              <b-form-input
                id="maintenance_product_contract_value"
                size="sm"
                v-model="maintenanceProduct.contract_value"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Standard hours/mins.')"
              label-for="maintenance_product_standard_hours_hour"
            >
              <b-form-input
                id="maintenance_product_standard_hours_hour"
                size="sm"
                v-model="maintenanceProduct.standard_hours_hour"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Remarks')"
              label-for="maintenance_product_remarks"
            >
                <b-form-textarea
                  id="maintenance_product_remarks"
                  v-model="maintenanceProduct.remarks"
                  rows="1"
                ></b-form-textarea>
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
import Multiselect from 'vue-multiselect'
import AwesomeDebouncePromise from 'awesome-debounce-promise'

import customerModel from '@/models/customer/Customer.js'
import maintenanceProductModel from '@/models/customer/MaintenanceProduct.js'

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
    withCustomerSearch: {
      type: [Boolean],
      default: false
    },
    customerPk: {
      type: [String, Number],
      default: null
    },
  },
  validations: {
    maintenanceProduct: {
      customer: {
        required
      },
      product_name: {
        required,
      },
      amount: {
        required,
      },
      contract_value: {
        required,
      }
    }
  },
  data () {
    return {
      isLoading: false,
      submitClicked: false,
      maintenanceProduct: maintenanceProductModel.getFields(),
      errorMessage: null,
      customer: {},
      customers: [],
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
    if (this.isCreate) {
      this.maintenanceProduct = maintenanceProductModel.getFields()

      if (!this.withCustomerSearch) {
        this.customer = await customerModel.detail(this.customerPk)
        this.$refs.product.focus()
      } else {
        this.customer = customerModel.getFields()
        this.getCustomersDebounced = AwesomeDebouncePromise(this.getCustomers, 500)
      }
    } else {
      await this.loadData()
    }
  },
  methods: {
    clearCustomer() {
      this.maintenanceProduct.customer = null
    },
    async getCustomers(query) {
      try {
        this.customers = await customerModel.search(query)
      } catch(error) {
        console.log('Error fetching customers', error)
        this.errorToast(this.$trans('Error fetching customers'))
      }
    },
    customerLabel({ name, city}) {
      return `${name} - ${city}`
    },
    selectCustomer(option) {
      this.maintenanceProduct.customer = option.id
      this.customer.name = option.name
      this.customer.address = option.address
      this.customer.city = option.city
      this.customer.country_code = option.country_code
      this.customer.tel = option.tel
      this.$refs.product.focus()
    },

    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      // remove null fields
      const null_fields = []
      for (let i=0; i<null_fields.length; i++) {
        if (this.maintenance_product[null_fields[i]] === null) {
          delete this.maintenance_product[null_fields[i]]
        }
      }

      this.isLoading = true

      if (this.isCreate) {
        try {
          await maintenanceProductModel.insert(this.maintenanceProduct)
          this.infoToast(this.$trans('Created'), this.$trans('Maintenance product has been created'))
          this.isLoading = false
          this.cancelForm()
        } catch(error) {
          console.log('Error creating maintenance_product', error)
          this.errorToast(this.$trans('Error creating maintenance product'))
          this.isLoading = false
        }

        return
      }

      try {
        await maintenanceProductModel.update(this.pk, this.maintenanceProduct)
        this.infoToast(this.$trans('Updated'), this.$trans('Maintenance product has been updated'))
        this.isLoading = false
        this.cancelForm()
      } catch(error) {
        console.log('Error updating maintenance_product', error)
        this.errorToast(this.$trans('Error updating maintenance_product'))
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.maintenanceProduct = await maintenanceProductModel.detail(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching maintenance product', error)
        this.errorToast(this.$trans('Error loading maintenance product'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
