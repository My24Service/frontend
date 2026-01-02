<template>
  <div class='app-page'>
    <header>
      <div class="page-title">
        <h3>
          <IBiShopWindow></IBiShopWindow>
          <span class="backlink" @click="cancelForm">{{ $trans('Locations') }}</span> /
          <span v-if="isCreate">{{ $trans('New location') }}</span>
          <span v-if="!isCreate">{{ location.name }} <span class="dimmed">{{ $trans('edit') }} </span></span>
        </h3>
        <div class='flex-columns'>
          <BButton @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
            {{ $trans('Cancel') }}
          </BButton>
          <BButton @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
            {{ $trans('Submit') }}
          </BButton>
          <BButton
            @click="submitFormBulk"
            :disabled="buttonDisabled"
            type="button"
            variant="success"
            v-if="isCreate"
          >
            {{ $trans('Bulk') }}
          </BButton>
        </div>
      </div>
    </header>

    <div class="page-detail">
      <b-overlay :show="isLoading" rounded="sm">
        <b-form class="flex-columns">
          <div class="panel col-1-3">
            <h6>{{ $trans('Customer') }} / {{ $trans('Branch') }}</h6>
            <b-row v-if="!hasBranches && !isCustomer">
              <b-col cols="12" role="group">
                <BFormGroup
                  label-size="sm"
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
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row v-if="hasBranches && !isEmployee">
              <b-col cols="12" role="group">
                <BFormGroup
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
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row v-if="customer && !hasBranches">
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Customer')"
                  label-for="location_customer_name"
                >
                  <BFormInput
                    id="location_customer_name"
                    size="sm"
                    v-model="customer.name"
                    readonly
                  ></BFormInput>
                </BFormGroup>
              </b-col>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Address')"
                  label-for="location_customer_address"
                >
                  <BFormInput
                    id="location_customer_address"
                    size="sm"
                    v-model="customer.address"
                    readonly
                  ></BFormInput>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('City')"
                  label-for="location_customer_city"
                >
                  <BFormInput
                    id="location_customer_city"
                    size="sm"
                    v-model="customer.city"
                    readonly
                  ></BFormInput>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Country')"
                  label-for="location_customer_country_code"
                >
                  <BFormInput
                    id="location_customer_country_code"
                    size="sm"
                    v-model="customer.country_code"
                    readonly
                  ></BFormInput>
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row v-if="branch && hasBranches">
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Branch')"
                  label-for="location_branch_name"
                >
                  <BFormInput
                    id="location_branch_name"
                    size="sm"
                    v-model="branch.name"
                    readonly
                  ></BFormInput>
                </BFormGroup>
              </b-col>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Address')"
                  label-for="location_branch_address"
                >
                  <BFormInput
                    id="location_branch_address"
                    size="sm"
                    v-model="branch.address"
                    readonly
                  ></BFormInput>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('City')"
                  label-for="location_branch_city"
                >
                  <BFormInput
                    id="location_branch_city"
                    size="sm"
                    v-model="branch.city"
                    readonly
                  ></BFormInput>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Country')"
                  label-for="location_branch_country_code"
                >
                  <BFormInput
                    id="location_branch_country_code"
                    size="sm"
                    v-model="branch.country_code"
                    readonly
                  ></BFormInput>
                </BFormGroup>
              </b-col>
            </b-row>
          </div>
          <div class="panel col-2-3">
            <h6>{{ $trans('Location') }}</h6>
            <b-row>
              <b-col cols="8" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Location name')"
                  label-for="location-name"
                >
                  <BFormInput
                    v-model="location.name"
                    id="location-name"
                    size="sm"
                    ref="name"
                    :state="isSubmitClicked ? !v$.location.name.$error : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.location.name.$error : null">
                    {{ $trans('Please enter a name') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col size="4">
                <BFormGroup
                  v-bind:label="$trans('Building')"
                  label-size="sm"
                  label-for="location_building"
                >
                  <BFormSelect
                    id="location_building"
                    v-model="location.building"
                    :options="buildings"
                    size="sm"
                    value-field="id"
                    text-field="name"
                  ></BFormSelect>
                </BFormGroup>
              </b-col>
            </b-row>

            <div class="documents section" style="margin-top:2em">
              <DocumentsComponent
                :location="location"
                :is-view="false"
              />
            </div>
          </div>


        </b-form>
      </b-overlay>
    </div>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import Multiselect from 'vue-multiselect'
import AwesomeDebouncePromise from 'awesome-debounce-promise'

import { LocationService, LocationModel } from '@/models/equipment/location'
import { CustomerService } from "@/models/customer/Customer";
import { BranchService } from "@/models/company/Branch";
import { BuildingService } from "@/models/equipment/building";
import DocumentsComponent from "@/views/equipment/equipment_form/DocumentsComponent.vue";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

export default {
  components: {
    DocumentsComponent,
    Multiselect,
  },
  setup() {
    const {create} = useToast()
    return {
      v$: useVuelidate(),
      create
    }
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
      location: new LocationModel(),

      getCustomersDebounced: null,
      customersSearch: [],
      customer: null,

      getBranchesDebounced: null,
      branchesSearch: [],
      branch: null,
      buildings: [],
      branchService: new BranchService(),
      buildingService: new BuildingService(),
      customerService: new CustomerService(),
      locationService: new LocationService()
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

    if (!this.isCreate) {
      await this.loadData()
    } else {
      this.location = new LocationModel()
    }
  },
  methods: {
    // customers
    async getCustomers(query) {
      try {
        this.customersSearch = await this.customerService.search(query)
      } catch(error) {
        console.log('Error fetching customers', error)
        errorToast(this.create, $trans('Error fetching customers'))
      }
    },
    customerLabel({ name, city}) {
      return `${name} - ${city}`
    },
    async selectCustomer(option) {
      this.location.customer = option.id
      this.customer = option
      this.buildings = await this.buildingService.listForSelectCustomer(option.id)
      this.$refs.name.focus()
    },
    // branches
    async getBranches(query) {
      try {
        this.branchesSearch = await this.branchService.search(query)
      } catch(error) {
        console.log('Error fetching branches', error)
        errorToast(this.create, $trans('Error fetching branches'))
      }
    },
    branchLabel({ name, city}) {
      return `${name} - ${city}`
    },
    async selectBranch(option) {
      this.location.branch = option.id
      this.branch = option
      this.buildings = await this.buildingService.listForSelectBranch(option.id)
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
          await this.locationService.insert(this.location)
          infoToast(this.create, $trans('Created'), $trans('Location has been created'))
          this.buttonDisabled = false
          this.isLoading = false

          if (isBulk) {
            let empty = new LocationModel()
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
          errorToast(this.create, $trans('Error creating location'))
          this.buttonDisabled = false
          this.isLoading = false
        }

        return
      }

      try {
        await this.locationService.update(this.pk, this.location)
        infoToast(this.create, $trans('Updated'), $trans('Location has been updated'))
        this.buttonDisabled = false
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating location', error)
        errorToast(this.create, $trans('Error updating location'))
        this.buttonDisabled = false
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.location = await this.locationService.detail(this.pk)
        if (this.hasBranches && !this.isEmployee) {
          this.branch = await this.branchService.detail(this.location.branch)
          this.buildings = await this.buildingService.listForSelectBranch(this.branch.id)
        }
        if (!this.hasBranches && !this.isCustomer) {
          this.customer = await this.customerService.detail(this.location.customer)
          this.buildings = await this.buildingService.listForSelectCustomer(this.customer.id)
        }
        this.isLoading = false
      } catch(error) {
        console.log('error fetching location', error)
        errorToast(this.create, $trans('Error fetching location'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
