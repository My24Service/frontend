<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <b-icon-receipt-cutoff></b-icon-receipt-cutoff>
            {{ $trans('New invoice') }}
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
            <h6>{{ $trans('Invoice Recepient')}}</h6>
            <CustomerCard
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

          <details open>
            <summary class="flex-columns space-between">
              <h6>{{ $trans('Invoice lines')}} </h6>
              <b-icon-chevron-down></b-icon-chevron-down>
            </summary>

            <ul class="listing invoice-lines" v-if="invoiceLineService.collection.length">
              <li class="headings">
                  <span>
                    {{ $trans("Description") }}
                  </span>
                  <span style="text-align: right">
                    {{ $trans("Amount") }}
                  </span>
                  <span style="text-align: right">
                    {{ $trans("Price") }}
                  </span>
                  
                  <span style="text-align: right">
                    {{ $trans("Total") }}
                  </span>
                  <span style="text-align: right">
                    {{ $trans("VAT") }}
                  </span>
                  <span></span>
                
              </li>

              <li v-for="invoiceLine in invoiceLineService.collection" :key="invoiceLine.id" class="listing-item">
                <span>
                  {{ invoiceLine.description }}
                </span>
                <span style="text-align: right">
                  {{ invoiceLine.amount }}
                </span>
                <span style="text-align: right">
                  {{ invoiceLine.price_text }}
                </span>
                <span style="text-align: right">
                  {{ invoiceLine.total_dinero.toFormat('$0.00') }}
                </span>
                <span style="text-align: right">
                  {{ invoiceLine.vat_dinero.toFormat('$0.00') }}
                </span>
                <span v-if="invoiceLine.type === INVOICE_LINE_TYPE_MANUAL" style="text-align: right;">
                  <b-link class="h5 mx-2" @click.prevent="deleteInvoiceLine(invoiceLine.id)">
                    <b-icon-trash></b-icon-trash>
                  </b-link>
                </span>
                <span v-else>&nbsp;</span>
              </li>

              <li v-if="invoiceLinesHaveTotals" >
                <i>
                  <b-icon-info-square-fill variant="primary"></b-icon-info-square-fill> 
                  * <span class="dimmed">{{ $trans("Prices are combined in totals") }}</span>
                </i>
              </li>
              
            </ul>
            <hr>
            <div class="new-invoice-line" v-if="invoiceLineService.editItem">
                <b-row>
                  <b-col cols="4" role="group">
                    <b-form-group
                      label-size="sm"
                      label-for="new-invoice-line-description"
                    >
                      <b-form-input
                        id="new-invoice-line-description"
                        size="sm"
                        v-model="invoiceLineService.editItem.description"
                        :placeholder="$trans('Item description')"
                      ></b-form-input>
                    </b-form-group>
                  </b-col>
                  <b-col cols="1" role="group">
                    <b-form-group
                      label-size="sm"
                      label-for="new-invoice-line-amount"
                    >
                      <b-form-input
                        @input="invoiceLineAmountChanged"
                        id="new-invoice-line-amount"
                        size="sm"
                        type="number"
                        v-model="invoiceLineService.editItem.amount"
                        :placeholder="$trans('Amount')"
                        
                      ></b-form-input>
                    </b-form-group>
                  </b-col>
                  <b-col cols="2" role="group">
                    <b-form-group
                      label-size="sm"
                      label-for="new-invoice-line-price"
                    >
                      <PriceInput
                        id="new-invoice-line-price"
                        v-model="invoiceLineService.editItem.price"
                        :currency="invoiceLineService.editItem.price_currency"
                        @priceChanged="(val) => invoiceLineService.editItem.setPriceField('price', val) && invoiceLineService.editItem.calcTotal()"
                      />
                    </b-form-group>
                  </b-col>
                  <b-col cols="2" role="group">
                    <b-form-group
                      label-size="sm"
                      label-for="new-invoice-line-total"
                    >
                      <b-form-input
                        id="new-invoice-line-total"
                        readonly
                        disabled
                        :value="invoiceLineService.editItem.total_dinero.toFormat('$0.00')"
                        size="sm"
                      ></b-form-input>
                    </b-form-group>
                  </b-col>
                  <b-col cols="2" role="group">
                    <b-form-group
                      class="flex-columns vat"
                      label-size="sm"
                      v-bind:label="$trans('VAT %')"
                      label-for="new-invoice-line-total"
                    >
                    <span class="flex-columns space-between align-items-center">
                      <VAT @vatChanged="changeVatTypeInvoiceLine" />

                      {{ invoiceLineService.editItem.vat_dinero.toFormat('$0.00') }}
                    </span>
                    </b-form-group>
                  </b-col>
                  <!--
                  <b-col cols="" role="group">
                    <b-form-group
                      label-size="sm"
                      v-bind:label="$trans('VAT')"
                      label-for="new-invoice-line-vat"
                    >
                      <b-form-input
                        id="new-invoice-line-vat"
                        readonly
                        disabled
                        :value="invoiceLineService.editItem.vat_dinero.toFormat('$0.00')"
                        size="sm"
                      ></b-form-input>
                    </b-form-group>
                  </b-col>
                -->
                  <b-col cols="1">
                    <b-form-group
                    label-size="sm"
                    
                    label-for="invoice-submit-button"
                    style="text-align: end;"
                    >
                      <b-button
                        v-if="invoiceLineService.isEdit"
                        @click="invoiceService.doEditCollectionItem"
                        class="btn "
                        size="sm" 
                        type="submit"
                        :disabled="!isInvoiceLineValid"
                        id="invoice-submit-button"
                      >
                        {{ $trans('Edit') }}
                      </b-button>
                      <b-button
                        v-else
                        @click="addInvoiceLine"
                        class="btn"
                        size="sm"
                        type="submit"
                        
                        :disabled="!isInvoiceLineValid"
                        id="invoice-submit-button"
                      >
                        {{ $trans('Add') }}
                      </b-button>
                    </b-form-group>
                  </b-col>
                </b-row>

            </div>
          </details>

          <details>
            <summary class="flex-columns space-between">
              <h6>{{ $trans('Manage prices') }}</h6>
              <b-icon-chevron-down></b-icon-chevron-down>
            </summary>
            <b-container fluid>
              <h5>{{ $trans("Materials") }}</h5>
              <b-row>
                <b-col cols="4" class="header">
                  {{ $trans("Name") }}
                </b-col>
                <b-col cols="3" class="header">
                  {{ $trans("Identifier") }}
                </b-col>
                <b-col cols="2" class="header ml-3">
                  {{ $trans("Purchase price ex.") }}
                </b-col>
                <b-col cols="2" class="header">
                  {{ $trans("Selling price ex.") }}
                </b-col>
                <b-col cols="1" />
              </b-row>
              <b-row v-for="material in material_models" :key="material.id">
                <b-col cols="4">
                  {{ material.name }}
                </b-col>
                <b-col cols="3">
                  {{ material.identifier }}
                </b-col>
                <b-col cols="2">
                  <PriceInput
                    v-model="material.price_purchase_ex"
                    :currency="default_currency"
                    @priceChanged="(val) => material.setPurchasePrice(val)"
                  />
                </b-col>
                <b-col cols="2">
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
                      @click="() => { updateMaterial(material.id) }"
                      class="btn update-button"
                      size="sm"
                      type="button"
                      variant=""
                      :title="$trans('This will update the API')"
                    >
                      {{ $trans("Update") }} asd
                    </b-button>
                  </p>
                </b-col>
              </b-row>
            </b-container>

            <hr/>

            <b-container fluid>
              <h5>{{ $trans("Engineers") }}</h5>
              <b-row>
                <b-col cols="9" class="header">
                  {{ $trans("Name") }}
                </b-col>
                <b-col cols="2" class="header ml-3">
                  {{ $trans("Hourly price") }}
                </b-col>
                <b-col cols="1" />
              </b-row>
              <b-row v-for="user in engineer_models" :key="user.id">
                <b-col cols="9">
                  {{ user.full_name }}
                </b-col>
                <b-col cols="2">
                  <PriceInput
                    v-model="user.engineer.hourly_rate"
                    :currency="default_currency"
                    @priceChanged="(val) => user.engineer.setHourlyRate(val)"
                  />
                </b-col>
                <b-col cols="1">
                  
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

            <b-container fluid>
              <h5>{{ $trans("Prices for customer") }}</h5>
              <b-row>
                <b-col cols="9" class="header">
                  {{ $trans("Name") }}
                </b-col>
                <b-col cols="2" class="header ml-3">
                  {{ $trans("Price") }}
                </b-col>
                <b-col cols="1" />
              </b-row>
              <b-row>
                <b-col cols="9">
                  {{ $trans("Hourly rate engineer") }}
                </b-col>
                <b-col cols="2">
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
                <b-col cols="9">
                  {{ $trans("Call out costs") }} 
                </b-col>
                <b-col cols="2">
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
                <b-col cols="9">
                  {{ $trans("Price/KM") }}
                </b-col>
                <b-col cols="2">
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
              <h6>Used Materials</h6>
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
              :invoiceLinesParent="invoiceLineService.collection"
            />
          </details>
          
          <HoursComponent v-if="activity_totals.work_total !== '00:00'"
            :order_pk="order_pk"
            :type="COST_TYPE_WORK_HOURS"
            :hours_total="activity_totals.work_total"
            :user_totals="activity_totals.user_totals"
            :engineer_models="engineer_models"
            :customer="customer"
            @invoiceLinesCreated="invoiceLinesCreated"
            @emptyCollectionClicked="emptyCollectionClicked"
            :invoiceLinesParent="invoiceLineService.collection"
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
            :invoiceLinesParent="invoiceLineService.collection"
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
            :invoiceLinesParent="invoiceLineService.collection"
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
            :invoiceLinesParent="invoiceLineService.collection"
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
            :invoiceLinesParent="invoiceLineService.collection"
          />

          <details>
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
              :invoiceLinesParent="invoiceLineService.collection"
            />
            <br>
          </details>

        </div>

      </b-form>
    </div>
  </b-overlay>
