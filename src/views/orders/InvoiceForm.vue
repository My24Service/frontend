<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <b-icon-receipt-cutoff></b-icon-receipt-cutoff>
              <router-link
              :to="{name: 'order-invoice-list' }"
            >{{ $trans('Invoices') }}</router-link>
            /
            <span v-if="!isEdit">{{ $trans('New invoice') }}</span>
            <span v-if="isEdit">{{ $trans('Update invoice') }}</span>
            <span v-if="isEdit">
              <b-link
                class="btn btn-sm btn-primary"
                @click.prevent="showInvoiceDialog"
                target="_blank"
              >
                <b-icon icon="file-earmark"></b-icon>
                {{ $trans('View Invoice') }}
              </b-link>
            </span>
          </h3>
          <b-button-toolbar>
            <b-button @click="cancelForm" type="button" variant="outline">
              {{ $trans('Cancel') }}</b-button>
            <b-button @click="submitForm" type="button" variant="primary">
              {{ $trans('Submit') }}</b-button>
          </b-button-toolbar>
        </div>
      </header>

      <b-form v-if="!isLoading" class="page-detail flex-columns" @submit="(e) => {e.preventDefault(); return false;}">

        <div class="panel col-1-3">
          <div class="invoice-form-main">
            <h6>{{ $trans('Invoice recipient')}}</h6>
            <CustomerCard
              v-if="customer"
              :customer="customer"
            />

            <hr />

            <h6>{{ $trans('Invoice data')}}</h6>
            <b-form-group
              label-cols="5"
              v-bind:label="$trans('Reference')"
              label-for="invoice_reference"
            >
              <b-form-input
                v-model="invoice.reference"
                id="invoice_reference"
                size="sm"
              ></b-form-input>
            </b-form-group>


            <b-form-group

              label-cols="5"
              v-bind:label="$trans('Term of payment')"
              label-for="invoice_term_of_payment_days"
            >
              <b-input-group>

                <b-form-input
                id="invoice_term_of_payment_days"

                v-model="invoice.term_of_payment_days"
                type="number"
                >
                </b-form-input>
                <template #append>
                  <b-input-group-text
                  >
                    {{ $trans('days')}}
                  </b-input-group-text>
                </template>
              </b-input-group>
            </b-form-group>

            <b-form-group
              label-cols="5"
              v-bind:label="$trans('Description')"
              label-for="invoice_description"
            >
              <b-form-textarea
                id="invoice_description"
                v-model="invoice.description"
                rows="1"
              ></b-form-textarea>
            </b-form-group>

            <hr />

            <h6 class="total-text">{{ $trans('Invoice total') }}</h6>

            <TotalsInputs
              :total="invoice.total_dinero"
              :is-final-total="true"
              :vat="invoice.vat_dinero"
            />
          </div>
        </div>

        <div class="panel col-2-3">
          <InvoiceLine
            ref="invoice-lines"
            :invoice="invoice"
            :invoicePk="pk"
            @invoiceLineAdded="invoiceLineAdded"
            @invoiceLineDeleted="invoiceLineDeleted"
            @invoiceLinesLoaded="invoiceLinesLoaded"
            @updateInvoiceTotals="updateInvoiceTotals"
          />
          <details>
            <summary class="flex-columns space-between">
              <h6>{{ $trans('Manage prices') }}</h6>
              <b-icon-chevron-down></b-icon-chevron-down>
            </summary>
            <b-container fluid>
              <h5>{{ $trans("Materials") }}</h5>
              <b-row>
                <b-col cols="3" class="header">
                  {{ $trans("Name") }}
                </b-col>
                <b-col cols="2" class="header">
                  {{ $trans("Identifier") }}
                </b-col>
                <b-col cols="3" class="header ml-3">
                  {{ $trans("Purchase price ex.") }}
                </b-col>
                <b-col cols="3" class="header">
                  {{ $trans("Selling price ex.") }}
                </b-col>
                <b-col cols="1" />
              </b-row>
              <b-row v-for="material in material_models" :key="material.id">
                <b-col cols="3">
                  {{ material.name }}
                </b-col>
                <b-col cols="2">
                  {{ material.identifier }}
                </b-col>
                <b-col cols="3">
                  <PriceInput
                    v-model="material.price_purchase_ex"
                    :currency="default_currency"
                    @priceChanged="(val) => material.setPurchasePrice(val)"
                  />
                </b-col>
                <b-col cols="3">
                  <PriceInput
                    :ref="`selling_price_${material.id}`"
                    v-model="material.price_selling_ex"
                    :currency="default_currency"
                    @priceChanged="(val) => material.setSellingPrice(val)"
                  />
                </b-col>
                <b-col cols="1">
                  <p class="flex">
                    <b-button
                      :disabled="materialUpdating"
                      @click="() => { updateMaterial(material.id) }"
                      class="btn update-button"
                      size="sm"
                      type="button"
                      variant=""
                      :title="$trans('This will update the API')"
                    >
                      <b-spinner small v-if="materialUpdating"></b-spinner>
                      {{ $trans("Update") }}
                    </b-button>
                  </p>
                </b-col>
              </b-row>
            </b-container>

            <hr/>

            <b-container fluid>
              <h5>{{ $trans("Engineers") }}</h5>
              <b-row>
                <b-col cols="6" class="header">
                  {{ $trans("Name") }}
                </b-col>
                <b-col cols="4" class="header ml-3">
                  {{ $trans("Hourly price") }}
                </b-col>
                <b-col cols="2" />
              </b-row>
              <b-row v-for="user in engineer_models" :key="user.id">
                <b-col cols="6">
                  {{ user.full_name }}
                </b-col>
                <b-col cols="4">
                  <PriceInput
                    v-model="user.engineer.hourly_rate"
                    :currency="default_currency"
                    @priceChanged="(val) => user.engineer.setHourlyRate(val)"
                  />
                </b-col>
                <b-col cols="2">

                    <b-button
                      @click="() => { updateEngineer(user.id) }"
                      class="btn update-button"
                      size="sm"
                      type="button"
                      :title="$trans('This will update the API')"
                    >
                      {{ $trans("Update") }}
                    </b-button>

                </b-col>
              </b-row>
            </b-container>

            <hr/>

            <b-container fluid v-if="customer">
              <h5>{{ $trans("Prices for customer") }}</h5>
              <b-row>
                <b-col cols="7" class="header">
                  {{ $trans("Name") }}
                </b-col>
                <b-col cols="4" class="header ml-3">
                  {{ $trans("Price") }}
                </b-col>
                <b-col cols="1" />
              </b-row>
              <b-row>
                <b-col cols="7">
                  {{ $trans("Hourly rate engineer") }}
                </b-col>
                <b-col cols="4">
                  <PriceInput
                    v-model="customer.hourly_rate_engineer"
                    :currency="default_currency"
                    @priceChanged="(val) => customer.setHourlyRateEngineer(val)"
                  />
                </b-col>
                <b-col cols="1">
                  <p class="flex">
                    <b-button
                      @click="() => { updateCustomer() }"
                      class="btn update-button"
                      size="sm"
                      type="button"
                      :title="$trans('This will update the API')"
                    >
                      {{ $trans("Update") }}
                    </b-button>
                  </p>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="7">
                  {{ $trans("Call out costs") }}
                </b-col>
                <b-col cols="4">
                  <PriceInput
                    v-model="customer.call_out_costs"
                    :currency="default_currency"
                    @priceChanged="(val) => customer.setCallOutCosts(val)"
                  />
                </b-col>
                <b-col cols="1">
                  <p class="flex">
                    <b-button
                      @click="() => { updateCustomer() }"
                      class="btn update-button"
                      size="sm"
                      type="button"
                      :title="$trans('This will update the API')"
                    >
                      {{ $trans("Update") }}
                    </b-button>
                  </p>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="7">
                  {{ $trans("Price/KM") }}
                </b-col>
                <b-col cols="4">
                  <PriceInput
                    v-model="customer.price_per_km"
                    :currency="default_currency"
                    @priceChanged="(val) => customer.setPricePerKm(val)"
                  />
                </b-col>
                <b-col cols="1">
                  <p class="flex">
                    <b-button
                      @click="() => { updateCustomer() }"
                      class="btn update-button"
                      size="sm"
                      type="button"
                      :title="$trans('This will update the API')"
                    >
                      {{ $trans("Update") }}
                    </b-button>
                  </p>
                </b-col>
              </b-row>
            </b-container>
          </details>

          <details v-if="used_materials.length > 0">
            <summary class="flex-columns space-between">
              <h6>{{ $trans("Used materials") }}</h6>
              <b-icon-chevron-down></b-icon-chevron-down>
            </summary>
            <MaterialsComponent
              :order_pk="order_pk"
              :customer="customer"
              :material_models="material_models"
              :engineer_models="engineer_models"
              :used_materials="used_materials"
              @invoiceLinesCreated="invoiceLinesCreated"
              @emptyCollectionClicked="emptyCollectionClicked"
              :invoiceLinesParent="invoiceLines"
            />
          </details>

          <div v-if="order_pk">
            <HoursComponent v-if="activity_totals.work_total !== '00:00'"
              :order_pk="order_pk"
              :type="COST_TYPE_WORK_HOURS"
              :hours_total="activity_totals.work_total"
              :user_totals="activity_totals.user_totals"
              :engineer_models="engineer_models"
              :customer="customer"
              @invoiceLinesCreated="invoiceLinesCreated"
              @emptyCollectionClicked="emptyCollectionClicked"
              :invoiceLinesParent="invoiceLines"
            />

            <HoursComponent v-if="activity_totals.travel_total !== '00:00'"
              :order_pk="order_pk"
              :type="COST_TYPE_TRAVEL_HOURS"
              :hours_total="activity_totals.travel_total"
              :user_totals="activity_totals.user_totals"
              :engineer_models="engineer_models"
              :customer="customer"
              @invoiceLinesCreated="invoiceLinesCreated"
              @emptyCollectionClicked="emptyCollectionClicked"
              :invoiceLinesParent="invoiceLines"
            />

            <DistanceComponent v-if="activity_totals.distance_total > 0"
              :order_pk="order_pk"
              :customer="customer"
              :user_totals="activity_totals.user_totals"
              :engineer_models="engineer_models"
              :distance_total="activity_totals.distance_total"
              :invoice_default_price_per_km="invoice_default_price_per_km"
              @invoiceLinesCreated="invoiceLinesCreated"
              @emptyCollectionClicked="emptyCollectionClicked"
              :invoiceLinesParent="invoiceLines"
            />

            <HoursComponent v-if="activity_totals.extra_work_total !== '00:00'"
              :order_pk="order_pk"
              :type="COST_TYPE_EXTRA_WORK"
              :hours_total="activity_totals.extra_work_total"
              :user_totals="activity_totals.user_totals"
              :engineer_models="engineer_models"
              :customer="customer"
              @invoiceLinesCreated="invoiceLinesCreated"
              @emptyCollectionClicked="emptyCollectionClicked"
              :invoiceLinesParent="invoiceLines"
            />

            <HoursComponent v-if="activity_totals.actual_work_total !== '00:00'"
              :order_pk="order_pk"
              :type="COST_TYPE_ACTUAL_WORK"
              :hours_total="activity_totals.actual_work_total"
              :user_totals="activity_totals.user_totals"
              :engineer_models="engineer_models"
              :customer="customer"
              @invoiceLinesCreated="invoiceLinesCreated"
              @emptyCollectionClicked="emptyCollectionClicked"
              :invoiceLinesParent="invoiceLines"
            />
          </div>

          <details v-if="order_pk">
            <summary class="flex-columns space-between">
              <h6>{{ $trans('Call out costs') }}</h6>
              <b-icon-chevron-down></b-icon-chevron-down>
            </summary>
            <CallOutCostsComponent
              :order_pk="order_pk"
              :customer="customer"
              :invoice_default_call_out_costs="invoice_default_call_out_costs"
              @invoiceLinesCreated="invoiceLinesCreated"
              @emptyCollectionClicked="emptyCollectionClicked"
              :invoiceLinesParent="invoiceLines"
            />
            <br>
          </details>

        </div>

      </b-form>

      <b-modal ref="invoice-viewer" size="xl" v-b-modal.modal-scrollable>
        <div class="d-flex flex-row justify-content-center align-items-center iframe-loader"
            v-if="iframeLoading">
          <b-spinner medium></b-spinner>
        </div>
        <iframe
          :src="this.invoiceURL"
          style="min-height:720px; width: 100%;"
          frameborder="0"
          @load="iframeLoaded"
          v-show="!iframeLoading">
        </iframe>
        <template #modal-footer="{ ok }">
          <b-button class="btn button btn-secondary" @click="openInvoice()" target="_blank">
              {{ $trans('Open in a new tab') }}
          </b-button>
          <b-button
            v-if="!isCustomer && !isBranchEmployee"
            id="recreateInvoicePdf"
            @click="recreateInvoicePdf"
            :disabled="isGeneratingPDF"
            class="btn btn-secondary"
            type="button"
            variant="secondary"
          >
            <b-spinner small v-if="isGeneratingPDF"></b-spinner>
            {{ $trans('re-generate PDF') }}
          </b-button>
          <b-button
            v-if="!isCustomer && !isBranchEmployee && invoice.invoice_pdf_path"
            @click="downloadPdf"
            :disabled="loadingPdf"
            type="button"
            variant="primary"
          >
            <b-spinner small v-if="loadingPdf"></b-spinner>
            <b-icon icon="file-earmark-pdf"></b-icon>
            {{ $trans('Download PDF') }}
          </b-button>
          <!-- Emulate built in modal footer ok and cancel button actions -->
          <b-button @click="ok()" variant="primary">
            {{ $trans("close") }}
          </b-button>
        </template>
      </b-modal>
    </div>
  </b-overlay>
