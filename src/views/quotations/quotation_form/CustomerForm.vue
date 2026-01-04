<template>
  <div>
    <h5>{{ $trans('Customer') }}</h5>
    <b-form>
      <BFormGroup
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
      </BFormGroup>

      <BFormGroup :label="$trans('Customer')"
          label-for="quotation_name"
          label-cols="3"
      >
        <b-input-group>
          <BFormInput
            v-model="quotation.quotation_name"
            id="quotation_name"

            :state="isSubmitClicked ? !v$.quotation.quotation_name.$error : null"
          ></BFormInput>
          <b-input-group-append>
            <BFormInput
              v-model="quotation.customer_id"
              readonly
              :title="$trans('Customer ID')"
              id="customer_id"
              style="max-width: 9ch"
              :state="isSubmitClicked ? !v$.quotation.customer_id.$error : null">
            </BFormInput>
          </b-input-group-append>
        </b-input-group>
        <b-form-invalid-feedback
          :state="isSubmitClicked ? !v$.quotation.quotation_name.$error : null">
          {{ $trans('Please enter the customer') }}
        </b-form-invalid-feedback>
      </BFormGroup>

      <div v-if="quotation.customer_id">
        <BFormGroup
          v-bind:label="$trans('Address')"
          label-for="order_address"
          label-cols="3"
        >
          <BFormInput
            id="order_address"
            v-model="quotation.quotation_address"
            :state="isSubmitClicked ? !v$.quotation.quotation_address.$error: null"
          ></BFormInput>
          <b-form-invalid-feedback
            :state="isSubmitClicked ? !v$.quotation.quotation_address.$error : null">
            {{ $trans('Please enter the address') }}
          </b-form-invalid-feedback>
        </BFormGroup>

        <BFormGroup
          v-bind:label="$trans('Postal')"
          label-for="order_postal"
          label-cols="3"
        >
          <BFormInput
            id="order_postal"
            v-model="quotation.quotation_postal"
            :state="isSubmitClicked ? !v$.quotation.quotation_postal.$error : null"
          ></BFormInput>
          <b-form-invalid-feedback
            :state="isSubmitClicked ? !v$.quotation.quotation_postal.$error : null">
            {{ $trans('Please enter the postal') }}
          </b-form-invalid-feedback>
        </BFormGroup>

        <BFormGroup
          v-bind:label="$trans('Country')"
          label-for="order_country_code"
          label-cols="3"
        >
          <BFormSelect v-model="quotation.quotation_country_code" :options="countries" ></BFormSelect>
        </BFormGroup>

        <BFormGroup
          v-bind:label="$trans('City')"
          label-for="order_city"
          label-cols="3"
        >
          <BFormInput
            id="order_city"

            v-model="quotation.quotation_city"
            :state="isSubmitClicked ? !v$.quotation.quotation_city.$error : null"
          ></BFormInput>
          <b-form-invalid-feedback
            :state="isSubmitClicked ? !v$.quotation.quotation_city.$error : null">
            {{ $trans('Please enter the city') }}
          </b-form-invalid-feedback>
        </BFormGroup>

        <BFormGroup
          v-bind:label="$trans('Contacts')"
          label-for="order_contact"
          label-cols="3">
          <BFormInput
            id="order_contact"
            v-model="quotation.quotation_contact">
          </BFormInput>
        </BFormGroup>

        <BFormGroup
          v-bind:label="$trans('Email')"
          label-for="order_email"
          label-cols="3"
        >
          <BFormInput
            id="order_email"

            v-model="quotation.quotation_email"
            placeholder="email address">
          </BFormInput>
        </BFormGroup>

        <BFormGroup
          v-bind:label="$trans('Mobile')"
          label-for="order_mobile"
          label-cols="3"
        >
          <BFormInput
            id="order_mobile"

            v-model="quotation.quotation_mobile"
          ></BFormInput>
        </BFormGroup>

        <BFormGroup
          v-bind:label="$trans('Phone')"
          label-for="order_tel"
          label-cols="3"
        >
          <BFormInput
            id="order_tel"

            v-model="quotation.quotation_tel"
          ></BFormInput>
        </BFormGroup>
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
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

import {QuotationModel, QuotationService} from '@/models/quotations/Quotation'
import {CustomerService} from "@/models/customer/Customer";
import {useMainStore} from "@/stores/main";

export default {
  name: "CustomerForm",
  setup() {
    const {create} = useToast()
    const mainStore = useMainStore()

    return {
      v$: useVuelidate(),
      create,
      mainStore
    }
  },
  components: {
    Multiselect,
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
    const lang = this.mainStore.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)
    this.getCustomersDebounced = AwesomeDebouncePromise(this.getCustomers, 500)
    this.countries = this.mainStore.getCountries
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

          infoToast(this.create, $trans('Created'), $trans('Quotation has been created'))
          this.buttonDisabled = false
          this.isLoading = false
          await this.$router.push({ name: 'quotation-edit-preliminary', params: { pk: quotation.id, is_new: true } })
        } catch(error) {
          console.log('Error creating quotation', error)
          errorToast(this.create, $trans('Error creating quotation'))
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
        errorToast(this.create, $trans('Error fetching customers'))
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