</template>

<script>
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

      activity_totals: null,
      extra_work_totals: null,
      actual_work_totals: null,

      material_models: null,
      used_materials: null,

      customerPk: null,
      customer: null,

      invoiceService: new InvoiceService(),
      invoiceLineService: new InvoiceLineService(),
      deletedInvoiceLines: [],
      INVOICE_LINE_TYPE_MANUAL,
    }
  },
  computed: {
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
    this.isLoading = true

    // init new model for manual entry
    this.invoiceLineService.modelDefaults = {
      price: '0.00',
      price_currency: this.$store.getters.getDefaultCurrency,
      total: '0.00',
      total_currency: this.$store.getters.getDefaultCurrency,
      vat: '0.00',
      vat_currency: this.$store.getters.getDefaultCurrency,
      vat_type: this.$store.getters.getInvoiceDefaultVat,
    }
    this.invoiceLineService.newEditItem()

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
    // invoice lines
    updateInvoiceTotals() {
      const total = this.invoiceLineService.getItemsTotal()
      const vat = this.invoiceLineService.getItemsTotalVAT()

      this.invoice.setPriceField('total', total)
      this.invoice.setPriceField('vat', vat)
    },
    addInvoiceLine() {
      this.invoiceLineService.editItem.id = this.getInvoiceLineId()
      this.invoiceLineService.editItem.type = this.INVOICE_LINE_TYPE_MANUAL
      this.invoiceLineService.editItem.price_text = this.invoiceLineService.editItem.price_dinero.toFormat('$0.00')
      this.invoiceLineService.addCollectionItem()
      this.updateInvoiceTotals()
    },
    deleteInvoiceLine(id) {
      this.invoiceLineService.deleteCollectionItemByid(id)
    },
    invoiceLineAmountChanged() {
      this.invoiceLineService.editItem.amount = this.invoiceLineService.editItem.amount.replace(',', '.')
      this.invoiceLineService.editItem.calcTotal()
    },
    changeVatTypeInvoiceLine(vat_type) {
      this.invoiceLineService.editItem.vat_type = vat_type
      this.invoiceLineService.editItem.calcTotal()
    },
    invoiceLinesCreated(invoiceLines) {
      if (invoiceLines.length > 0) {
        for (let invoiceLine of invoiceLines) {
          invoiceLine.id = this.getInvoiceLineId()
          // console.log(`id: ${id}`)
          this.invoiceLineService.collection.push(invoiceLine)
        }
        this.updateInvoiceTotals()
        const txt = invoiceLines.length === 1 ? this.$trans('invoice line') : this.$trans('invoice lines')
        this.infoToast(this.$trans('Added'), this.$trans(`${invoiceLines.length} ${txt} added`))
      }
    },
    emptyCollectionClicked(type) {
      this.invoiceLineService.collection = this.invoiceLineService.collection.filter((m) => m.type !== type)
      this.updateInvoiceTotals()
      this.infoToast(this.$trans('Removed'), this.$trans(`invoice lines removed`))
    },
    getInvoiceLineId() {
      if (this.invoiceLineService.collection.length === 0) {
        return 0
      }

      const maxInvoiceLine = this.invoiceLineService.collection.reduce(function(prev, current) {
        return (prev.id > current.id) ? prev : current
      })

      return maxInvoiceLine.id + 1
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
      let material = this.material_models.find((m) => m.id === material_id)
      delete material.image
      const updatedMaterialJson = await materialService.update(material_id, material)
      material.setPriceFields(updatedMaterialJson)

      this.infoToast(this.$trans('Updated'), this.$trans('Material prices have been updated'))
    },
    async submitForm() {
      this.isLoading = true

      try {
        const invoice = await this.invoiceService.insert(this.invoice)
        for (let invoiceLine of this.invoiceLineService.collection) {
          invoiceLine.invoice = invoice.id
          await this.invoiceLineService.insert(invoiceLine)
        }

        this.infoToast(this.$trans('Created'), this.$trans('Invoice has been created'))
        this.isLoading = false
        await this.$router.push({name: 'order-view', params: {pk: invoice.order}})
      } catch(error) {
        this.errorToast(this.$trans('Error creating invoice'))
        this.isLoading = false
      }
    },
    async loadInvoice() {
      this.isLoading = true

      try {
        this.invoice = await this.invoiceService.detail(this.pk)
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

</style>