</template>

<script>
import my24 from '../../services/my24.js'
import { InvoiceService, InvoiceModel } from '../../models/orders/Invoice.js'
import { InvoiceLineService } from '../../models/orders/InvoiceLine.js'
import {toDinero} from "../../utils";
import PriceInput from "../../components/PriceInput";
import materialService, {MaterialModel} from "../../models/inventory/Material";
import engineerService, {RateEngineerUserModel} from "../../models/company/UserEngineer";
import customerService, {CustomerModel, CustomerPriceModel} from "../../models/customer/Customer";
import Collapse from "../../components/Collapse";
import invoiceMixin from "./invoice_form/mixin";
import HoursComponent from "./invoice_form/Hours";
import DistanceComponent from "./invoice_form/Distance";
import MaterialsComponent from "./invoice_form/Materials";
import CallOutCostsComponent from "./invoice_form/CallOutCosts";
import InvoiceLine from "./invoice_form/InvoiceLine";
import VAT from "./invoice_form/VAT";
import CustomerCard from "../../components/CustomerCard";
import {
  COST_TYPE_ACTUAL_WORK,
  COST_TYPE_EXTRA_WORK,
  COST_TYPE_TRAVEL_HOURS,
  COST_TYPE_WORK_HOURS
} from "../../models/orders/Cost";
import {INVOICE_LINE_TYPE_MANUAL} from "./invoice_form/constants";
import {useVuelidate} from "@vuelidate/core";
import TotalsInputs from "../../components/TotalsInputs";

