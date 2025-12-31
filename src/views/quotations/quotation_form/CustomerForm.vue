<template>
  <div>
    <h5>{{ $trans('Customer') }}</h5>
    <b-form>
      <b-form-group
        label-size="sm"
        label-class="p-sm-0"
        v-bind:label="$trans('Search existing address')"
        label-for="order-customer-search"
      >
        <multiselect
          id="order-customer-search"
          track-by="id"
          :placeholder="$trans('Type to search')"
          open-direction="bottom"
          :options="customers"
          :multiple="false"
          :loading="compLoading"
          :internal-search="false"
          :options-limit="30"
          :limit="10"
          :max-height="600"
          :hide-selected="true"
          @search-change="getCustomersDebounced"
          @select="selectCustomer"
          :custom-label="customerLabel"
        >
          <span slot="noResult">{{ $trans('Nothing found.') }}</span>
        </multiselect>
      </b-form-group>

      <b-form-group :label="$trans('Customer')"
          label-for="quotation_name"
          label-cols="3"
      >
        <b-input-group>
          <b-form-input
            v-model="quotation.quotation_name"
            id="quotation_name"

            :state="isSubmitClicked ? !v$.quotation.quotation_name.$error : null"
          ></b-form-input>
          <b-input-group-append>
            <b-form-input
              v-model="quotation.customer_id"
              readonly
              :title="$trans('Customer ID')"
              id="customer_id"
              style="max-width: 9ch"
              :state="isSubmitClicked ? !v$.quotation.customer_id.$error : null">
            </b-form-input>
          </b-input-group-append>
        </b-input-group>
        <b-form-invalid-feedback
          :state="isSubmitClicked ? !v$.quotation.quotation_name.$error : null">
          {{ $trans('Please enter the customer') }}
        </b-form-invalid-feedback>
      </b-form-group>

      <div v-if="quotation.customer_id">
        <b-form-group
          v-bind:label="$trans('Address')"
          label-for="order_address"
          label-cols="3"
        >
          <b-form-input
            id="order_address"
            v-model="quotation.quotation_address"
            :state="isSubmitClicked ? !v$.quotation.quotation_address.$error: null"
          ></b-form-input>
          <b-form-invalid-feedback
            :state="isSubmitClicked ? !v$.quotation.quotation_address.$error : null">
            {{ $trans('Please enter the address') }}
          </b-form-invalid-feedback>
        </b-form-group>

        <b-form-group
          v-bind:label="$trans('Postal')"
          label-for="order_postal"
          label-cols="3"
        >
          <b-form-input
            id="order_postal"
            v-model="quotation.quotation_postal"
            :state="isSubmitClicked ? !v$.quotation.quotation_postal.$error : null"
          ></b-form-input>
          <b-form-invalid-feedback
            :state="isSubmitClicked ? !v$.quotation.quotation_postal.$error : null">
            {{ $trans('Please enter the postal') }}
          </b-form-invalid-feedback>
        </b-form-group>

        <b-form-group
          v-bind:label="$trans('Country')"
          label-for="order_country_code"
          label-cols="3"
        >
          <b-form-select v-model="quotation.quotation_country_code" :options="countries" ></b-form-select>
        </b-form-group>

        <b-form-group
          v-bind:label="$trans('City')"
          label-for="order_city"
          label-cols="3"
        >
          <b-form-input
            id="order_city"

            v-model="quotation.quotation_city"
            :state="isSubmitClicked ? !v$.quotation.quotation_city.$error : null"
          ></b-form-input>
          <b-form-invalid-feedback
            :state="isSubmitClicked ? !v$.quotation.quotation_city.$error : null">
            {{ $trans('Please enter the city') }}
          </b-form-invalid-feedback>
        </b-form-group>

        <b-form-group
          v-bind:label="$trans('Contacts')"
          label-for="order_contact"
          label-cols="3">
          <b-form-input
            id="order_contact"
            v-model="quotation.quotation_contact">
          </b-form-input>
        </b-form-group>

        <b-form-group
          v-bind:label="$trans('Email')"
          label-for="order_email"
          label-cols="3"
        >
          <b-form-input
            id="order_email"

            v-model="quotation.quotation_email"
            placeholder="email address">
          </b-form-input>
        </b-form-group>

        <b-form-group
          v-bind:label="$trans('Mobile')"
          label-for="order_mobile"
          label-cols="3"
        >
          <b-form-input
            id="order_mobile"

            v-model="quotation.quotation_mobile"
          ></b-form-input>
        </b-form-group>

        <b-form-group
          v-bind:label="$trans('Phone')"
          label-for="order_tel"
          label-cols="3"
        >
          <b-form-input
            id="order_tel"

            v-model="quotation.quotation_tel"
          ></b-form-input>
        </b-form-group>
      </div>
    </b-form>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import moment from 'moment'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import Multiselect from 'vue-multiselect'


