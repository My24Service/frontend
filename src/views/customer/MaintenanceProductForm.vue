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
              label-class="p-sm-0"
              v-bind:label="$trans('Search customer')"
              label-for="maintenance_product_customer_search"
            >
              <multiselect
                id="maintenance_product_customer_search"
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
                autofocus
                id="maintenance_product_city"
                size="sm"
                v-model="customer.city"
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
                autofocus
                id="maintenance_product_country_code"
                size="sm"
                v-model="customer.country_code"
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
                v-model="maintenanceProduct.product"
                :state="isSubmitClicked ? !v$.maintenanceProduct.product.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.maintenanceProduct.product.$error : null">
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
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Contact')"
              label-for="maintenance_product_contact"
            >
              <b-form-textarea
                id="maintenance_product_contact"
                v-model="maintenance_product.contact"
                rows="5"
              ></b-form-textarea>
            </b-form-group>
          </b-col>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Remarks')"
              label-for="maintenance_product_remarks"
            >
              <b-form-textarea
                id="maintenance_product_remarks"
                v-model="maintenance_product.remarks"
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
              label-for="maintenance_product_maintenance_contract"
            >
              <b-form-textarea
                id="maintenance_product_maintenance_contract"
                v-model="maintenance_product.maintenance_contract"
                rows="5"
              ></b-form-textarea>
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
                v-model="maintenance_product.standard_hours_hour"
              ></b-form-input>
              <b-form-select v-model="maintenance_product.standard_hours_minute" :options="minutes" size="sm"></b-form-select>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Products without tax?')"
              label-for="maintenance_product_products_without_tax"
            >
              <b-form-checkbox
                id="maintenance_product_products_without_tax"
                v-model="maintenance_product.products_without_tax"
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
import maintenanceProductModel from '@/models/customer/MaintenanceProduct.js'

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
  validations: {
    maintenanceProduct: {
      customer: {
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
  },
  data () {
    return {
      isLoading: false,
      submitClicked: false,
      maintenanceProduct: maintenanceProductModel.getFields(),
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
  async created() {
    this.countries = await this.$store.dispatch('getCountries')

    if (this.isCreate) {
      this.maintenanceProduct = maintenanceProductModel.getFields()
    } else {
      this.loadData()
    }
  },
  methods: {
    clearCustomer() {
      this.maintenanceProduct.customer = null
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
      this.maintenanceProduct.customer = option.id
      this.customer_info = `${option.name}, ${option.address}, ${option.city}`
    },

    submitForm() {
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
        return this.$store.dispatch('getCsrfToken').then((token) => {
          maintenanceProductModel.insert(token, this.maintenance_product).then((action) => {
            this.infoToast(this.$trans('Created'), this.$trans('Maintenance product has been created'))
            this.isLoading = false
            this.cancelForm()
          }).catch(() => {
            this.errorToast(this.$trans('Error creating maintenance product'))
            this.isLoading = false
          })
        })
      }

      this.$store.dispatch('getCsrfToken').then((token) => {
        maintenanceProductModel.update(token, this.pk, this.maintenanceProduct)
          .then(() => {
            this.infoToast(this.$trans('Updated'), this.$trans('Maintenance product has been updated'))
            this.isLoading = false
            this.cancelForm()
          })
          .catch(() => {
            this.errorToast(this.$trans('Error updating maintenance_product'))
            this.isLoading = false
          })
      })
    },
    loadData() {
      this.isLoading = true

      maintenanceProductModel.detail(this.pk).then((maintenance_product) => {
        this.maintenanceProduct = maintenance_product
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching maintenance product', error)
        this.errorToast(this.$trans('Error loading maintenance product'))
        this.isLoading = false
      })
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
