<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="file-earmark-check-fill"></b-icon>
          <router-link :to="{name: 'quotation-list' }">{{ $trans('Quotations') }}</router-link> /
          <strong>{{ quotation.quotation_name }}</strong>
          <span class="dimmed">
          <span v-if="!isEdit && !quotation.id">{{ $trans('new') }}</span>
          <span v-if="isEdit && !quotation.id">{{ $trans('edit')}}</span>
        </span>
        </h3>
        <div class="flex-columns">
          <b-button @click="cancelForm" type="button" variant="secondary">
            {{ $trans('Cancel') }}</b-button>
          <b-button @click="submitQuotation" type="button" variant="primary">
            {{ $trans('Submit') }}</b-button>
        </div>
      </div>
    </header>
    <b-form v-if="!isLoading">
      <div class="page-detail">
        <div class="flex-columns">

          <div class="panel col-1-3">
            <Customer
              :quotation-data="quotation"
              :loading="isLoading"
              :customer="customer"
            />
          </div>

          <div class="panel col-1-3">
            <QuotationData
              v-if="quotation"
              :quotationData="quotation"
              :submitQuotationLineForm="submitQuotationLineForm"
              @quotationSubmitted="(loading) => quotationSubmitted(loading)"
            />
            <Chapter
              :quotation="quotation"
              :newChapter="newChapter"
              @chapterCreated="chapterCreated"
              @selectChapter="selectChapter"
            />
          </div>

          <div class="panel col-1-3">
            <QuotationLinesAndCosts
              v-if="loadChapterModel"
              quotation="quotation"
              customer="customer"
              chapter="loadChapterModel"
            />

          </div>
        </div>
      </div>
    </b-form>
  </div>
</template>

<script>
import {useVuelidate} from "@vuelidate/core";
import eventBus from '../../eventBus.js';

import { QuotationLineService } from '@/models/quotations/QuotationLine.js'
import { QuotationModel, QuotationService } from '@/models/quotations/Quotation'
import { CustomerModel, CustomerService } from "@/models/customer/Customer";
import { ChapterService, ChapterModel } from "@/models/quotations/Chapter";

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
} from "@/models/orders/Cost";

import QuotationData from "@/views/quotations/quotation_form/QuotationData.vue";
import Chapter from "@/views/quotations/quotation_form/Chapter.vue";
import ChapterModalVue from "@/views/quotations/quotation_form/ChapterModal.vue";
import QuotationLinesAndCosts from "@/views/quotations/quotation_form/QuotationLinesAndCosts.vue";

export default {
  name: 'QuotationForm',
  components: {
    Chapter,
    QuotationData,
    Customer,
    MaterialsCreate,
    Hours,
    Distance,
    CallOutCosts,
    QuotationLinesAndCosts
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
      quotation: new QuotationModel({}),
      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      invoice_default_margin: this.$store.getters.getInvoiceDefaultMargin,
      invoice_default_term_of_payment_days: this.$store.getters.getInvoiceDefaultTermOfPaymentDays,
      customerPk: null,
      customer: null,
      quotationLineCollection: [],
      quotationLineService: new QuotationLineService(),
      chapterService: new ChapterService(),
      quotationService: new QuotationService(),
      customerService: new CustomerService(),
      newChapter: new ChapterModel({}),
      submitQuotationLineForm : false,
      loadChapterModel: null
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
      await this.loadQuotation()
    }
  },
  methods: {
    chapterCreated(chapter) {
      this.quotation.chapters.push(chapter)
    },
    selectChapter(name) {
      const chapter = this.quotation.chapters.find((c) => c.name === name)
      this.loadChapterModel = chapter
    },
    quotationLineSubmitted () {
      this.newChapter = {}
    },
    quotationSubmitted(loading) {
      this.submitQuotationLineform = false
      this.isLoading = loading
    },

    // chapters
    async createChapter(chapter) {
      this.$refs['chapter-modal'].hide()
      try {
        chapter.quotation = this.quotationData.id
        this.isLoading = true
        this.newChapter = await this.chapterService.insert(chapter)
        this.infoToast(this.$trans('Created'), this.$trans('Chapter has been created'))
        this.isLoading = false
      } catch(error) {
        console.log('Error creating chapter', error)
        this.errorToast(this.$trans('Error creating chapter'))
        this.isLoading = false
      }
    },

    // customer
    async getCustomer(pk) {
      const customerData = await this.customerService.detail(pk)
      this.customer = new CustomerModel(customerData)
    },
    async loadQuotation() {
      this.isLoading = true

      try {
        const quotation = await this.quotationService.detail(this.quotationPK)
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
    },
    async submitQuotation () {
      this.isLoading = true
      this.$emit('quotationSubmitted', true)

      try {
        await this.quotationService.update(this.quotation.id, this.quotation)
        this.infoToast(this.$trans('Updated'), this.$trans('quotation has been updated'))
        this.isLoading = false
        this.$emit('quotationSubmitted', false)
        await this.$router.push({ name: 'quotation-list'})
      } catch(error) {
        console.log('error fetching quotation', error)
        this.errorToast(this.$trans('Error updating quotation'))
        this.isLoading = false
        this.$emit('quotationSubmitted', false)
      }
    }
  }
}
</script>
<style scoped>
</style>