import OrderTypesSelect from '@/components/OrderTypesSelect.vue'
import Collapse from '@/components/Collapse.vue'
import CustomerDetail from "@/components/CustomerDetail";
import TotalsInputs from "@/components/TotalsInputs";

import {QuotationModel, QuotationService} from '@/models/quotations/Quotation'
import {CustomerService} from "@/models/customer/Customer";

import QuotationData from './QuotationData.vue'
import Chapter from './Chapter.vue'

export default {
  name: "CustomerForm",

  setup() {
    return { v$: useVuelidate() }
  },
  components: {
    Multiselect,
    OrderTypesSelect,
    Collapse,
    QuotationData,
    CustomerDetail,
    Chapter,
    TotalsInputs,
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
    quotationData: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false,
    },
    customer:{
      type: Object,
      default: null
    }
  },
  watch: {
    quotationData: {
      handler(newValue) {
        this.quotation = newValue
      },
      deep: true
    },
  },
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      isSubmitClicked: false,
      countries: [],
      quotation: new QuotationModel({}),
      errorMessage: null,
      customers: [],
      getCustomersDebounced: null,
      quotationService: new QuotationService(),
      customerService: new CustomerService()
    }
  },
  validations() {
    return {
      quotation: {
        customer_id: {
          required,
        },
        quotation_name: {
          required,
        },
        quotation_address: {
          required,
        },
        quotation_postal: {
          required,
        },
        quotation_city: {
          required,
        }
      }
    }
  },
  computed: {
    isCreate() {
      return !this.quotationData
    },
    compLoading () {
      return this.loading || this.isLoading
    }
  },
  async created () {
    const lang = this.$store.getters.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)
    this.getCustomersDebounced = AwesomeDebouncePromise(this.getCustomers, 500)
    this.countries = await this.$store.dispatch('getCountries')
  },
  mounted () {
    if (!this.isCreate) {
      this.quotation = this.quotationData
    }
  },
  methods: {
    customerLabel({ name, address, city }) {
      return `${name} - ${address} - ${city}`
    },
    async selectCustomer(option) {
      this.fillCustomer(option)
    },
    fillCustomer(customer) {
      this.quotation.customer_relation = customer.id
      this.quotation.customer_id = customer.customer_id
      this.quotation.quotation_name = customer.name
      this.quotation.quotation_address = customer.address
      this.quotation.quotation_city = customer.city
      this.quotation.quotation_postal = customer.postal
      this.quotation.quotation_country_code = customer.country_code
      this.quotation.quotation_tel = customer.tel
      this.quotation.quotation_mobile = customer.mobile
      this.quotation.quotation_email = customer.email
      this.quotation.quotation_contact = customer.contact
    },
    async reject() {
      this.cancelForm()
    },
    async submitForm() {
      this.buttonDisabled = true

      if (this.isCreate) {
        this.v$.$touch()
        const result = await this.v$.$validate()
        if (!result) {
          console.log('invalid?', this.v$.$invalid)
          return
        }
        this.isLoading = true

        try {
          const quotation = await this.quotationService.insert(this.quotation)

          this.infoToast(this.$trans('Created'), this.$trans('Quotation has been created'))
          this.buttonDisabled = false
          this.isLoading = false
          await this.$router.push({ name: 'quotation-edit-preliminary', params: { pk: quotation.id, is_new: true } })
        } catch(error) {
          console.log('Error creating quotation', error)
          this.errorToast(this.$trans('Error creating quotation'))
          this.isLoading = false
          this.buttonDisabled = false
        }
      }
    },
    async getCustomers(query) {
      if (query === '') return
      this.isLoading = true

      try {
        this.customers = await this.customerService.search(query)
        this.isLoading = false
      } catch(error) {
        console.log('Error fetching customers', error)
        this.errorToast(this.$trans('Error fetching customers'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.push({ name: 'quotation-list'})
    },

  }
}
</script>
<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style scoped>
</style>
