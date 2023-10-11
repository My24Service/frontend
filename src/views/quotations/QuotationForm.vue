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
        />
        <hr v-if="quotation">
        <Hours
          v-if="quotation"
          :quotation_pk="quotationPK"
          :quotation="quotation"
          :loading="isLoading"
          :type="COST_TYPE_WORK_HOURS"
        />
        <hr v-if="quotation">
        <Hours
          v-if="quotation"
          :quotation_pk="quotationPK"
          :quotation="quotation"
          :loading="isLoading"
          :type="COST_TYPE_TRAVEL_HOURS"
        />
        <hr v-if="quotation">
        <Distance
          v-if="quotation"
          :quotation_pk="quotationPK"
          :quotation="quotation"
          :loading="isLoading"
        />
        <hr v-if="quotation">
        <CallOutCosts
          v-if="quotation"
          :quotation_pk="quotationPK"
          :quotation="quotation"
          :loading="isLoading"
        />
        <hr v-if="quotation">
        <Customer
          :quotation-data="quotation"
          :loading="isLoading"
        />
      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import invoiceService from '../../models/orders/Invoice.js'
import invoiceLineService from '../../models/orders/InvoiceLine.js'
import quotationService from '../../models/quotations/Quotation.js'
import customerService, {CustomerModel, CustomerPriceModel} from "../../models/customer/Customer";
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
      invoice: new invoiceService.model({
        total: "0.00",
        total_currency: this.$store.getters.getDefaultCurrency,
        vat: "0.00",
        vat_currency: this.$store.getters.getDefaultCurrency,
        term_of_payment_days: this.$store.getters.getInvoiceDefaultTermOfPaymentDays,
      }),
      errorMessage: null,

      invoice_id: null,
      quotationPK: null,
      quotation: null,

      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      invoice_default_margin: this.$store.getters.getInvoiceDefaultMargin,
      invoice_default_term_of_payment_days: this.$store.getters.getInvoiceDefaultTermOfPaymentDays,

      invoice_default_partner_hourly_rate: null,
      invoice_default_partner_hourly_rate_dinero: null,

      invoice_default_call_out_costs: null,

      invoice_default_price_per_km: null,

      engineer_models: [],

      activity_totals: null,
      extra_work_totals: null,
      actual_work_totals: null,

      material_models: null,
      used_materials: null,

      customerPk: null,
      customer: null,

      invoiceService,
      invoiceLineService,
      deletedInvoiceLines: []
    }
  },
  computed: {
    isEdit () {
      return !!this.$route?.params?.pk
    },
    invoiceLinesHaveTotals() {
      return this.invoiceLineService.collection.find((line) => line.price_text === '*')
    },
    isInvoiceLineValid() {
      return this.invoiceLineService.editItem.description !== null
        && this.invoiceLineService.editItem.description !== ""
        && this.invoiceLineService.editItem.amount !== null
        && this.invoiceLineService.editItem.amount !== ""
    }
  },
  async created() {

    if (this.isEdit) {
      this.quotationPK = this.$route.params.pk
      this.loadQuotation()
    }
  },
  methods: {
    // customer
    async getCustomer() {
      const customerData = await customerService.detail(this.customerPk)
      this.customer = new CustomerModel(customerData)
    },
    async updateCustomer() {
      // use minimal model for patch
      const minimalModel = new CustomerPriceModel(this.customer)

      const customerData = await customerService.update(this.customerPk, minimalModel)
      this.customer = new CustomerModel(customerData)
      this.infoToast(this.$trans('Updated'), this.$trans('Customer data has been updated'))
    },
    async loadQuotation() {
      this.isLoading = true

      try {
        this.quotation = await quotationService.detail(this.quotationPK)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching quotation', error)
        this.errorToast(this.$trans('Error fetching quotation'))
        this.isLoading = false
      }
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
