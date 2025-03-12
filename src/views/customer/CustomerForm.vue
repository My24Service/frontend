<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="building"></b-icon>
          <span v-if="isCreate">{{ $trans('New customer') }}</span>
          <span v-else>{{ $trans('Edit customer') }}</span>
        </h3>
        <div class="flex-columns">
          <b-button @click="cancelForm" type="button" variant="secondary outline">
            {{ $trans('Cancel') }}</b-button>
          <b-button @click="submitForm" type="button" variant="primary">
            {{ $trans('Save') }}</b-button>
        </div>
      </div>
    </header>

    <div class="page-detail">
      <div class='flex-columns'>
        <div class='panel col-1-3'>
          <h6>{{ $trans('Customer details')}}</h6>
          <b-form-group
            label-cols="3"
            label-size="sm"
            :label="$trans('Customer ID')"
            label-for="customer_customer_id"
          >
            <b-form-input
              id="customer_customer_id"
              size="sm"
              v-model="customer.customer_id"
              :readonly="customerIdCreated"
              :state="isSubmitClicked ? !v$.customer.customer_id.$error : null"
            ></b-form-input>
            <p v-if="!customer.customer_id"><b-link @click="getNewCustomerIdFromLatest">{{ $trans('generate new') }}</b-link></p>
            <b-form-invalid-feedback
              :state="isSubmitClicked ? !v$.customer.customer_id.$error : null">
              {{ $trans('Please enter a customer ID') }}
            </b-form-invalid-feedback>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="3"
            v-bind:label="$trans('Ext. identifier')"
            label-for="customer_external_identifier"
          >
            <b-form-input
              id="customer_external_identifier"
              size="sm"
              v-model="customer.external_identifier"
            ></b-form-input>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="3"
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

          <b-form-group
            label-size="sm"
            label-cols="3"
            v-bind:label="$trans('Address')"
            label-for="customer_address"
          >
            <b-form-input
              id="customer_address"
              size="sm"
              :disabled="useBranchAddress"
              v-model="customer.address"
              :state="isSubmitClicked ? !v$.customer.address.$error : null"
            ></b-form-input>
            <b-form-invalid-feedback
              :state="isSubmitClicked ? !v$.customer.address.$error : null">
              {{ $trans('Please enter an address') }}
            </b-form-invalid-feedback>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="3"
            v-bind:label="$trans('Postal')"
            label-for="customer_postal"
          >
            <b-form-input
              id="customer_postal"
              size="sm"
              :disabled="useBranchAddress"
              v-model="customer.postal"
              :state="isSubmitClicked ? !v$.customer.postal.$error : null"
            ></b-form-input>
            <b-form-invalid-feedback
              :state="isSubmitClicked ? !v$.customer.postal.$error : null">
              {{ $trans('Please enter a postal') }}
            </b-form-invalid-feedback>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="3"
            v-bind:label="$trans('City')"
            label-for="customer_city"
          >
            <b-form-input
              id="customer_city"
              size="sm"
              :disabled="useBranchAddress"
              v-model="customer.city"
              :state="isSubmitClicked ? !v$.customer.city.$error : null"
            ></b-form-input>
            <b-form-invalid-feedback
              :state="isSubmitClicked ? !v$.customer.city.$error : null">
              {{ $trans('Please enter a city') }}
            </b-form-invalid-feedback>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="3"
            v-bind:label="$trans('Country')"
            label-for="customer_country"
          >
            <b-form-select
              :disabled="useBranchAddress"
              v-model="customer.country_code"
              :options="countries"
              size="sm"></b-form-select>

            <b-form-invalid-feedback
              :state="isSubmitClicked ? !v$.customer.country_code.$error : null">
              {{ $trans('Please select a country') }}
            </b-form-invalid-feedback>

          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="3"
            v-bind:label="$trans('Email')"
            label-for="customer_email"
          >
            <b-form-input
              id="customer_email"
              size="sm"
              v-model="customer.email"
            ></b-form-input>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="3"
            v-bind:label="$trans('Tel.')"
            label-for="customer_tel"
          >
            <b-form-input
              id="customer_tel"
              size="sm"
              v-model="customer.tel"
            ></b-form-input>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="3"
            v-bind:label="$trans('Mobile')"
            label-for="customer_mobile"
          >
            <b-form-input
              id="customer_mobile"
              size="sm"
              v-model="customer.mobile"
            ></b-form-input>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="3"
            v-bind:label="$trans('Contact')"
            label-for="customer_contact"
          >
            <b-form-input
              id="customer_contact"
              v-model="customer.contact"
              rows="5"
            ></b-form-input>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="3"
            v-bind:label="$trans('Remarks')"
            label-for="customer_remarks"
          >
            <b-form-textarea
              id="customer_remarks"
              v-model="customer.remarks"
              rows="5"
            ></b-form-textarea>
          </b-form-group>
        </div>

        <div class='panel col-1-3'>
          <h6>{{ $trans('Legal & Financial') }}</h6>
          <b-form-group
            label-size="sm"
            label-cols="6"
            v-bind:label="$trans('Maintenance contract')"
            label-for="customer_maintenance_contract"
          >
            <b-form-textarea
              id="customer_maintenance_contract"
              v-model="customer.maintenance_contract"
              rows="5"
            ></b-form-textarea>
          </b-form-group>



          <b-form-group
            label-cols="6"
            label-size="sm"
            v-bind:label="$trans('Standard hours/mins.')"
            label-for="customer_standard_hours_hour"
          >
            <b-input-group>

              <b-form-input
                id="customer_standard_hours_hour"
                size="sm"
                v-model="customer.standard_hours_hour"
                type="number"
              ></b-form-input>

              <template #append>
                <b-form-select v-model="customer.standard_hours_minute" :options="minutes" size="sm"></b-form-select>
              </template>
            </b-input-group>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="6"
            v-bind:label="$trans('Products without tax?')"
            label-for="customer_products_without_tax"
          >
            <b-form-checkbox
              id="customer_products_without_tax"
              v-model="customer.products_without_tax"
            >
            </b-form-checkbox>
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="6"
            v-bind:label="$trans('Hourly rate engineer')"
            label-for="customer_hourly_rate_engineer"
          >
            <PriceInput
              v-model="customer.hourly_rate_engineer"
              :currency="customer.hourly_rate_engineer_currency"
              :allow-empty="isCreate"
              @priceChanged="(val) => customer.setHourlyRateEngineer(val)"
            />
          </b-form-group>

          <b-form-group
            label-size="sm"
            label-cols="6"
            v-bind:label="$trans('Call out costs')"
            label-for="customer_hourly_rate_engineer"
          >
            <PriceInput
              v-model="customer.call_out_costs"
              :currency="customer.call_out_costs_currency"
              :allow-empty="isCreate"
              @priceChanged="(val) => customer.setCallOutCosts(val)"
            />
          </b-form-group>

          <DocumentsComponent
            v-if="customer.id"
            :customer="customer"
            :is-view="false"
          />
        </div>

        <div class='panel col-1-3'>
          <h6>{{ $trans('Orders') }}</h6>
          <div class="branch-section section" v-if="!isCreate && hasBranchPartners">
            <div class='flex-columns space-between'>
              <p>
                {{ $trans('Customer has ') }} {{ customer.num_orders }} {{ $trans('orders') }},
                {{ $trans('branch has') }} {{ selectedBranch ? selectedBranch.num_orders : 0 }} {{ $trans('orders') }}.
              </p>
              <b-button
                @click="syncOrders"
                type="button"
                variant="secondary"
                :disabled="syncingOrders"
                >
                <b-spinner v-if="syncingOrders" small></b-spinner>
                <b-icon-arrow-repeat v-else></b-icon-arrow-repeat>
                &nbsp; {{ $trans('Synchronize orders') }}
              </b-button>

            </div>
            <hr/>
            <details open>
              <summary class="flex-columns space-between">
                <h6>{{ $trans('branch') }} </h6><b-icon-chevron-down></b-icon-chevron-down>
              </summary>
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Partner')"
                label-for="customer_branch_partners"
              >
                <b-form-select
                  id="customer_branch_partners"
                  v-model="customer.branch_partner"
                  :options="branchPartners"
                  size="sm"
                ></b-form-select>
              </b-form-group>

              <b-form-group label="Branches" v-if="customer.branch_partner !== null && branches.length > 0">
                <b-form-radio
                  :key="branch.id"
                  v-for="branch in branches"
                  v-model="customer.branch_id"
                  name="branch"
                  :value="branch.id"
                >
                  {{ branch.name }} - {{ branch.city }} ({{ branch.country_code }})
                </b-form-radio>
              </b-form-group>
              <hr>
              <b-form-group v-if="customer.branch_partner !== null" >
                <p class="flex-columns space-between align-items-center">
                {{ $trans("Branch not listed? Create from customer data.") }}
                <b-button @click="createBranchFromCustomer" type="button" variant="secondary">
                  {{ $trans('Create') }}</b-button>
                </p>
              </b-form-group>
              <hr>
              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Use address from branch')"
                label-for="customer_use_branch_address"
              >
                <b-form-checkbox
                  id="customer_use_branch_address"
                  :value="true"
                  v-model="customer.use_branch_address"
                >
                </b-form-checkbox>
              </b-form-group>
            </details>
          </div>


        </div> <!-- .panel -->
      </div> <!-- .flex-columns -->
    </div> <!-- .page-detail-->
  </div><!-- .app-page -->
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'

