<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New maintenance contract') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit maintenance contract') }}</h2>
        <b-row v-if="isCreate">
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Search customer')"
              label-for="maintenance_contract_customer_search"
            >
              <multiselect
                id="maintenance_contract_customer_search"
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
                @search-change="getCustomersDebounced"
                @select="selectCustomer"
                :custom-label="customerLabel"
              >
                <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
              </multiselect>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Customer')"
              label-for="maintenance_contract_name"
            >
              <b-form-input
                id="maintenance_contract_name"
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
              label-for="maintenance_contract_address"
            >
              <b-form-input
                id="maintenance_contract_address"
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
              label-for="maintenance_contract_city"
            >
              <b-form-input
                id="maintenance_contract_city"
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
              label-for="maintenance_contract_country_code"
            >
              <b-form-input
                id="maintenance_contract_country_code"
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
              label-for="maintenance_contract_tel"
            >
              <b-form-input
                id="maintenance_contract_tel"
                size="sm"
                v-model="customer.tel"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Contract value')"
              label-for="maintenance_contract_contract_value"
            >
              <b-form-input
                ref="contract_value"
                id="maintenance_contract_contract_value"
                size="sm"
                v-model="maintenanceContract.contract_value"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="8" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Remarks')"
              label-for="maintenance_contract_remarks"
            >
                <b-form-textarea
                  id="maintenance_contract_remarks"
                  v-model="maintenanceContract.remarks"
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
import maintenanceContractModel from '@/models/customer/MaintenanceContract.js'

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
  validations: {
    maintenanceContract: {
      customer: {
        required
      },
      contract_value: {
        required,
      },
    }
  },
  data () {
    return {
      isLoading: false,
      submitClicked: false,
      maintenanceContract: maintenanceContractModel.getFields(),
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
      this.maintenancecontract = maintenanceContractModel.getFields()

      this.customer = await customerModel.getFields()
      this.getCustomersDebounced = AwesomeDebouncePromise(this.getCustomers, 500)
    } else {
      this.loadData()
    }
  },
  methods: {
    clearCustomer() {
      this.maintenancecontract.customer = null
    },
    getCustomers(query) {
      customerModel.search(query).then((response) => {
        this.customers = response
      }).catch(() => {
        this.errorToast(this.$trans('Error fetching customers'))
      })
    },
    customerLabel({ name, city}) {
      return `${name} - ${city}`
    },
    selectCustomer(option) {
      this.maintenanceContract.customer = option.id
      this.customer.name = option.name
      this.customer.address = option.address
      this.customer.city = option.city
      this.customer.country_code = option.country_code
      this.customer.tel = option.tel
      this.$refs.contract_value.focus()
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
        if (this.maintenance_contract[null_fields[i]] === null) {
          delete this.maintenance_contract[null_fields[i]]
        }
      }

      this.isLoading = true

      if (this.isCreate) {
        try {
          await maintenanceContractModel.insert(this.maintenanceContract)
          this.infoToast(this.$trans('Created'), this.$trans('Maintenance contract has been created'))
          this.isLoading = false
          this.cancelForm()
        } catch(error) {
          console.log('Error creating maintenance_contract', error)
          this.errorToast(this.$trans('Error creating maintenance contract'))
          this.isLoading = false
        }

        return
      }

      try {
        await maintenanceContractModel.update(this.pk, this.maintenanceContract)
        this.infoToast(this.$trans('Updated'), this.$trans('Maintenance contract has been updated'))
        this.isLoading = false
        this.cancelForm()
      } catch(error) {
        console.log('Error updating maintenance_contract', error)
        this.errorToast(this.$trans('Error updating maintenance_contract'))
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.maintenanceContract = await maintenanceContractModel.detail(this.pk)
        this.customer = await customerModel.detail(this.maintenanceContract.customer)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching maintenance contract', error)
        this.errorToast(this.$trans('Error loading maintenance contract'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