export default {
  name: 'InvoiceForm',
  mixins: [invoiceMixin],
  components: {
    PriceInput,
    Collapse,
    HoursComponent,
    MaterialsComponent,
    DistanceComponent,
    CallOutCostsComponent,
    VAT,
    CustomerCard,
    TotalsInputs,
    InvoiceLine,
  },
  setup() {
    return { v$: useVuelidate() }
  },
  validations() {
    return {
      invoice: {}
    }
  },
  computed: {
    isEdit () {
      return !!this.pk
    },
  },
  props: {
    uuid: {
      type: [String],
      default: null
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

      iframeLoading: false,
      isGeneratingPDF: false,
      loadingPdf: false,
      isLoading: false,
      invoiceURL: '',
      invoiceLines: [],
      materialUpdating: false,
      submitClicked: false,
      invoice: new InvoiceModel({
        total: "0.00",
        total_currency: this.$store.getters.getDefaultCurrency,
        vat: "0.00",
        vat_currency: this.$store.getters.getDefaultCurrency,
        term_of_payment_days: this.$store.getters.getInvoiceDefaultTermOfPaymentDays,
      }),
      errorMessage: null,

      invoice_id: null,
      order_pk: null,

      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      invoice_default_term_of_payment_days: this.$store.getters.getInvoiceDefaultTermOfPaymentDays,

      invoice_default_partner_hourly_rate: null,
      invoice_default_partner_hourly_rate_dinero: null,

      invoice_default_call_out_costs: null,

      invoice_default_price_per_km: null,

      engineer_models: [],

      activity_totals: {},
      extra_work_totals: null,
      actual_work_totals: null,

      material_models: null,
      used_materials: [],

      customerPk: null,
      customer: null,

      invoiceService: new InvoiceService(),
      invoiceLineService: new InvoiceLineService(),
      deletedInvoiceLines: [],
      INVOICE_LINE_TYPE_MANUAL,
    }
  },
  async created() {
    this.isLoading = true

    if (this.isEdit) {
      await this.loadInvoice()
    }

    // get invoice data
    const invoiceData = await this.invoiceService.getData(this.uuid)

    // get customer
    this.customerPk = invoiceData.customer_pk
    await this.getCustomer()

    // set data in component
    this.invoice_id = invoiceData.invoice_id
    this.order_pk = invoiceData.order_pk
    this.invoice.order = this.order_pk

    this.activity_totals = invoiceData.activity_totals
    this.material_models = invoiceData.material_models.map((m) => new MaterialModel({
      ...m,
      default_currency: this.default_currency,
    }))

    this.used_materials = invoiceData.used_materials

    this.invoice_default_price_per_km = invoiceData.invoice_default_price_per_km
    this.invoice_default_call_out_costs = invoiceData.invoice_default_call_out_costs

    this.invoice_default_partner_hourly_rate = invoiceData.invoice_default_partner_hourly_rate
    this.invoice_default_partner_hourly_rate_dinero = toDinero(
      this.invoice_default_partner_hourly_rate,
      this.default_currency
    )

    // create engineer models
    this.engineer_models = invoiceData.engineer_models.map((m) => new RateEngineerUserModel({
      ...m,
      engineer: {...m.engineer, default_currency: this.default_currency}
    }))

    this.isLoading = false
  },
  methods: {
    async downloadPdf() {
      const url =  `/api/order/invoice/${this.invoice.id}/download_pdf/`
      this.loadingPdf = true;

      my24.downloadItem(
        url,
        'invoice.pdf',
        function() {
          this.loadingPdf = false;
        }.bind(this),
        'post'
      )
    },
    iframeLoaded() {
        this.iframeLoading = false;
    },
    getInvoiceURL() {
        const routeData = this.$router.resolve({
          name: 'order-invoice-view', params: { uuid: this.invoice.uuid }
        });
        return `${document.location.origin}/${routeData.href}`;
    },
    showInvoiceDialog() {
      this.iframeLoading = true;
      this.invoiceURL = this.getInvoiceURL();
      this.$refs['invoice-viewer'].show();
    },
    async recreateInvoicePdf() {
        this.isLoading = true;
        this.isGeneratingPDF = true;
        try {
            await this.invoiceService.recreateInvoicePdf(this.invoice.id);
            this.infoToast(this.$trans('Success'), this.$trans('Invoice pdf recreated'));
            await this.loadInvoice();
            this.isLoading = false;
            this.isGeneratingPDF = false;
        }
        catch (err) {
            console.log('Error recreating invoice pdf', err);
            this.errorToast(this.$trans('Error recreating invoice pdf'));
            this.isLoading = false;
            this.isGeneratingPDF = false;
        }
    },
    openInvoice() {
      const routeData = this.$router.resolve({
        name: 'order-invoice-view', params: { uuid: this.invoice.uuid }
      })
      window.open(`${document.location.origin}/${routeData.href}`, '_blank')
    },
    invoiceLineAdded() {
      this.invoiceLines = this.$refs['invoice-lines'].getInvoiceLines()
    },
    invoiceLineDeleted() {
      this.invoiceLines = []
      this.invoiceLines = this.$refs['invoice-lines'].getInvoiceLines()
    },
    invoiceLinesLoaded(invoiceLines) {
      this.invoiceLines = invoiceLines
    },
    // invoice lines
    updateInvoiceTotals(data) {
      let [total, vat] = data

      this.invoice.setPriceField('total', total)
      this.invoice.setPriceField('vat', vat)
    },
    invoiceLinesCreated(invoiceLines) {
      this.$refs['invoice-lines'].invoiceLinesCreated(invoiceLines)
      this.invoiceLines = this.$refs['invoice-lines'].getInvoiceLines()
    },
    emptyCollectionClicked(type) {
      this.$refs['invoice-lines'].emptyCollectionClicked(type)
      this.invoiceLines = this.$refs['invoice-lines'].getInvoiceLines()
    },
    // customer
    async getCustomer() {
      const customerData = await customerService.detail(this.customerPk)
      this.customer = new CustomerModel(
        {...customerData, default_currency: this.default_currency}
      )
    },
    async updateCustomer() {
      // use minimal model for patch
      const minimalModel = new CustomerPriceModel(this.customer)

      const customerData = await customerService.update(this.customerPk, minimalModel)
      this.customer = new CustomerModel(customerData)
      this.infoToast(this.$trans('Updated'), this.$trans('Customer data has been updated'))
    },
    // activity
    async updateEngineer(user_id) {
      let engineer_user = this.engineer_models.find((m) => m.id === user_id)
      const minimalModel = new RateEngineerUserModel(
        {...engineer_user, default_currency: this.default_currency}
      )

      let updatedEngineerUserJson = await engineerService.update(user_id, minimalModel)
      engineer_user.engineer.setPriceFields(updatedEngineerUserJson.engineer)

      this.infoToast(this.$trans('Updated'), this.$trans('Hourly rate engineer has been updated'))
    },
    // materials
    async updateMaterial(material_id) {
      this.materialUpdating = true
      let material = this.material_models.find((m) => m.id === material_id)
      delete material.image
      const updatedMaterialJson = await materialService.update(material_id, material)
      material.setPriceFields(updatedMaterialJson)

      this.infoToast(this.$trans('Updated'), this.$trans('Material prices have been updated'))
      this.materialUpdating = false
    },
    async submitForm() {
      this.isLoading = true

      if (!this.invoice.id) {
        try {
          let invoiceLines = this.$refs['invoice-lines'].getInvoiceLines()
          const invoice = await this.invoiceService.insert(this.invoice)

          for (let invoiceLine of invoiceLines) {
            invoiceLine.invoice = invoice.id
            await this.invoiceLineService.insert(invoiceLine)
          }

          this.infoToast(this.$trans('Created'), this.$trans('Invoice has been created'))
          this.isLoading = false
          await this.$router.push({
            name: 'order-invoice-edit',
            params: {pk: this.invoice.id, uuid: this.uuid}
          })
        } catch(error) {
          this.errorToast(this.$trans('Error creating invoice'))
          this.isLoading = false
        }

        return
      }

      try {
        let invoiceLineService = this.$refs['invoice-lines'].invoiceLineService
        await this.invoiceService.update(this.invoice.id, this.invoice)
        await invoiceLineService.updateCollection(this.invoice.id)

        this.infoToast(this.$trans('Updated'), this.$trans('Invoice has been updated'))
        window.location.reload()
      } catch(error) {
        console.log(error)
        this.errorToast(this.$trans('Error updated invoice'))
        this.isLoading = false
      }
    },
    async loadInvoice() {
      this.isLoading = true

      try {
        const data = await this.invoiceService.detail(this.pk)
        this.invoice = new InvoiceModel(data)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching invoice', error)
        this.errorToast(this.$trans('Error loading invoice'))
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
.vat {
  white-space: nowrap;
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
.listing { display: table; }
.listing li:not(.text-right) { display: table-row;}
.listing li:not(.text-right) span  {  display: table-cell;}
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
</style>
