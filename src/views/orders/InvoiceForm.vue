<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form v-if="!isLoading">
        <div v-if="isCreate">
          <h2>{{ $trans('New invoice') }}</h2>
        </div>

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
                    class="btn btn-primary update-button"
                    size="sm"
                    type="button"
                    variant="primary"
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
                  @priceChanged="(val) => user.engineer.setHourlyRate(val) && updateAllTotals()"
                />
              </b-col>
              <b-col cols="1">
                <p class="flex">
                  <b-button
                    @click="() => { updateEngineer(user.id) }"
                    class="btn btn-primary update-button"
                    size="sm"
                    type="button"
                    variant="primary"
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
                  @priceChanged="(val) => customer.setHourlyRateEngineer(val) && updateAllTotals()"
                />
              </b-col>
              <b-col cols="1">
                <p class="flex">
                  <b-button
                    @click="() => { updateCustomer() }"
                    class="btn btn-primary update-button"
                    size="sm"
                    type="button"
                    variant="primary"
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
                  @priceChanged="(val) => customer.setCallOutCosts(val) && updateAllTotals()"
                />
              </b-col>
              <b-col cols="1">
                <p class="flex">
                  <b-button
                    @click="() => { updateCustomer() }"
                    class="btn btn-primary update-button"
                    size="sm"
                    type="button"
                    variant="primary"
                  >
                    {{ $trans("Update") }}
                  </b-button>
                </p>
              </b-col>
            </b-row>
          </b-container>
        </Collapse>

        <hr/>

        <b-container fluid>
          <h3>{{ $trans("Used materials") }}</h3>
          <b-row>
            <b-col cols="2" class="header">
              {{ $trans("Engineer") }}
            </b-col>
            <b-col cols="2" class="header">
              {{ $trans("Material") }}
            </b-col>
            <b-col cols="1" class="header">
              {{ $trans("Amount") }}
            </b-col>
            <b-col cols="3" class="header">
              {{ $trans("Use price") }}
            </b-col>
            <b-col cols="1" class="header">
              {{ $trans("Margin") }}
            </b-col>
            <b-col cols="1" class="header">
              {{ $trans("VAT type") }}
            </b-col>
            <b-col cols="2" />
          </b-row>
          <b-row v-for="material in used_materials" :key="material.id" class="material_row">
            <b-col cols="2">
              {{ material.full_name }}
            </b-col>
            <b-col cols="2">
              {{ material.name }}
            </b-col>
            <b-col cols="1">
              {{ material.amount }}
            </b-col>
            <b-col cols="3">
              <b-form-radio-group
                @change="updateMaterialTotals()"
                v-model="material.usePrice"
              >
                <b-form-radio value="purchase">
                  Pur. {{ getMaterialPriceFor(material, "purchase").toFormat('$0.00') }}
                </b-form-radio>

                <b-form-radio value="selling">
                  Sel. {{ getMaterialPriceFor(material, "selling").toFormat('$0.00') }}
                </b-form-radio>

                <b-form-radio value="other">
                  <p class="flex">
                    {{ $trans("Other") }}:&nbsp;&nbsp;
                    <PriceInput
                      v-model="material.price_purchase_ex_other"
                      :currency="material.price_purchase_ex_other_currency"
                      @priceChanged="(val) => setPurchasePriceOther(val, material.material_id) && updateMaterialTotals()"
                    />
                  </p>
                </b-form-radio>
              </b-form-radio-group>
            </b-col>
            <b-col cols="1">
              <p class="flex">
                <b-form-input
                  @blur="updateMaterialTotals()"
                  v-model="material.margin_perc"
                  size="sm"
                  class="input-margin"
                ></b-form-input>
                <span class="percentage-container">%</span>
              </p>
            </b-col>
            <b-col cols="1">
              <b-form-select
                @change="updateMaterialTotals"
                :value="invoice_default_vat"
                v-model="material.vat_type"
                :options="vat_types" size="sm"
              ></b-form-select>
            </b-col>
            <b-col cols="2">
              <InvoiceFormTotals
                :total="material.total"
                :margin="material.margin"
                :vat="material.vat"
              />
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="10"/>
            <b-col cols="2">
              <InvoiceFormTotals
                :total="materialsTotal"
                :show-margin="false"
                :vat="materialsTotalVAT"
              />
            </b-col>
          </b-row>
        </b-container>

        <b-container fluid>
          <h3>{{ $trans("Activity") }}</h3>
          <b-row>
            <b-col cols="2" class="header">
              {{ $trans("Engineer") }}
            </b-col>
            <b-col cols="1" class="header">
              {{ $trans("Work hours") }}
            </b-col>
            <b-col cols="1" class="header">
              {{ $trans("Travel hours") }}
            </b-col>
            <b-col cols="1" class="header">
              {{ $trans("Total hours") }}
            </b-col>
            <b-col cols="3" class="header">
              {{ $trans("Engineer rate") }}
            </b-col>
            <b-col cols="1" class="header">
              {{ $trans("Margin") }}
            </b-col>
            <b-col cols="1" class="header">
              {{ $trans("VAT type") }}
            </b-col>
            <b-col cols="2" />
          </b-row>
          <b-row v-for="activity in activity_user_totals" :key="activity.user_id" class="material_row">
            <b-col cols="2">
              {{ getFullname(activity.user_id) }}
            </b-col>
            <b-col cols="1">
              {{ activity.work_total }}
            </b-col>
            <b-col cols="1">
              {{ activity.travel_total }}
            </b-col>
            <b-col cols="1">
              {{ activity.hours_total }}
            </b-col>
            <b-col cols="3">
              <b-form-radio-group
                @change="updateAllTotals()"
                v-model="activity.usePrice"
              >
                <b-form-radio value="engineer">
                  Engineer {{ getEngineerRateDinero(activity.user_id).toFormat("$0.00") }}
                </b-form-radio>

                <b-form-radio value="customer">
                  Customer
                  <span v-if="customer.hourly_rate_engineer_dinero">
                    {{ customer.hourly_rate_engineer_dinero.toFormat("$0.00") }}
                  </span>
                  <span v-if="!customer.hourly_rate_engineer_dinero">
                    {{ $trans('not set') }}
                  </span>
                </b-form-radio>

                <b-form-radio value="other">
                  <p class="flex">
                    {{ $trans("Other") }}:&nbsp;&nbsp;
                    <PriceInput
                      v-model="activity.engineer_rate_other"
                      :currency="activity.engineer_rate_other_currency"
                      @priceChanged="(val) => setEngineerPriceOther(val, activity.user_id) && updateAllTotals()"
                    />
                  </p>
                </b-form-radio>
              </b-form-radio-group>
            </b-col>
            <b-col cols="1">
              <p class="flex">
                <b-form-input
                  @blur="updateAllTotals()"
                  v-model="activity.margin_perc"
                  size="sm"
                  class="input-margin"
                ></b-form-input>
                <span class="percentage-container">%</span>
              </p>
            </b-col>
            <b-col cols="1">
              <b-form-select
                @change="updateAllTotals"
                :value="invoice_default_vat"
                v-model="activity.vat_type"
                :options="vat_types" size="sm"
              ></b-form-select>
            </b-col>
            <b-col cols="2">
              <InvoiceFormTotals
                :total="activity.total"
                :margin="activity.margin"
                :vat="activity.vat"
                />
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="10"/>
            <b-col cols="2">
              <InvoiceFormTotals
                :total="activityTotal"
                :show-margin="false"
                :vat="activityTotalVAT"
              />
            </b-col>
          </b-row>
        </b-container>

        <b-container fluid>
          <h3>{{ $trans("Extra work") }}</h3>
          <b-row>
            <b-col cols="3" class="header">
              {{ $trans("Engineer") }}
            </b-col>
            <b-col cols="2" class="header">
              {{ $trans("Hours") }}
            </b-col>
            <b-col cols="3" class="header">
              {{ $trans("Engineer rate") }}
            </b-col>
            <b-col cols="1" class="header">
              {{ $trans("Margin") }}
            </b-col>
            <b-col cols="1" class="header">
              {{ $trans("VAT type") }}
            </b-col>
            <b-col cols="2" />
          </b-row>
          <b-row v-for="extra_work in extraWorkUserTotals" :key="extra_work.user_id" class="material_row">
            <b-col cols="3">
              {{ getFullname(extra_work.user_id) }}
            </b-col>
            <b-col cols="2">
              {{ extra_work.work_total }}
            </b-col>
            <b-col cols="3">
              <b-form-radio-group
                @change="updateExtraWorkTotals()"
                v-model="extra_work.usePrice"
              >
                <b-form-radio value="engineer">
                  Engineer {{ getEngineerRateDinero(extra_work.user_id).toFormat("$0.00") }}
                </b-form-radio>

                <b-form-radio value="customer">
                  Customer
                  <span v-if="customer.hourly_rate_engineer_dinero">
                    {{ customer.hourly_rate_engineer_dinero.toFormat("$0.00") }}
                  </span>
                  <span v-if="!customer.hourly_rate_engineer_dinero">
                    {{ $trans('not set') }}
                  </span>
                </b-form-radio>

                <b-form-radio value="other">
                  <p class="flex">
                    {{ $trans("Other") }}:&nbsp;&nbsp;
                    <PriceInput
                      v-model="extra_work.engineer_rate_other"
                      :currency="extra_work.engineer_rate_other_currency"
                      @priceChanged="(val) => setEngineerPriceOther(val, extra_work.user_id) && updateExtraWorkTotals()"
                    />
                  </p>
                </b-form-radio>
              </b-form-radio-group>
            </b-col>
            <b-col cols="1">
              <p class="flex">
                <b-form-input
                  @blur="updateExtraWorkTotals()"
                  v-model="extra_work.margin_perc"
                  size="sm"
                  class="input-margin"
                ></b-form-input>
                <span class="percentage-container">%</span>
              </p>
            </b-col>
            <b-col cols="1">
              <b-form-select
                @change="updateExtraWorkTotals"
                :value="invoice_default_vat"
                v-model="extra_work.vat_type"
                :options="vat_types" size="sm"
              ></b-form-select>
            </b-col>
            <b-col cols="2">
              <InvoiceFormTotals
                :total="extra_work.total"
                :margin="extra_work.margin"
                :vat="extra_work.vat"
              />
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="10"/>
            <b-col cols="2">
              <InvoiceFormTotals
                :total="extraWorkTotal"
                :show-margin="false"
                :vat="extraWorkTotalVAT"
              />
            </b-col>
          </b-row>
        </b-container>

        <hr/>

        <div class="use-on-invoice-container">
          <h3>{{ $trans("What to use as invoice lines") }}</h3>
          <b-form-group :label="$trans('Activity')">
            <b-form-radio-group
              v-model="useOnInvoiceActivitySelected"
              :options="useOnInvoiceActivityOptions"
            ></b-form-radio-group>
          </b-form-group>

          <b-form-group :label="$trans('Extra work')">
            <b-form-radio-group
              v-model="useOnInvoiceExtraWorkSelected"
              :options="useOnInvoiceExtraWorkOptions"
            ></b-form-radio-group>
          </b-form-group>

          <b-form-group :label="$trans('Used materials')">
            <b-form-radio-group
              v-model="useOnInvoiceUsedMaterialsSelected"
              :options="useOnInvoiceUsedMaterialsOptions"
            ></b-form-radio-group>
          </b-form-group>

          <b-form-group :label="$trans('Call out costs')">
            <b-form-radio-group
              v-model="useOnInvoiceCallOutCostsSelected"
              :options="useOnInvoiceCallOutCostsOptions"
            ></b-form-radio-group>
          </b-form-group>

          <div class="mx-auto">
            <footer class="modal-footer">
              <b-button @click="resetInvoiceLines" type="button" variant="secondary">
                {{ $trans('Rset') }}</b-button>
              <b-button @click="createInvoiceLinesFromConfig" type="button" variant="primary">
                {{ $trans('Create invoice lines') }}</b-button>
            </footer>
          </div>

        </div>

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
import memberModel from "../../models/member/Member";
import {toDinero} from "../../utils";
import PriceInput from "../../components/PriceInput";
import { MaterialModel } from "../../models/inventory/Material";
import materialService from "../../models/inventory/Material";
import { RateEngineerUserModel } from "../../models/company/UserEngineer";
import engineerService from "../../models/company/UserEngineer";
import customerService from "../../models/customer/Customer";
import { CustomerModel, CustomerPriceModel } from "../../models/customer/Customer";
import InvoiceFormTotals from './InvoiceFormTotals';
import Collapse from "../../components/Collapse";

