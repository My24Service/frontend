<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New location') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit location') }}</h2>
        <b-row v-if="!hasBranches && !isCustomer">
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Search customer')"
              label-for="location_customer_search"
            >
              <multiselect
                v-if="!isLoading"
                id="location_customer_search"
                track-by="id"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="customersSearch"
                :multiple="false"
                :loading="isLoading"
                :internal-search="false"
                :clear-on-select="true"
                :close-on-select="true"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :show-no-results="true"
                :hide-selected="true"
                @search-change="getCustomersDebounced"
                @select="selectCustomer"
                :custom-label="customerLabel"
              >
                <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
              </multiselect>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.location.customer.$error : null">
                {{ $trans('Please select a customer') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row v-if="hasBranches && !isEmployee">
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Search branches')"
              label-for="location_branch_search"
            >
              <multiselect
                v-if="!isLoading"
                id="location_branch_search"
                track-by="id"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="branchesSearch"
                :multiple="false"
                :loading="isLoading"
                :internal-search="false"
                :clear-on-select="true"
                :close-on-select="true"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :show-no-results="true"
                :hide-selected="true"
                @search-change="getBranchesDebounced"
                @select="selectBranch"
                :custom-label="branchLabel"
              >
                <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
              </multiselect>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.location.branch.$error : null">
                {{ $trans('Please select a branch') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row v-if="customer && !hasBranches">
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Customer')"
              label-for="location_customer_name"
            >
              <b-form-input
                id="location_customer_name"
                size="sm"
                v-model="customer.name"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Address')"
              label-for="location_customer_address"
            >
              <b-form-input
                id="location_customer_address"
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
              label-for="location_customer_city"
            >
              <b-form-input
                id="location_customer_city"
                size="sm"
                v-model="customer.city"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Country')"
              label-for="location_customer_country_code"
            >
              <b-form-input
                id="location_customer_country_code"
                size="sm"
                v-model="customer.country_code"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row v-if="branch && hasBranches">
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Branch')"
              label-for="location_branch_name"
            >
              <b-form-input
                id="location_branch_name"
                size="sm"
                v-model="branch.name"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Address')"
              label-for="location_branch_address"
            >
              <b-form-input
                id="location_branch_address"
                size="sm"
                v-model="branch.address"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('City')"
              label-for="location_branch_city"
            >
              <b-form-input
                id="location_branch_city"
                size="sm"
                v-model="branch.city"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Country')"
              label-for="location_branch_country_code"
            >
              <b-form-input
                id="location_branch_country_code"
                size="sm"
                v-model="branch.country_code"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="8" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Name')"
              label-for="location-name"
            >
              <b-form-input
                v-model="location.name"
                id="location-name"
                size="sm"
                ref="name"
                :state="isSubmitClicked ? !v$.location.name.$error : null"
              ></b-form-input> 
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.location.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col size="4">
            <b-form-group
              v-bind:label="$trans('Building')"
              label-for="location_building"
            >
              <b-form-select
                id="location_building"
                v-model="location.building"
                :options="buildings"
                size="sm"
                value-field="id"
                text-field="name"
              ></b-form-select>
            </b-form-group>
          </b-col>
        </b-row>
        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
              {{ $trans('Cancel') }}
            </b-button>
            <b-button @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Submit') }}
            </b-button>
            <b-button
              @click="submitFormBulk"
              :disabled="buttonDisabled"
              type="button"
              variant="success"
              v-if="isCreate"
            >
              {{ $trans('Bulk') }}
            </b-button>
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

import locationModel from '../../models/equipment/location.js'
import {componentMixin} from "../../utils";
import customerModel from "../../models/customer/Customer";
import branchModel from "../../models/company/Branch";
import buildingModel from "../../models/equipment/building";

export default {
  mixins: [componentMixin],
  components: {
    Multiselect,
  },
  setup() {
    return { v$: useVuelidate() }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      location: locationModel.getFields(),

      getCustomersDebounced: null,
      customersSearch: [],
      customer: null,

      getBranchesDebounced: null,
      branchesSearch: [],
      branch: null,
      buildings: []
    }
  },
  validations() {
    if (!this.hasBranches && !this.isCustomer) {
      return {
        location: {
          customer: {
            required
          },
          name: {
            required,
          },
        }
      }
    }

    if (this.hasBranches && !this.isEmployee) {
      return {
        location: {
          branch: {
            required
          },
          name: {
            required,
          },
        }
      }
    }

    // customer or employee
    return {
      location: {
        name: {
          required,
        },
      }
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
    this.getCustomersDebounced = AwesomeDebouncePromise(this.getCustomers, 500)
    this.getBranchesDebounced = AwesomeDebouncePromise(this.getBranches, 500)
    this.buildings = await buildingModel.listForSelect()

    if (!this.isCreate) {
      this.loadData()
    } else {
      this.location = locationModel.getFields()
    }
  },
  methods: {
    // customers
    async getCustomers(query) {
      try {
        this.customersSearch = await customerModel.search(query)
      } catch(error) {
        console.log('Error fetching customers', error)
        this.errorToast(this.$trans('Error fetching customers'))
      }
    },
    customerLabel({ name, city}) {
      return `${name} - ${city}`
    },
    selectCustomer(option) {
      this.location.customer = option.id
      this.customer = option
      this.$refs.name.focus()
    },
    // branches
    async getBranches(query) {
      try {
        this.branchesSearch = await branchModel.search(query)
      } catch(error) {
        console.log('Error fetching branches', error)
        this.errorToast(this.$trans('Error fetching branches'))
      }
    },
    branchLabel({ name, city}) {
      return `${name} - ${city}`
    },
    selectBranch(option) {
      this.location.branch = option.id
      this.branch = option
      this.$refs.name.focus()
    },

    async submitForm() {
      await this._submitForm(false)
    },
    async submitFormBulk() {
      await this._submitForm(true)
    },
    async _submitForm(isBulk) {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      this.buttonDisabled = true
      this.isLoading = true

      if (this.isCreate) {
        try {
          await locationModel.insert(this.location)
          this.infoToast(this.$trans('Created'), this.$trans('Location has been created'))
          this.buttonDisabled = false
          this.isLoading = false

          if (isBulk) {
            let empty = locationModel.getFields()
            empty.branch = this.location.branch
            empty.customer = this.location.customer
            this.location = empty
            this.v$.$reset()
            this.$refs.name.$el.focus()
          } else {
            this.$router.go(-1)
          }
        } catch(error) {
          console.log('Error creating location', error)
          this.errorToast(this.$trans('Error creating location'))
          this.buttonDisabled = false
          this.isLoading = false
        }

        return
      }

      try {
        await locationModel.update(this.pk, this.location)
        this.infoToast(this.$trans('Updated'), this.$trans('Location has been updated'))
        this.buttonDisabled = false
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating location', error)
        this.errorToast(this.$trans('Error updating location'))
        this.buttonDisabled = false
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.location = await locationModel.detail(this.pk)
        if (this.hasBranches && !this.isEmployee) {
          this.branch = await branchModel.detail(this.location.branch)
        }
        if (!this.hasBranches && !this.isCustomer) {
          this.customer = await customerModel.detail(this.location.customer)
        }
        this.isLoading = false
      } catch(error) {
        console.log('error fetching location', error)
        this.errorToast(this.$trans('Error fetching location'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
