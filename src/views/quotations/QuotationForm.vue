<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form v-if="!isLoading">
        <h2 v-if="!isEdit">{{ $trans('New Quotation') }}</h2>
        <h2 v-if="isEdit">{{ $trans('Edit Quotation') }}</h2>
        <MaterialsCreate
          v-if="quotation"
          :quotation_pk="quotationPK"
          :loading="isLoading"
          :customer="customer"
          @quotationLinesCreated="quotationLinesCreated"
        />
        <hr v-if="quotation">
        <Hours
          v-if="quotation"
          :quotation_pk="quotationPK"
          :quotation="quotation"
          :loading="isLoading"
          :customer="customer"
          :type="COST_TYPE_WORK_HOURS"
          @quotationLinesCreated="quotationLinesCreated"
        />
        <hr v-if="quotation">
        <Hours
          v-if="quotation"
          :quotation_pk="quotationPK"
          :quotation="quotation"
          :loading="isLoading"
          :customer="customer"
          :type="COST_TYPE_TRAVEL_HOURS"
          @quotationLinesCreated="quotationLinesCreated"
        />
        <hr v-if="quotation">
        <Distance
          v-if="quotation"
          :quotation_pk="quotationPK"
          :quotation="quotation"
          :loading="isLoading"
          :customer="customer"
          @quotationLinesCreated="quotationLinesCreated"
        />
        <hr v-if="quotation">
        <CallOutCosts
          v-if="quotation"
          :quotation_pk="quotationPK"
          :quotation="quotation"
          :loading="isLoading"
          :customer="customer"
          @quotationLinesCreated="quotationLinesCreated"
        />
        <hr v-if="quotation">
        <Customer
          :quotation-data="quotation"
          :loading="isLoading"
          :customer="customer"
        />
      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import quotationLineService from '@/models/quotations/QuotationLine.js'
import quotationService, { QuotationModel } from '../../models/quotations/Quotation.js'
import customerService, { CustomerModel } from "../../models/customer/Customer";
import Customer from './quotation_form/Customer.vue'
import Hours from './quotation_form/Hours.vue'
import Distance from './quotation_form/Distance.vue'
import MaterialsCreate from './quotation_form/MaterialsCreate.vue'
import CallOutCosts from './quotation_form/CallOutCosts.vue'
import {
  COST_TYPE_ACTUAL_WORK,
  COST_TYPE_EXTRA_WORK,
  COST_TYPE_TRAVEL_HOURS,
  COST_TYPE_WORK_HOURS
} from "../../models/orders/Cost";
import {useVuelidate} from "@vuelidate/core";
import eventBus from '../../eventBus.js';


export default {
  name: 'QuotationForm',
  components: {
    Customer,
    MaterialsCreate,
    Hours,
    Distance,
    CallOutCosts
  },
  setup() {
    return { v$: useVuelidate() }
  },
  validations() {
    return {
      invoice: {}
    }
  },
  props: {
    uuid: {
      type: [String],
      default: null
    },
  },
  data () {
    return {
      COST_TYPE_WORK_HOURS,
      COST_TYPE_TRAVEL_HOURS,
      COST_TYPE_EXTRA_WORK,
      COST_TYPE_ACTUAL_WORK,
      isLoading: false,
      submitClicked: false,
      errorMessage: null,
      quotationPK: null,
      quotation: null,
      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      invoice_default_margin: this.$store.getters.getInvoiceDefaultMargin,
      invoice_default_term_of_payment_days: this.$store.getters.getInvoiceDefaultTermOfPaymentDays,
      customerPk: null,
      customer: null,
      quotationLineCollection: [],
      quotationLineService
    }
  },
  computed: {
    isEdit () {
      return !!this.$route?.params?.pk && !this.$route.params.is_new
    },
    isNew() {
      return !!this.$route?.params?.is_new
    }
  },
  async created() {
    if (this.isEdit || this.isNew) {
      this.quotationPK = this.$route.params.pk
      this.loadQuotation()
    }
  },
  methods: {
    // customer
    async getCustomer(pk) {
      const customerData = await customerService.detail(pk)
      this.customer = new CustomerModel(customerData)
    },
    async loadQuotation() {
      this.isLoading = true

      try {
        const quotation = await quotationService.detail(this.quotationPK)
        await this.getCustomer(quotation.customer_relation)
        this.quotation = new QuotationModel(quotation)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching quotation', error)
        this.errorToast(this.$trans('Error fetching quotation'))
        this.isLoading = false
      }
    },
    quotationLinesCreated(quotationLines) {
      eventBus.$emit('add-cost-quotationline', quotationLines)
    },
    updateQuotationLineCollection (collection) {
      this.quotationLineCollection = collection
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
.value-container {
  padding-top: 4px;
  padding-right: 4px;
  padding-left: 4px;
}
.update-button {
  margin-bottom: 8px;
}
.header {
  font-size: 14px;
  font-weight: bold;
}
.total-text {
  font-weight: bold;
}
</style>
