<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New building') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit building') }}</h2>
        <b-row v-if="!hasBranches && !isCustomer">
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Search customer')"
              label-for="building_customer_search"
            >
              <multiselect
                v-if="!isLoading"
                id="building_customer_search"
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
                :state="isSubmitClicked ? !v$.building.customer.$error : null">
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
              label-for="building_branch_search"
            >
              <multiselect
                v-if="!isLoading"
                id="building_branch_search"
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
                :state="isSubmitClicked ? !v$.building.branch.$error : null">
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
              label-for="building_customer_name"
            >
              <b-form-input
                id="building_customer_name"
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
              label-for="building_customer_address"
            >
              <b-form-input
                id="building_customer_address"
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
              label-for="building_customer_city"
            >
              <b-form-input
                id="building_customer_city"
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
              label-for="building_customer_country_code"
            >
              <b-form-input
                id="building_customer_country_code"
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
              label-for="building_branch_name"
            >
              <b-form-input
                id="building_branch_name"
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
              label-for="building_branch_address"
            >
              <b-form-input
                id="building_branch_address"
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
              label-for="building_branch_city"
            >
              <b-form-input
                id="building_branch_city"
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
              label-for="building_branch_country_code"
            >
              <b-form-input
                id="building_branch_country_code"
                size="sm"
                v-model="branch.country_code"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Name')"
              label-for="building-name"
            >
              <b-form-input
                v-model="building.name"
                id="building-name"
                size="sm"
                ref="name"
                :state="isSubmitClicked ? !v$.building.name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.building.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
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

import buildingModel from '../../models/equipment/building.js'
import {componentMixin} from "../../utils";
import customerModel from "../../models/customer/Customer";
import branchModel from "../../models/company/Branch";

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
      building: buildingModel.getFields(),

      getCustomersDebounced: null,
      customersSearch: [],
      customer: null,

      getBranchesDebounced: null,
      branchesSearch: [],
      branch: null,
    }
  },
  validations() {
    if (!this.hasBranches && !this.isCustomer) {
      return {
        building: {
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
        building: {
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
      building: {
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
  created() {
    this.getCustomersDebounced = AwesomeDebouncePromise(this.getCustomers, 500)
    this.getBranchesDebounced = AwesomeDebouncePromise(this.getBranches, 500)

    if (!this.isCreate) {
      this.loadData()
    } else {
      this.building = buildingModel.getFields()
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
      this.building.customer = option.id
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
      this.building.branch = option.id
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
          await buildingModel.insert(this.building)
          this.infoToast(this.$trans('Created'), this.$trans('building has been created'))
          this.buttonDisabled = false
          this.isLoading = false

          if (isBulk) {
            let empty = buildingModel.getFields()
            empty.branch = this.building.branch
            empty.customer = this.building.customer
            this.building = empty
            this.v$.$reset()
            this.$refs.name.$el.focus()
          } else {
            this.$router.go(-1)
          }
        } catch(error) {
          console.log('Error creating building', error)
          this.errorToast(this.$trans('Error creating building'))
          this.buttonDisabled = false
          this.isLoading = false
        }

        return
      }

      try {
        await buildingModel.update(this.pk, this.building)
        this.infoToast(this.$trans('Updated'), this.$trans('building has been updated'))
        this.buttonDisabled = false
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating building', error)
        this.errorToast(this.$trans('Error updating building'))
        this.buttonDisabled = false
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.building = await buildingModel.detail(this.pk)
        if (this.hasBranches && !this.isEmployee) {
          this.branch = await branchModel.detail(this.building.branch)
        }
        if (!this.hasBranches && !this.isCustomer) {
          this.customer = await customerModel.detail(this.building.customer)
        }
        this.isLoading = false
      } catch(error) {
        console.log('error fetching building', error)
        this.errorToast(this.$trans('Error fetching building'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