const OPTION_USER_TOTALS = 'user_totals'
const OPTION_ACTIVITY_ACTIVITY_TOTALS = 'activity_totals'
const OPTION_ACTIVITY_ACTUAL_WORK = 'actual_work'
const OPTION_EXTRA_WORK_TOTALS = 'extra_work_totals'
const OPTION_USED_MATERIALS_TOTALS = 'used_materials_totals'
const OPTION_CALL_OUT_COSTS = 'call_out_costs'
const OPTION_NONE = 'none'

const INVOICE_LINE_TYPE_ACTIVITY = 'activity'
const INVOICE_LINE_TYPE_EXTRA_WORK = 'extra-work'
const INVOICE_LINE_TYPE_USED_MATERIALS = 'used-materials'
const INVOICE_LINE_TYPE_CALL_OUT_COSTS = 'call-out-costs'

export default {
  name: 'InvoiceForm',
  components: {
    PriceInput,
    InvoiceFormTotals,
    Collapse
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
      isLoading: false,
      submitClicked: false,
      invoice: invoiceService.getFields(),
      errorMessage: null,

      order: null,
      member: null,
      invoice_id: null,
      vat_types: [],
      default_currency: null,
      invoice_default_margin: null,
      invoice_default_hourly_rate: null,
      invoice_default_vat: null,
      invoice_default_call_out_costs: null,

      used_materials: [],
      material_models: [],
      materialsTotal: null,
      materialsTotalVAT: null,
      usePriceOptionsMaterial: [
        { text: this.$trans('Purchase'), value: 'purchase' },
        { text: this.$trans('Selling'), value: 'selling' },
      ],

      engineer_models: [],

      activity: [],
      activity_user_totals: [],
      activityTotal: null,
      activityTotalVAT: null,
      activityTotals: null,

      extraWork: [],
      extraWorkUserTotals: [],
      extraWorkTotal: null,
      extraWorkTotalVAT: null,
      extraWorkTotals: null,

      actualWork: [],
      actualWorkUserTotals: [],
      actualWorkTotals: null,
      actualWorkTotal: null,
      actualWorkTotalVAT: null,

      customerPk: null,
      customer: null,

      invoiceLines: [],
      deletedInvoiceLines: [],

      useOnInvoiceActivityOptions: [
        { text: this.$trans('User totals'), value: OPTION_USER_TOTALS },
        { text: this.$trans('Activity totals'), value: OPTION_ACTIVITY_ACTIVITY_TOTALS },
        { text: this.$trans('Actual work'), value: OPTION_ACTIVITY_ACTUAL_WORK },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnInvoiceActivitySelected: null,

      useOnInvoiceExtraWorkOptions: [
        { text: this.$trans('User totals'), value: OPTION_USER_TOTALS },
        { text: this.$trans('Extra work totals'), value: OPTION_EXTRA_WORK_TOTALS },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnInvoiceExtraWorkSelected: null,

      useOnInvoiceUsedMaterialsOptions: [
        { text: this.$trans('User totals'), value: OPTION_USER_TOTALS },
        { text: this.$trans('Used materials totals'), value: OPTION_USED_MATERIALS_TOTALS },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnInvoiceUsedMaterialsSelected: null,

      useOnInvoiceCallOutCostsOptions: [
        { text: this.$trans('Call out costs'), value: OPTION_CALL_OUT_COSTS },
        { text: this.$trans('None'), value: 'none' },
      ],
      useOnInvoiceCallOutCostsSelected: null,

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
      this.vat_types = await memberModel.getVATTypes()
      this.invoice = invoiceService.getFields()
      const invoiceData = await invoiceService.getData(this.uuid)

      this.customerPk = invoiceData.customer_pk
      await this.getCustomer()

      this.order = invoiceData.order
      this.member = invoiceData.member
      this.invoice_id = invoiceData.invoice_id
      this.default_currency = invoiceData.default_currency
      this.invoice_default_margin = invoiceData.invoice_default_margin
      this.invoice_default_hourly_rate = invoiceData.invoice_default_hourly_rate
      this.invoice_default_vat = invoiceData.invoice_default_vat
      this.invoice_default_call_out_costs = invoiceData.invoice_default_call_out_costs

      // materials
      this.used_materials = invoiceData.used_materials.map((m) => ({
        ...m,
        vat_type: this.invoice_default_vat,
        margin_perc:  this.invoice_default_margin,
        price_purchase_ex_other: "0.00",
        price_purchase_ex_other_currency: this.default_currency,
        price_purchase_ex_other_dinero: toDinero("0.00", this.default_currency),
        usePrice: 'purchase',
      }))

      this.material_models = invoiceData.material_models.map((m) => new MaterialModel({
          ...m,
        margin_perc: this.invoice_default_margin
      }))
      this.updateMaterialTotals()

      // activity
      this.activity = invoiceData.activity
      this.activityTotals = invoiceData.activity_totals
      this.engineer_models = invoiceData.engineer_models.map((m) => new RateEngineerUserModel({
        ...m,
        margin_perc: this.invoice_default_margin
      }))

      this.activity_user_totals = this.activityTotals.user_totals.map((a) => ({
        ...a,
        vat_type: this.invoice_default_vat,
        margin_perc: this.invoice_default_margin,
        engineer_rate: this.getEngineerRate(a.user_id),
        engineer_rate_currency: this.getEngineerRateCurrency(a.user_id),
        engineer_rate_dinero: this.getEngineerRateDinero(a.user_id),
        engineer_rate_other: "0.00",
        engineer_rate_other_currency: this.default_currency,
        engineer_rate_other_dinero: toDinero("0.00", this.default_currency),
        usePrice: 'engineer',
      }))

      // extra work
      this.extraWorkTotals = invoiceData.extra_work_totals
      this.extraWorkUserTotals = this.extraWorkTotals.user_totals.map((a) => ({
        ...a,
        vat_type: this.invoice_default_vat,
        margin_perc: this.invoice_default_margin,
        engineer_rate: this.getEngineerRate(a.user_id),
        engineer_rate_currency: this.getEngineerRateCurrency(a.user_id),
        engineer_rate_dinero: this.getEngineerRateDinero(a.user_id),
        engineer_rate_other: "0.00",
        engineer_rate_other_currency: this.default_currency,
        engineer_rate_other_dinero: toDinero("0.00", this.default_currency),
        usePrice: 'engineer',
      }))

      // actual work
      this.actualWorkTotals = invoiceData.actual_work_totals
      this.actualWorkUserTotals = this.actualWorkTotals.user_totals.map((a) => ({
        ...a,
        vat_type: this.invoice_default_vat,
        margin_perc: this.invoice_default_margin,
        engineer_rate: this.getEngineerRate(a.user_id),
        engineer_rate_currency: this.getEngineerRateCurrency(a.user_id),
        engineer_rate_dinero: this.getEngineerRateDinero(a.user_id),
        engineer_rate_other: "0.00",
        engineer_rate_other_currency: this.default_currency,
        engineer_rate_other_dinero: toDinero("0.00", this.default_currency),
        usePrice: 'engineer',
      }))

      this.updateAllTotals()

      // distance
      // TODO add this

      this.isLoading = false
    } else {
      await this.loadInvoice()
    }
  },
  methods: {
    // invoice lines
    resetInvoiceLines() {

    },
    createInvoiceLinesFromConfig() {
      // activity
      switch (this.useOnInvoiceActivitySelected) {
        case OPTION_USER_TOTALS:
          for (const activity of this.activity_user_totals) {
            this.createInvoiceLine(
              INVOICE_LINE_TYPE_ACTIVITY,
              `${this.$trans("Work hours")} ${this.getFullname(activity.user_id)}`,
              activity.total_hours,
              activity.vat,
              activity.total
            )
          }
          break
        case OPTION_ACTIVITY_ACTIVITY_TOTALS:
          this.createInvoiceLine(
            INVOICE_LINE_TYPE_ACTIVITY,
            `${this.$trans("Work hours")}`,
            this.activityTotals.hours_total,
            this.activityTotalVAT,
            this.activityTotal
          )
          break
        case OPTION_ACTIVITY_ACTUAL_WORK:
          this.createInvoiceLine(
            INVOICE_LINE_TYPE_ACTIVITY,
            `${this.$trans("Work hours")}`,
            this.activityTotals.actual_work_totals.actual_work,
            this.actualWorkTotalVAT,
            this.actualWorkTotal
          )
          break
        case OPTION_NONE:
          console.debug("not adding any activity")
      }

      // extra work

      // used materials

      // call out costs

    },
    createInvoiceLine(type, description, amount, vat, price_dinero) {
      const price = price_dinero.toFormat("$0.00")
      const price_currency = price_dinero.getCurrency()
      const model = new InvoiceLineModel({
        type,
        description,
        amount,
        vat,
        price,
        price_currency
      })
      this.invoiceLines.push(model)
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
    // activity / extra work
    async updateEngineer(user_id) {
      let engineer_user = this.engineer_models.find((m) => m.id === user_id)
      const minimalModel = new RateEngineerUserModel(engineer_user)

      let updatedEngineerUserJson = await engineerService.update(user_id, minimalModel)
      engineer_user.engineer.setPriceFields(updatedEngineerUserJson.engineer)
      this.updateActivityTotals()

      this.infoToast(this.$trans('Updated'), this.$trans('Hourly rate engineer has been updated'))
    },
    getFullname(user_id) {
      const user = this.engineer_models.find((m) => m.id === user_id)
      return user.full_name
    },
    getEngineerRateDinero(user_id) {
      const user = this.engineer_models.find((m) => m.id === user_id)
      return toDinero(user.engineer.hourly_rate, user.engineer.hourly_rate_currency)
    },
    getEngineerRate(user_id) {
      const user = this.engineer_models.find((m) => m.id === user_id)
      return user.engineer.hourly_rate
    },
    getEngineerRateCurrency(user_id) {
      const user = this.engineer_models.find((m) => m.id === user_id)
      return user.engineer.hourly_rate_currency
    },
    updateAllTotals() {
      this.updateActivityTotals()
      this.updateExtraWorkTotals()
      this.updateActualWorkTotals()
    },
    updateActivityTotals() {
      this.activity_user_totals = this.activity_user_totals.map((m) => this.updateUserActivityTotals(m))
      this.activityTotal = this.getItemsTotal(this.activity_user_totals)
      this.activityTotalVAT = this.getItemsTotalVAT(this.activity_user_totals)

      return true
    },
    updateUserActivityTotals(activity) {
      const price = this.getEngineerRateDinero(activity.user_id)
      const currency = this.getEngineerRateCurrency(activity.user_id)
      const hours_parts = activity.hours_total.split(':')
      let total = price.multiply(hours_parts[0])
      total = total.add(price.multiply(hours_parts[1]/60))
      let total_with_margin = total
      let margin = toDinero("0.00", currency)
      if (activity.margin_perc > 0) {
        margin = total.multiply(activity.margin_perc/100)
        total_with_margin = total.add(margin)
      }
      const vat = total_with_margin.multiply(parseInt(activity.vat_type)/100)
      activity.currency = currency
      activity.total = total_with_margin
      activity.vat = vat
      activity.margin = margin

      return activity
    },
    updateExtraWorkTotals() {
      this.extraWorkUserTotals = this.extraWorkUserTotals.map((m) => this.updateUserExtraWorkTotals(m))
      this.extraWorkTotal = this.getItemsTotal(this.extraWorkUserTotals)
      this.extraWorkTotalVAT = this.getItemsTotalVAT(this.extraWorkUserTotals)

      return true
    },
    updateUserExtraWorkTotals(extraWork) {
      const price = this.getEngineerRateDinero(extraWork.user_id)
      const currency = this.getEngineerRateCurrency(extraWork.user_id)
      const hours_parts = extraWork.work_total.split(':')
      let total = price.multiply(hours_parts[0])
      total = total.add(price.multiply(hours_parts[1]/60))
      let total_with_margin = total
      let margin = toDinero("0.00", currency)
      if (extraWork.margin_perc > 0) {
        margin = total.multiply(extraWork.margin_perc/100)
        total_with_margin = total.add(margin)
      }
      const vat = total_with_margin.multiply(parseInt(extraWork.vat_type)/100)
      extraWork.currency = currency
      extraWork.total = total_with_margin
      extraWork.vat = vat
      extraWork.margin = margin

      return extraWork

    },
    updateActualWorkTotals() {
      this.actualWorkUserTotals = this.actualWorkUserTotals.map((m) => this.updateUserActualWorkTotals(m))
      this.actualWorkTotal = this.getItemsTotal(this.actualWorkUserTotals)
      this.actualWorkTotalVAT = this.getItemsTotalVAT(this.actualWorkUserTotals)

      return true
    },
    updateUserActualWorkTotals(actualWork) {
      const price = this.getEngineerRateDinero(actualWork.user_id)
      const currency = this.getEngineerRateCurrency(actualWork.user_id)
      const hours_parts = actualWork.work_total.split(':')
      let total = price.multiply(parseInt(hours_parts[0]))
      total = total.add(price.multiply(hours_parts[1]/60))
      let total_with_margin = total
      let margin = toDinero("0.00", currency)
      if (actualWork.margin_perc > 0) {
        margin = total.multiply(actualWork.margin_perc/100)
        total_with_margin = total.add(margin)
      }
      const vat = total_with_margin.multiply(parseInt(actualWork.vat_type)/100)
      actualWork.currency = currency
      actualWork.total = total_with_margin
      actualWork.vat = vat
      actualWork.margin = margin

      return actualWork
    },

    setEngineerPriceOther(priceDinero, user_id) {
      let model = this.activity_user_totals.find((a) => a.user_id === user_id)
      model.engineer_rate_other_dinero = priceDinero
      model.engineer_rate_other = model.engineer_rate_other_dinero.toFormat('0.00')
      model.engineer_rate_other_currency = model.engineer_rate_other_dinero.getCurrency()
      return true
    },

    // materials
    async updateMaterial(material_id) {
      let material = this.material_models.find((m) => m.id === material_id)
      delete material.image
      const updatedMaterialJson = await materialService.update(material_id, material)
      material.setPriceFields(updatedMaterialJson)
      this.updateMaterialTotals()

      this.infoToast(this.$trans('Updated'), this.$trans('Material prices have been updated'))
    },
    getMaterialPrice(used_material) {
      if (used_material.usePrice === 'purchase') {
        const model = this.material_models.find((m) => m.id === used_material.material_id)
        return model.price_purchase_ex_dinero
      } else if (used_material.usePrice === 'selling') {
        const model = this.material_models.find((m) => m.id === used_material.material_id)
        return model.price_selling_ex_dinero
      } else if (used_material.usePrice === 'other') {
        const model = this.used_materials.find((m) => m.material_id === used_material.material_id)
        return model.price_purchase_ex_other_dinero
      } else {
        throw `unknown use price: ${used_material.usePrice}`
      }
    },
    getMaterialCurrency(used_material) {
      if (used_material.usePrice === 'purchase') {
        const model = this.material_models.find((m) => m.id === used_material.material_id)
        return model.price_purchase_ex_currency
      } else if (used_material.usePrice === 'selling') {
        const model = this.material_models.find((m) => m.id === used_material.material_id)
        return model.price_selling_ex_currency
      } else if (used_material.usePrice === 'other') {
        const model = this.used_materials.find((m) => m.material_id === used_material.material_id)
        return model.price_purchase_ex_other_currency
      } else {
        throw `unknown use price: ${used_material.usePrice}`
      }
    },
    getMaterialPriceFor(used_material, usePrice) {
      const model = this.material_models.find((m) => m.id === used_material.material_id)
      if (model) {
        return usePrice === 'purchase' ? model.price_purchase_ex_dinero : model.price_selling_ex_dinero
      } else {
        console.error('MODEL NOT FOUND for ', used_material)
      }
    },
    setPurchasePriceOther(priceDinero, material_id) {
      let model = this.used_materials.find((m) => m.material_id === material_id)
      model.price_purchase_ex_other_dinero = priceDinero
      model.price_purchase_ex_other = model.price_purchase_ex_other_dinero.toFormat('0.00')
      model.price_purchase_ex_other_currency = model.price_purchase_ex_other_dinero.getCurrency()
      return true
    },
    updateMaterialTotals() {
      this.used_materials = this.used_materials.map((m) => this.updateUsedMaterialTotals(m))
      this.materialsTotal = this.getItemsTotal(this.used_materials)
      this.materialsTotalVAT = this.getItemsTotalVAT(this.used_materials)
    },
    updateUsedMaterialTotals(material) {
      const price = this.getMaterialPrice(material)
      const currency = this.getMaterialCurrency(material)
      const total = price.multiply(material.amount)
      let total_with_margin = total
      let margin = toDinero("0.00", currency)
      if (material.margin_perc > 0) {
        margin = total.multiply(material.margin_perc/100)
        total_with_margin = total.add(margin)
      }
      const vat = total_with_margin.multiply(parseInt(material.vat_type)/100)
      material.currency = currency
      material.total = total_with_margin
      material.vat = vat
      material.margin = margin

      return material
    },
    getItemsTotal(items) {
      return items.reduce(
        (total, m) => (total.add(m.total)),
        toDinero("0.00", items[0].currency)
      )
    },
    getItemsTotalVAT(items) {
      return items.reduce(
        (total, m) => (total.add(m.vat)),
        toDinero("0.00", items[0].currency)
      )
    },
    async submitForm() {
      this.isLoading = true

      if (this.isCreate) {
        try {
          const invoice = invoiceModel.insert(this.invoice)
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
</style>
