<template>
  <div class="app-page">
    <b-modal
      id="quotation-definitive-modal"
      ref="quotation-definitive-modal"
      v-bind:title="$trans('Make definitive?')"
      v-if="!isView"
      @ok="doMakeDefinitive"
    >
      <p class="my-4">
        {{ $trans("Are you sure you want to make this quotation definitive?") }}
      </p>
      <p>
        <strong><i>{{ $trans("You won't be able to make changes after that") }}</i></strong>
      </p>
    </b-modal>

    <b-modal ref="quotation-viewer" size="xl" v-b-modal.modal-scrollable>
      <div class="d-flex flex-row justify-content-center align-items-center iframe-loader" v-if="iframeLoading">
        <b-spinner medium></b-spinner>
      </div>
      <iframe :src="quotationURL" style="min-height:720px; width: 100%;" frameborder="0" @load="iframeLoaded" v-show="!iframeLoading"></iframe>

      <template #modal-footer="{ ok }">
        <b-button class="btn button btn-secondary" @click="openQuotation()" target="_blank">
          {{ $trans('Open in a new tab') }}
        </b-button>
        <b-button
          class="btn button btn-danger"
          @click="showMakeDefinitiveModal"
          v-if="quotation.preliminary"
          variant="danger"
        >
          {{ $trans('Make definitive') }}
        </b-button>
        <!-- Emulate built in modal footer ok and cancel button actions -->
        <b-button @click="ok()" variant="primary">
          {{ $trans("close") }}
        </b-button>
      </template>
    </b-modal>

    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="file-earmark-check-fill"></b-icon>
          <router-link
            :to="{name: 'preliminary-quotations' }"
            v-if="quotation.preliminary"
          >{{ $trans('Quotations') }}</router-link>
          <router-link
            :to="{name: 'quotation-list' }"
            v-else
          >{{ $trans('Quotations') }}</router-link>
          /
          <strong>{{ quotation.quotation_name }}</strong>
          <span
            class="dimmed"
            v-if="!isView"
          >
            <span v-if="!isEdit && !quotation.id">{{ $trans('new') }}</span>
            <span v-if="isEdit && !quotation.id">{{ $trans('edit')}}</span>
          </span>
          <span v-if="quotation.id">
            <b-link
              class="btn btn-sm btn-primary"
              @click.prevent="showQuotationDialog"
              target="_blank"
            >
              <b-icon icon="file-earmark"></b-icon>
              {{ $trans('View quotation') }}
            </b-link>
          </span>
        </h3>
        <div
          class="flex-columns"
          v-if="!isView"
        >
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
    <b-form v-show="!isLoading">
      <div class="page-detail">

        <div class="flex-columns">

          <div class="panel col-1-3">

            <CustomerForm
              v-show="!isView"
              :quotation-data="quotation"
              :customer="customer"
              ref="customerFormComponent"
            />
            <CustomerView
              v-show="isView"
              :quotation="quotation"
            />

            <div v-if="isView && quotation.statuses">
              <hr/>
              <StatusesComponent
                :statuses="quotation.statuses"
              />
            </div>

          </div>

          <div class="panel col-1-3">
            <div v-if="loadChapterModel">
              <QuotationLine
                :chapter="loadChapterModel"
                :is-view="isView"
                ref="quotation-lines"
                @backToChapters="backToChapters"
                @quotationLineAdded="quotationLineAdded"
                @quotationLineDeleted="quotationLineDeleted"
                @quotationLinesLoaded="quotationLinesLoaded"
              />
            </div>
            <div v-else>
              <QuotationData
                v-if="quotation && quotation.customer_relation"
                :quotation="quotation"
                :is-view="isView"
                ref="quotationDataComponent"
              />

              <DocumentsComponent
                v-if="quotation && quotation.id"
                :quotation="quotation"
                :is-view="isView"
              />

            </div>

          </div>

          <div class="panel col-1-3">
            <div v-if="loadChapterModel">
              <h3>{{ $trans("Chapter costs") }}</h3>

              <MaterialsCreate
                :customer="customer"
                :chapter="loadChapterModel"
                :quotationLinesParent="quotationLines"
                :is-view="isView"
                @quotationLinesCreated="quotationLinesCreated"
                @quotationLineSubmitted="quotationLineSubmitted"
                class="component-margin"
              />

              <Hours
                :chapter="loadChapterModel"
                :customer="customer"
                :type="COST_TYPE_WORK_HOURS"
                :quotationLinesParent="quotationLines"
                :is-view="isView"
                @quotationLinesCreated="quotationLinesCreated"
                @quotationLineSubmitted="quotationLineSubmitted"
                class="component-margin"
              />

              <Hours
                :chapter="loadChapterModel"
                :customer="customer"
                :type="COST_TYPE_TRAVEL_HOURS"
                :quotationLinesParent="quotationLines"
                :is-view="isView"
                @quotationLinesCreated="quotationLinesCreated"
                @quotationLineSubmitted="quotationLineSubmitted"
                class="component-margin"
              />

              <Distance
                :quotation_pk="quotation.id"
                :chapter="loadChapterModel"
                :customer="customer"
                :quotationLinesParent="quotationLines"
                :is-view="isView"
                @quotationLinesCreated="quotationLinesCreated"
                @quotationLineSubmitted="quotationLineSubmitted"
                class="component-margin"
              />

              <CallOutCosts
                :chapter="loadChapterModel"
                :customer="customer"
                :quotationLinesParent="quotationLines"
                :is-view="isView"
                @quotationLinesCreated="quotationLinesCreated"
                @quotationLineSubmitted="quotationLineSubmitted"
                class="component-margin"
              />

            </div>
            <div v-else>
              <Chapter
                v-if="quotation.id"
                :quotation="quotation"
                :is-view="isView"
                @chapterCreated="chapterCreated"
                @loadChapterClicked="loadChapterClicked"
              />
            </div>
          </div>
        </div>
      </div>
    </b-form>
  </div>
