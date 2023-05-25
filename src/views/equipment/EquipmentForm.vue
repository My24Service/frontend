<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New equipment') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit equipment') }}</h2>
        <b-row v-if="!hasBranches && !isCustomer">
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Search customer')"
              label-for="equipment_customer_search"
            >
              <multiselect
                v-if="!isLoading"
                id="equipment_customer_search"
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
                :state="isSubmitClicked ? !v$.equipment.customer.$error : null">
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
              label-for="equipment_branch_search"
            >
              <multiselect
                v-if="!isLoading"
                id="equipment_branch_search"
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
                :state="isSubmitClicked ? !v$.equipment.branch.$error : null">
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
              label-for="equipment_customer_name"
            >
              <b-form-input
                id="equipment_customer_name"
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
              label-for="equipment_customer_address"
            >
              <b-form-input
                id="equipment_customer_address"
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
              label-for="equipment_customer_city"
            >
              <b-form-input
                id="equipment_customer_city"
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
              label-for="equipment_customer_country_code"
            >
              <b-form-input
                id="equipment_customer_country_code"
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
              label-for="equipment_branch_name"
            >
              <b-form-input
                id="equipment_branch_name"
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
              label-for="equipment_branch_address"
            >
              <b-form-input
                id="equipment_branch_address"
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
              label-for="equipment_branch_city"
            >
              <b-form-input
                id="equipment_branch_city"
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
              label-for="equipment_branch_country_code"
            >
              <b-form-input
                id="equipment_branch_country_code"
                size="sm"
                v-model="branch.country_code"
                readonly
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Name')"
              label-for="equipment_name"
            >
              <b-form-input
                :state="isSubmitClicked ? !v$.equipment.name.$error : null"
                id="equipment_name"
                size="sm"
                ref="name"
                v-model="equipment.name"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.equipment.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Brand')"
              label-for="equipment_name"
            >
              <b-form-input
                id="equipment_name"
                size="sm"
                v-model="equipment.brand"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Identifier')"
              label-for="equipment_identifier"
            >
              <b-form-input
                id="equipment_identifier"
                size="sm"
                v-model="equipment.identifier"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Serial number')"
              label-for="equipment_serialnumber"
            >
              <b-form-input
                id="equipment_serialnumber"
                size="sm"
                v-model="equipment.serialnumber"
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Installation date')"
              label-for="equipment_installation_date"
            >
              <b-form-datepicker
                id="equipment_installation_date"
                size="sm"
                class="p-sm-0"
                v-model="equipment.installation_date"
                v-bind:placeholder="$trans('Choose a date')"
                value="equipment.installation_date"
                locale="nl"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></b-form-datepicker>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Production date')"
              label-for="equipment_production_date"
            >
              <b-form-datepicker
                id="equipment_production_date"
                size="sm"
                class="p-sm-0"
                v-model="equipment.production_date"
                v-bind:placeholder="$trans('Choose a date')"
                value="equipment.production_date"
                locale="nl"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></b-form-datepicker>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Standard hours/mins.')"
              label-for="equipment_standard_hours_hour"
            >
              <b-form-input
                id="equipment_standard_hours_hour"
                size="sm"
                v-model="equipment.standard_hours_hour"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Description')"
              label-for="equipment_remarks"
            >
                <b-form-textarea
                  id="equipment_remarks"
                  v-model="equipment.description"
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
            <b-button
              @click="submitFormBulk"
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

import customerModel from '../../models/customer/Customer.js'
import equipmentModel from '../../models/equipment/equipment.js'
import branchModel from "../../models/company/Branch";
import {componentMixin} from "../../utils";
import locationModel from "../../models/equipment/location";

export default {
  mixins: [componentMixin],
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
    if (!this.hasBranches && !this.isCustomer) {
      return {
        equipment: {
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
        equipment: {
          customer: {
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
      equipment: {
        name: {
          required,
        },
      }
    }

  },
  data () {
    return {
      isLoading: false,
      submitClicked: false,
      equipment: equipmentModel.getFields(),
      errorMessage: null,
      equipmentObjects: [],

      getCustomersDebounced: null,
      customersSearch: [],
      customer: null,

      getBranchesDebounced: null,
      branchesSearch: [],
      branch: null,
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

    if (this.isCreate) {
      this.equipment = equipmentModel.getFields()
    } else {
      await this.loadData()
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
      this.equipment.customer = option.id
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
      this.equipment.branch = option.id
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

      this.isLoading = true

      if (this.isCreate) {
        try {
          await equipmentModel.insert(this.equipment)
          this.infoToast(this.$trans('Created'), this.$trans('Equipment has been created'))
          this.isLoading = false

          if (isBulk) {
            let empty = equipmentModel.getFields()
            empty.branch = this.equipment.branch
            empty.customer = this.equipment.customer
            this.location = empty
            this.v$.$reset()
            this.$refs.name.$el.focus()
          } else {
            this.$router.go(-1)
          }
        } catch(error) {
          console.log('Error creating equipment', error)
          this.errorToast(this.$trans('Error creating equipment'))
          this.isLoading = false
        }

        return
      }

      try {
        await equipmentModel.update(this.pk, this.equipment)
        this.infoToast(this.$trans('Updated'), this.$trans('Equipment has been updated'))
        this.isLoading = false
        this.cancelForm()
      } catch(error) {
        console.log('Error updating equipment', error)
        this.errorToast(this.$trans('Error updating equipment'))
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.equipment = await equipmentModel.detail(this.pk)
        if (this.hasBranches && !this.isEmployee) {
          this.branch = await branchModel.detail(this.equipment.branch)
        }
        if (!this.hasBranches && !this.isCustomer) {
          this.customer = await customerModel.detail(this.equipment.customer)
        }

        this.isLoading = false
      } catch(error) {
        console.log('error fetching equipment', error)
        this.errorToast(this.$trans('Error loading equipment'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