import {CustomerModel, CustomerService} from '@/models/customer/Customer'
import partnerModel from '../../models/company/Partner.js'
import PriceInput from "../../components/PriceInput";
import DocumentsComponent from "@/views/customer/DocumentComponent.vue";

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
  components: {
    PriceInput,
    DocumentsComponent
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
        country_code: {
          required,
        }
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
      customer: new CustomerModel({}),
      customerService: new CustomerService(),
      errorMessage: null,
      branchPartners: [],
      branches: [],
      selectedBranch: null,
      syncingOrders: false
    }
  },
  watch: {
    customer: {
      async handler(val) {
        if (val.branch_partner) {
          await this.getBranchesForPartner()
        }
        if (val.branch_id) {
          this.selectedBranch = this.branches.find((branch) => branch.id === val.branch_id)
          if (!this.selectedBranch) {
            console.debug(`branch id ${val.branch_id} not found in`, this.branches)
          }
        }
      },
      deep: true
    }
  },
  computed: {
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    },
    hasBranchPartners() {
      return this.branchPartners.length > 0
    },
    useBranchAddress() {
      return this.hasBranchPartners && this.customer.branch_id !== null && this.customer.use_branch_address
    }
  },
  async created() {
    this.countries = await this.$store.dispatch('getCountries')
    const partnerData = await partnerModel.list()
    this.branchPartners = [{
      value: null,
      text: '-'
    }]
    const branchPartners = partnerData.results.filter((partner) => partner.partner_view.has_branches)
    for(let i=0;i<branchPartners.length; i++) {
      const txt = `${branchPartners[i].partner_view.companycode} - ${branchPartners[i].partner_view.city}`

      this.branchPartners.push({
        value: branchPartners[i].id,
        text: txt,
      })
    }

    if (this.isCreate) {
      this.customer = new CustomerModel({})
      const result = await this.customerService.getCustomerId()
      if (result.created) {
        this.customerIdCreated = true
        this.customer.customer_id = result.customer_id
      } else {
        this.customerIdCreated = false
      }
    } else {
      await this.loadData()
    }
  },
  methods: {
    async syncOrders() {
      this.syncingOrders = true
      try {
        const syncResult = await partnerModel.copy_customer_orders(this.pk, this.customer.branch_partner)
        await this.getBranchesForPartner()
        this.infoToast(this.$trans('Synced'), this.$trans('Orders synced'))
      } catch (error) {
        console.log('Error syncing orders', error)
        this.errorToast(this.$trans('Error syncing orders'))
      }
      this.syncingOrders = false
    },
    async createBranchFromCustomer() {
      if (confirm(this.$trans("Create branch from customer?"))) {
        const result = await partnerModel.createBranchFromCustomer(this.pk, this.customer.branch_partner)
        this.customer.branch_id = result.branch.id
        await this.getBranchesForPartner()
      }
    },
    async getBranchesForPartner() {
      const result = await partnerModel.getBranches(this.customer.branch_partner)
      this.branches = null
      this.branches = result.branches
      this.selectedBranch = this.branches.find((branch) => branch.id === this.customer.branch_id)
    },
    async getNewCustomerIdFromLatest() {
      const data = await this.customerService.getNewCustomerIdFromLatest()
      this.customer.customer_id = data.result.last_customer_id
    },
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
          await this.customerService.insert(this.customer)
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
        if (this.customer.branch_partner === null) {
          this.customer.branch_id = null
        }
        await this.customerService.update(this.pk, this.customer)
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
        const customerData = await this.customerService.detail(this.pk)
        this.customer = new CustomerModel(customerData)

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
