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
          <b-button
            @click="submitQuotation"
            type="button"
            variant="primary"
          >
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
              v-if="quotation && quotation.customer_relation"
              :quotation="quotation"
              ref="quotationDataComponent"
            />

            <Chapter
              v-if="quotation.id"
              :quotation="quotation"
              @chapterCreated="chapterCreated"
              @loadChapterClicked="loadChapterClicked"
            />
          </div>

          <div class="panel col-1-3">
            <QuotationLinesAndCosts
              v-if="loadChapterModel"
              :quotation="quotation"
              :customer="customer"
              :chapter="loadChapterModel"
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

import {QuotationLineService} from '@/models/quotations/QuotationLine.js'
import {QuotationModel, QuotationService} from '@/models/quotations/Quotation'
import {CustomerModel, CustomerService} from "@/models/customer/Customer";
import {ChapterModel, ChapterService} from "@/models/quotations/Chapter";

import Customer from './quotation_form/Customer.vue'
import Hours from './quotation_form/Hours.vue'
import Distance from './quotation_form/Distance.vue'
import MaterialsCreate from './quotation_form/MaterialsCreate.vue'
import CallOutCosts from './quotation_form/CallOutCosts.vue'
import CostService, {
  COST_TYPE_ACTUAL_WORK,
  COST_TYPE_EXTRA_WORK,
  COST_TYPE_TRAVEL_HOURS,
  COST_TYPE_WORK_HOURS
} from "@/models/orders/Cost";

import QuotationData from "@/views/quotations/quotation_form/QuotationData.vue";
import Chapter from "@/views/quotations/quotation_form/Chapter.vue";
import QuotationLinesAndCosts from "@/views/quotations/quotation_form/QuotationLinesAndCosts.vue";
import {uuidv4} from "@/utils";

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

      loadChapterModel: null,

      customerService: new CustomerService(),

      quotationService: new QuotationService(),
      chapterService: new ChapterService(),
      costService: new CostService(),
      quotationLineService: new QuotationLineService(),
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
    // chapters
    async chapterCreated(newChapter) {
      this.quotation.chapters.push(newChapter)
      this.loadChapterModel = newChapter
    },
    loadChapterClicked(chapter) {
      this.loadChapterModel = chapter
    },

    // customer
    async getCustomer(pk) {
      const customerData = await this.customerService.detail(pk)
      this.customer = new CustomerModel(customerData)
    },
    async loadQuotation() {
      this.isLoading = true

      try {
        const quotation = new QuotationModel(await this.quotationService.detail(this.quotationPK))
        await this.getCustomer(quotation.customer_relation)


        this.quotation = quotation
        this.isLoading = false
      } catch(error) {
        console.log('error fetching quotation', error)
        this.errorToast(this.$trans('Error fetching quotation'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    },
    async submitQuotation () {
      if (!this.quotation.id) {
        this.isLoading = true
        const quotationData = this.$refs['quotationDataComponent'].getQuotationData()
        const quotation = {
          ...this.quotation,
          ...quotationData
        }
        const newQuotation = await this.quotationService.insert(quotation)
        this.isLoading = false
        await this.$router.push({ name: 'quotation-edit', params: {pk: newQuotation.id }})

        return
      }

      this.isLoading = true
      try {
        await this.quotationService.update(this.quotation.id, this.quotation)
        this.infoToast(this.$trans('Updated'), this.$trans('quotation has been updated'))
        this.isLoading = false
        await this.$router.push({ name: 'quotation-list'})
      } catch(error) {
        console.log('error fetching quotation', error)
        this.errorToast(this.$trans('Error updating quotation'))
        this.isLoading = false
      }
    }
  },
  beforeDestroy() {
    eventBus.$off('chapter-update')
  },
  mounted() {
    eventBus.$on('chapter-update', (newChapter) => {
      let quotation = this.quotation;
      for (let i=0; i<quotation.chapters.length; i++) {
        if (quotation.chapters[i].name === newChapter.name) {
          quotation.chapters[i] = newChapter
        }
      }

      this.quotation = {
        ...quotation
      }

      this.loadChapterModel = newChapter
    })

  },
}
</script>
<style scoped>
</style>
