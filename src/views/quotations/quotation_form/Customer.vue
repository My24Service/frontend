<template>
  <b-overlay rounded="sm">
    <b-form>
      <h3>{{ $trans('Customer') }}</h3>
      <CustomerDetail
        v-if="!isCreate"
        :customer="customer"
      />
      <template v-if="isCreate">
        <b-row>
          <b-col cols="4" role="group">
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
          </b-col>
        </b-row>
        <b-row>
          <b-col :cols="4" role="group">
            <b-form-group
              label-size="sm"
              :label="$trans('Customer')"
              label-for="quotation_name"
            >
              <b-form-input
                v-model="quotation.quotation_name"
                id="quotation_name"
                size="sm"
                :state="isSubmitClicked ? !v$.quotation.quotation_name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.quotation.quotation_name.$error : null">
                {{ $trans('Please enter the customer') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Customer ID')"
              label-for="customer_id"
            >
              <b-form-input
                v-model="quotation.customer_id"
                readonly
                id="customer_id"
                size="sm"
                :state="isSubmitClicked ? !v$.quotation.customer_id.$error : null"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Address')"
              label-for="quotation_address"
            >
              <b-form-input
                id="quotation_address"
                size="sm"
                v-model="quotation.quotation_address"
                :state="isSubmitClicked ? !v$.quotation.quotation_address.$error: null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.quotation.quotation_address.$error : null">
                {{ $trans('Please enter the address') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Country')"
              label-for="quotation_country_code"
            >
              <b-form-select v-model="quotation.quotation_country_code" :options="countries" size="sm">
              </b-form-select>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Postal')"
              label-for="quotation_postal"
            >
              <b-form-input
                id="quotation_postal"
                size="sm"
                v-model="quotation.quotation_postal"
                :state="isSubmitClicked ? !v$.quotation.quotation_postal.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.quotation.quotation_postal.$error : null">
                {{ $trans('Please enter the postal') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('City')"
              label-for="quotation_city"
            >
              <b-form-input
                id="quotation_city"
                size="sm"
                v-model="quotation.quotation_city"
                :state="isSubmitClicked ? !v$.quotation.quotation_city.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.quotation.quotation_city.$error : null">
                {{ $trans('Please enter the city') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Reference')"
              label-for="quotation_reference"
            >
              <b-form-input
                id="quotation_reference"
                size="sm"
                v-model="quotation.quotation_reference"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Email')"
              label-for="quotation_email"
            >
              <b-form-input
                id="quotation_email"
                size="sm"
                v-model="quotation.quotation_email"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Mobile')"
              label-for="quotation_mobile"
            >
              <b-form-input
                id="quotation_mobile"
                size="sm"
                v-model="quotation.quotation_mobile"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Tel.')"
              label-for="quotation_tel"
            >
              <b-form-input
                id="quotation_tel"
                size="sm"
                v-model="quotation.quotation_tel"
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Contacts')"
              label-for="quotation_contact"
            >
              <b-form-textarea
                id="quotation_contact"
                v-model="quotation.quotation_contact"
                rows="3"
              ></b-form-textarea>
            </b-form-group>
          </b-col>
        </b-row>
      </template>
      <hr  v-if="quotationData"/>
      <QuotationLine
        v-if="quotationData"
        :quotationData="quotation"
        :submitQuotationLineform="submitQuotationLineform"
        @quotationSubmitted="(loading) => quotationSubmitted(loading)"
      />
      <div class="mx-auto">
        <footer class="modal-footer">
          <b-button
            @click="cancelForm"
            class="btn btn-secondary"
            type="button"
            variant="secondary"
          >
            {{ $trans('Cancel') }}
          </b-button>
          <b-button
            @click="submitForm"
            :disabled="isLoading"
            class="btn btn-primary"
            type="button"
            variant="primary"
          >
            {{ $trans('Submit') }}
          </b-button>
        </footer>
      </div>
    </b-form>
  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import moment from 'moment'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import Multiselect from 'vue-multiselect'
import QuotationLine from './QuotationLine.vue'
import customerModel from '../../../models/customer/Customer.js'
import OrderTypesSelect from '../../../components/OrderTypesSelect.vue'
import quotationService from '../../../models/quotations/Quotation.js'
import Collapse from '../../../components/Collapse.vue'
import {componentMixin} from "../../../utils";
import CustomerDetail from "@/components/CustomerDetail";


export default {
  mixins: [componentMixin],
  setup() {
    return { v$: useVuelidate() }
  },
  components: {
    Multiselect,
    OrderTypesSelect,
    Collapse,
    QuotationLine,
    CustomerDetail
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
      submitClicked: false,
      countries: [],
      quotation: quotationService.getFields(),
      errorMessage: null,
      customers: [],
      getCustomersDebounced: null,
      submitQuotationLineform : false
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
    isSubmitClicked() {
      return this.submitClicked
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
    customerLabel({ name, address, city}) {
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
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }
      this.buttonDisabled = true

      if (this.isCreate) {
        this.isLoading = true

        try {
          const quotation = await quotationService.insert(this.quotation)

          this.infoToast(this.$trans('Created'), this.$trans('Quotation has been created'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.push({ name: 'quotation-edit', params: { pk: quotation.id, is_new: true } })
        } catch(error) {
          console.log('Error creating quotation', error)
          this.errorToast(this.$trans('Error creating quotation'))
          this.isLoading = false
          this.buttonDisabled = false
          return
        }
      } else {
        this.submitQuotationLineform = true
      }
    },
    async getCustomers(query) {
      if (query === '') return
      this.isLoading = true

      try {
        this.customers = await customerModel.search(query)
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
    quotationSubmitted(loading) {
      this.submitQuotationLineform = false
      this.isLoading = loading
    }
  }
}
</script>
<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style scoped>
div.section {
  padding-bottom: 20px;
}
div.section-header {
  padding: 4px;
  background-color: lightblue;
}
div.section-header-icon {
  margin-top: -34px;
}
div.bottom {
  margin-bottom: 80px;
}
</style>
