<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form v-if="!isLoading">
        <div v-if="isCreate">
          <h2>{{ $trans('New invoice') }}</h2>
        </div>

        <CustomerDetail
          :customer="customer"
        />

        <Collapse
          :title="$trans('Manage prices')"
        >
          <b-container fluid>
            <h3>{{ $trans("Materials") }}</h3>
            <b-row>
              <b-col cols="2" class="header">
                {{ $trans("Name") }}
              </b-col>
              <b-col cols="2" class="header">
                {{ $trans("Identifier") }}
              </b-col>
              <b-col cols="3" class="header ml-3">
                {{ $trans("Purchase price ex.") }}
              </b-col>
              <b-col cols="1" class="header">
                {{ $trans("Margin") }}
              </b-col>
              <b-col cols="3" class="header">
                {{ $trans("Selling price ex.") }}
              </b-col>
              <b-col cols="1" />
            </b-row>
            <b-row v-for="material in material_models" :key="material.id">
              <b-col cols="2">
                {{ material.name }}
              </b-col>
              <b-col cols="2">
                {{ material.identifier }}
              </b-col>
              <b-col cols="3">
                <b-container>
                  <b-row>
                    <b-col cols="10">
                      <PriceInput
                        v-model="material.price_purchase_ex"
                        :currency="material.price_purchase_ex_currency"
                        @priceChanged="(val) => material.setPurchasePrice(val) && updateMaterialTotals()"
                      />
                    </b-col>
                    <b-col cols="2">
                    </b-col>
                  </b-row>
                </b-container>
              </b-col>
              <b-col cols="1">
                <p class="flex pl-3">
                  <b-form-input
                    v-model="material.margin_perc"
                    size="sm"
                    class="input-margin"
                  ></b-form-input>
                  <span class="percentage-container">%</span>
                </p>
              </b-col>
              <b-col cols="3">
                <b-container>
                  <b-row>
                    <b-col cols="10">
                      <PriceInput
                        :ref="`selling_price_${material.id}`"
                        v-model="material.price_selling_ex"
                        :currency="material.price_selling_ex_currency"
                        @priceChanged="(val) => material.setSellingPrice(val) && updateMaterialTotals()"
                      />
                    </b-col>
                    <b-col cols="2">
                      <p class="flex">
                        <span class="value-container">
                          <b-link
                            @click="() => { material.recalcSelling() && updateMaterialTotals() }"
                            :title="`${$trans('Recalculate selling price with margin')}`"
                          >
                            <b-icon-arrow-repeat aria-hidden="true"></b-icon-arrow-repeat>
                          </b-link>
                        </span>
                      </p>
                    </b-col>
                  </b-row>
                </b-container>
              </b-col>
              <b-col cols="1">
                <p class="flex">
                  <b-button
                    @click="() => { updateMaterial(material.id) }"
                    class="btn btn-danger update-button"
                    size="sm"
                    type="button"
                    variant="danger"
                    :title="$trans('This will update the API')"
                  >
                    {{ $trans("Update") }}
                  </b-button>
                </p>
              </b-col>
            </b-row>
          </b-container>

          <hr/>

          <b-container fluid>
            <h3>{{ $trans("Engineers") }}</h3>
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
                  :currency="user.engineer.hourly_rate_currency"
                  @priceChanged="(val) => user.engineer.setHourlyRate(val) && updateHoursTotals()"
                />
              </b-col>
              <b-col cols="1">
                <p class="flex">
                  <b-button
                    @click="() => { updateEngineer(user.id) }"
                    class="btn btn-danger update-button"
                    size="sm"
                    type="button"
                    variant="danger"
                    :title="$trans('This will update the API')"
                  >
                    {{ $trans("Update") }}
                  </b-button>
                </p>
              </b-col>
            </b-row>
          </b-container>

          <hr/>

          <b-container fluid>
            <h3>{{ $trans("Prices for customer") }}</h3>
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
                  :currency="customer.hourly_rate_engineer_currency"
                  @priceChanged="(val) => customer.setHourlyRateEngineer(val) && updateHoursTotals()"
                />
              </b-col>
              <b-col cols="1">
                <p class="flex">
                  <b-button
                    @click="() => { updateCustomer() }"
                    class="btn btn-danger update-button"
                    size="sm"
                    type="button"
                    variant="danger"
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
                  :currency="customer.call_out_costs_currency"
                  @priceChanged="(val) => customer.setCallOutCosts(val) && updateHoursTotals()"
                />
              </b-col>
              <b-col cols="1">
                <p class="flex">
                  <b-button
                    @click="() => { updateCustomer() }"
                    class="btn btn-danger update-button"
                    size="sm"
                    type="button"
                    variant="danger"
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
                  :currency="customer.price_per_km_currency"
                  @priceChanged="(val) => customer.setPricePerKm(val)"
                />
              </b-col>
              <b-col cols="1">
                <p class="flex">
                  <b-button
                    @click="() => { updateCustomer() }"
                    class="btn btn-danger update-button"
                    size="sm"
                    type="button"
                    variant="danger"
                    :title="$trans('This will update the API')"
                  >
                    {{ $trans("Update") }}
                  </b-button>
                </p>
              </b-col>
            </b-row>
          </b-container>
        </Collapse>

        <hr/>

        <MaterialsComponent
          :customer="customer"
          :material_models="material_models"
          :engineer_models="engineer_models"
          :used_materials="used_materials"
          @invoiceLinesCreated="materialsInvoiceLinesCreated"
        />

        <hr/>

        <HoursComponent
          :type="HOURS_TYPE_WORK"
          :hours_total="activity_totals.work_total"
          :hours_total_secs="activity_totals.work_total_secs"
          :user_totals="activity_totals.user_totals"
          :engineer_models="engineer_models"
          :customer="customer"
          @invoiceLinesCreated="workHoursInvoiceLinesCreated"
        />

        <hr/>

        <HoursComponent
          :type="HOURS_TYPE_TRAVEL"
          :hours_total="activity_totals.travel_total"
          :hours_total_sesc="activity_totals.travel_total_secs"
          :user_totals="activity_totals.user_totals"
          :engineer_models="engineer_models"
          :customer="customer"
          @invoiceLinesCreated="travelHoursInvoiceLinesCreated"
        />

        <hr/>

        <DistanceComponent
          :customer="customer"
          :user_totals="activity_totals.user_totals"
          :engineer_models="engineer_models"
          :distance_total="activity_totals.distance_total"
          :invoice_default_price_per_km="invoice_default_price_per_km"
          @invoiceLinesCreated="distanceInvoiceLinesCreated"
        />

        <hr/>

        <HoursComponent
          :type="HOURS_TYPE_EXTRA_WORK"
          :hours_total="activity_totals.extra_work_total"
          :hours_total_secs="activity_totals.extra_work_total_secs"
          :user_totals="activity_totals.user_totals"
          :engineer_models="engineer_models"
          :customer="customer"
          @invoiceLinesCreated="extraWorkInvoiceLinesCreated"
        />

        <hr/>

        <HoursComponent
          :type="HOURS_TYPE_ACTUAL_WORK"
          :hours_total="activity_totals.actual_work_total"
          :hours_total_secs="activity_totals.actual_work_total_secs"
          :user_totals="activity_totals.user_totals"
          :engineer_models="engineer_models"
          :customer="customer"
          @invoiceLinesCreated="actualWorkInvoiceLinesCreated"
        />

        <hr/>

        <CallOutCostsComponent
          :customer="customer"
          :invoice_default_call_out_costs="invoice_default_call_out_costs"
          @invoiceLinesCreated="callOutCostsInvoiceLinesCreated"
        />

        <div class="invoice-lines">
          <h3>{{ $trans("Invoice lines") }}</h3>
          <b-row>
            <b-col cols="6" class="header">
              {{ $trans("Description") }}
            </b-col>
            <b-col cols="2" class="header">
              {{ $trans("Amount") }}
            </b-col>
            <b-col cols="2" class="header">
              {{ $trans("VAT") }}
            </b-col>
            <b-col cols="2" class="header">
              {{ $trans("Price") }}
            </b-col>
          </b-row>
          <b-row v-for="invoiceLine in invoiceLines" :key="invoiceLine.id">
            <b-col cols="6">
              <b-form-textarea
                v-model="invoiceLine.description"
                rows="2"
              ></b-form-textarea>
            </b-col>
            <b-col cols="2">
              <b-form-input
                v-model="invoiceLine.amount"
                size="sm"
              ></b-form-input>
            </b-col>
            <b-col cols="2">
              <b-form-input
                v-model="invoiceLine.vat"
                size="sm"
              ></b-form-input>
            </b-col>
            <b-col cols="2">
              <b-form-input
                v-model="invoiceLine.price"
                size="sm"
              ></b-form-input>
            </b-col>
          </b-row>
        </div>

        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="cancelForm" type="button" variant="secondary">
              {{ $trans('Cancel') }}</b-button>
            <b-button @click="submitForm" type="button" variant="primary">
              {{ $trans('Submit') }}</b-button>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import invoiceService from '../../models/orders/Invoice.js'