</template>

<script>
import {useVuelidate} from "@vuelidate/core";

import {QuotationLineService} from '@/models/quotations/QuotationLine.js'
import {QuotationModel, QuotationService} from '@/models/quotations/Quotation'
import {CustomerModel, CustomerService} from "@/models/customer/Customer";
import {ChapterService} from "@/models/quotations/Chapter";

import CustomerForm from './quotation_form/CustomerForm.vue'
import Hours from './quotation_form/Hours.vue'
import Distance from './quotation_form/Distance.vue'
import MaterialsCreate from './quotation_form/MaterialsCreate.vue'
import CallOutCosts from './quotation_form/CallOutCosts.vue'
import CostService, {
  COST_TYPE_ACTUAL_WORK,
  COST_TYPE_EXTRA_WORK,
  COST_TYPE_TRAVEL_HOURS,
  COST_TYPE_WORK_HOURS,
} from "@/models/orders/Cost";

import QuotationData from "@/views/quotations/quotation_form/QuotationData.vue";
import Chapter from "@/views/quotations/quotation_form/Chapter.vue";
import QuotationLine from "@/views/quotations/quotation_form/QuotationLine.vue";
import DocumentsComponent from "@/views/quotations/quotation_form/DocumentsComponent.vue";
import CustomerView from "@/views/quotations/CustomerView.vue";
import StatusesComponent from "@/components/StatusesComponent.vue";

export default {
  name: 'QuotationForm',
  components: {
    DocumentsComponent,
    QuotationLine,
    Chapter,
    QuotationData,
    CustomerForm,
    CustomerView,
    MaterialsCreate,
    Hours,
    Distance,
    CallOutCosts,
    StatusesComponent,
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
    isView: {
      type: [Boolean],
      default: false
    },
    pk: {
      type: [String, Number],
      default: null
    }
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

      quotationLines: [],

      quotationURL: '',
      iframeLoading: true,
    }
  },
  computed: {
    isEdit () {
      return !this.isNew
    },
    isNew() {
      return !this.pk
    }
  },
  async created() {
    if (this.isEdit || this.isNew) {
      this.quotationPK = this.$route.params.pk
      await this.loadQuotation()
    }
  },
  methods: {
    iframeLoaded() {
      this.iframeLoading = false;
    },
    openQuotation() {
      window.open(this.getQuotationURL(), '_blank')
    },
    showMakeDefinitiveModal() {
      this.$refs['quotation-definitive-modal'].show()
    },
    async doMakeDefinitive() {
      await this.quotationService.makeDefinitive(this.quotation.id)
      await this.$router.push({ name: 'quotation-list'})
    },
    getQuotationURL() {
      const routeData = this.$router.resolve({ name: 'quotation-view', params: { pk: this.quotation.id } });
      return `${document.location.origin}/${routeData.href}`;
    },
    showQuotationDialog() {
      this.iframeLoading = true;
      this.quotationURL = this.getQuotationURL();
      this.$refs['quotation-viewer'].show();
    },
    // quotation lines
    quotationLinesCreated(quotationLines) {
      this.$refs['quotation-lines'].quotationLinesCreated(quotationLines)
      this.quotationLines = this.$refs['quotation-lines'].getQuotationLines()
    },
    quotationLineSubmitted() {
      this.quotationLines = this.$refs['quotation-lines'].getQuotationLines()
    },
    backToChapters() {
      this.quotationLines = []
      this.loadChapterModel = null
    },
    quotationLineAdded() {
      this.quotationLines = this.$refs['quotation-lines'].getQuotationLines()
    },
    quotationLineDeleted() {
      this.quotationLines = []
      this.quotationLines = this.$refs['quotation-lines'].getQuotationLines()
    },
    quotationLinesLoaded(quotationLines) {
      this.quotationLines = quotationLines
    },

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
        this.quotation = new QuotationModel(await this.quotationService.detail(this.quotationPK))
        await this.getCustomer(this.quotation.customer_relation)
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
      const quotationDataComponent = this.$refs['quotationDataComponent'];
      quotationDataComponent.isSubmitClicked = true
      quotationDataComponent.v$.$touch()

      if (quotationDataComponent.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      const customerFormComponent = this.$refs['customerFormComponent'];
      customerFormComponent.isSubmitClicked = true
      customerFormComponent.v$.$touch()

      if (customerFormComponent.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

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
        if (this.quotation.preliminary) {
          await this.$router.push({ name: 'preliminary-quotations'})
        } else {
          await this.$router.push({ name: 'quotation-list'})
        }
      } catch(error) {
        console.log('error fetching quotation', error)
        this.errorToast(this.$trans('Error updating quotation'))
        this.isLoading = false
      }
    }
  },
}
</script>
<style scoped>
.component-margin {
  margin-bottom: 10px;
}

.iframe-loader {
  min-height: 720px
}
iframe {
  min-height: 720px;
  width: 100%;
}
.iframe-loader {
  min-height: 720px
}
iframe {
  min-height: 720px;
  width: 100%;
}
</style>