import invoiceLineService from '../../models/orders/InvoiceLine.js'
import { InvoiceLineModel } from '../../models/orders/InvoiceLine.js'
import {toDinero} from "../../utils";
import PriceInput from "../../components/PriceInput";
import materialService from "../../models/inventory/Material";
import { RateEngineerUserModel } from "../../models/company/UserEngineer";
import engineerService from "../../models/company/UserEngineer";
import customerService from "../../models/customer/Customer";
import { CustomerModel, CustomerPriceModel } from "../../models/customer/Customer";
import InvoiceFormTotals from './invoice_form/Totals';
import Collapse from "../../components/Collapse";
import invoiceMixin from "./invoice_form/mixin";
import HoursComponent from "./invoice_form/Hours";
import DistanceComponent from "./invoice_form/Distance";
import MaterialsComponent from "./invoice_form/Materials";
import CallOutCostsComponent from "./invoice_form/CallOutCosts";

import VAT from "./invoice_form/VAT";
import {
  HOURS_TYPE_ACTUAL_WORK,
  HOURS_TYPE_EXTRA_WORK,
  HOURS_TYPE_TRAVEL,
  HOURS_TYPE_WORK,
} from "./invoice_form/constants";
import CustomerDetail from "../../components/CustomerDetail";

export default {
  name: 'InvoiceForm',
  mixins: [invoiceMixin],
  components: {
    PriceInput,
    InvoiceFormTotals,
    Collapse,
    HoursComponent,
    MaterialsComponent,
    DistanceComponent,
    CallOutCostsComponent,
    VAT,
    CustomerDetail,
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
      HOURS_TYPE_EXTRA_WORK,
      HOURS_TYPE_ACTUAL_WORK,
      HOURS_TYPE_WORK,
      HOURS_TYPE_TRAVEL,

      isLoading: false,
      submitClicked: false,
      invoice: invoiceService.getFields(),
      errorMessage: null,

      order: null,
      member: null,
      invoice_id: null,

      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      invoice_default_margin: this.$store.getters.getInvoiceDefaultMargin,

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

      invoiceLines: [],
      deletedInvoiceLines: [],

    }
  },
  computed: {
    isCreate() {
      return !this.pk
    },
  },
  async created() {
    if (this.isCreate) {
      this.isLoading = true
      this.invoice = invoiceService.getFields()
      const invoiceData = await invoiceService.getData(this.uuid)

      this.customerPk = invoiceData.customer_pk
      await this.getCustomer()

      this.order = invoiceData.order
      this.member = invoiceData.member
      this.invoice_id = invoiceData.invoice_id

      this.activity_totals = invoiceData.activity_totals

      this.material_models = invoiceData.material_models
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
        margin_perc: this.invoice_default_margin
      }))

      this.isLoading = false
    } else {
      await this.loadInvoice()
    }
  },
  methods: {
    // invoice lines
    extraWorkInvoiceLinesCreated(invoiceLines) {

    },
    workHoursInvoiceLinesCreated(invoiceLines) {

    },
    travelHoursInvoiceLinesCreated(invoiceLines) {

    },
    actualWorkInvoiceLinesCreated() {

    },
    materialsInvoiceLinesCreated() {

    },
    distanceInvoiceLinesCreated() {

    },
    callOutCostsInvoiceLinesCreated() {

    },
    resetInvoiceLines() {

    },
    createInvoiceLinesFromConfig() {
    },
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
    // activity
    async updateEngineer(user_id) {
      let engineer_user = this.engineer_models.find((m) => m.id === user_id)
      const minimalModel = new RateEngineerUserModel(engineer_user)

      let updatedEngineerUserJson = await engineerService.update(user_id, minimalModel)
      engineer_user.engineer.setPriceFields(updatedEngineerUserJson.engineer)
      this.updateActivityTotals()

      this.infoToast(this.$trans('Updated'), this.$trans('Hourly rate engineer has been updated'))
    },
    // materials
    async updateMaterial(material_id) {
      let material = this.material_models.find((m) => m.id === material_id)
      delete material.image
      const updatedMaterialJson = await materialService.update(material_id, material)
      material.setPriceFields(updatedMaterialJson)
      this.updateTotals()

      this.infoToast(this.$trans('Updated'), this.$trans('Material prices have been updated'))
    },
    async submitForm() {
      this.isLoading = true

      if (this.isCreate) {
        try {
          const invoice = await invoiceService.insert(this.invoice)
          for (let invoiceLine of this.invoiceLines) {
            invoiceLine.invoice = invoice.id
            await invoiceLineModel.insert(invoiceLine)
          }
        } catch(error) {
          this.errorToast(this.$trans('Error creating invoice lines'))
          this.isLoading = false
        }

        this.infoToast(this.$trans('Created'), this.$trans('Invoice has been created'))
        this.isLoading = false
        await this.$router.push({name: 'order-invoice-view', params: {pk: this.pk}})

        return
      }

      try {
        await invoiceModel.update(this.pk, this.invoice)

        // invoiceLine create/update
        for (let invoiceLine of this.invoiceLines) {
          invoiceLine.order = this.pk
          if (invoiceLine.id) {
            await invoiceLineModel.update(invoiceLine.id, invoiceLine)
          } else {
            await invoiceLineModel.insert(invoiceLine)
          }
        }

        // invoiceLine delete
        for (const invoiceLine of this.deletedInvoiceLines) {
          if (invoiceLine.id) {
            await invoiceLineModel.delete(invoiceLine.id)
          }
        }

        this.infoToast(this.$trans('Updated'), this.$trans('Invoice has been updated'))
        this.isLoading = false
        await this.$router.push({name: 'order-invoice-view', params: {pk: this.pk}})
      } catch(error) {
        console.log('Error updating invoice', error)
        this.errorToast(this.$trans('Error updating invoice'))
        this.isLoading = false
      }
    },
    async loadInvoice() {
      this.isLoading = true

      try {
        this.invoice = await invoiceService.detail(this.pk)
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
.material_row {
  padding-bottom: 10px;
  padding-top: 5px;
  border-bottom: 1px silver solid;
}
.flex {
  display : flex;
  margin-top: auto;
}
.input-margin {
  width: 40px;
  padding: 1px;
  margin: 1px;
  text-align: center;
}
.value-container {
  padding-top: 4px;
  padding-right: 4px;
  padding-left: 4px;
}
.percentage-container {
  padding-top: 4px;
  padding-left: 4px;
}
.input-total-used {
  width: 90px;
  padding: 1px;
  margin: 1px;
  text-align: right;
}
.update-button {
  margin-bottom: 8px;
}
.header {
  font-size: 14px;
  font-weight: bold;
}
.total-text {
  font-size: 14px;
  font-weight: bold;
}
</style>
