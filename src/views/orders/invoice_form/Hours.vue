<template>
  <Collapse
    :title="getTitle()"
  >
    <b-container fluid>
      <b-row>
        <b-col cols="3">
          <HeaderCell
            :text='$trans("Engineer")'
          />
        </b-col>
        <b-col cols="2">
          <HeaderCell
            :text='$trans("Hours")'
          />
        </b-col>
        <b-col cols="3">
          <HeaderCell
            :text='$trans("Engineer rate")'
            />
        </b-col>
        <b-col cols="1">
          <HeaderCell
            :text='$trans("Margin")'
            />
        </b-col>
        <b-col cols="1">
          <HeaderCell
            :text='$trans("VAT type")'
            />
        </b-col>
        <b-col cols="2" />
      </b-row>
      <b-row v-for="activity in costService.collection" :key="activity.user_id" class="material_row">
        <b-col cols="3">
          {{ getFullname(activity.user_id) }}
        </b-col>
        <b-col cols="2">
          {{ activity.hours_total }}
        </b-col>
        <b-col cols="3">
          <b-form-radio-group
            @change="updateTotals"
            v-model="activity.use_price"
          >
            <b-form-radio :value="usePriceOptionsActivity.USE_PRICE_USER">
              {{ $trans('Engineer') }}
              {{ getEngineerRateFor(activity, usePriceOptionsActivity.USE_PRICE_USER).toFormat("$0.00") }}
            </b-form-radio>

            <b-form-radio :value="usePriceOptionsActivity.USE_PRICE_SETTINGS">
              {{ $trans('Settings') }}
              {{ getEngineerRateFor(activity, usePriceOptionsActivity.USE_PRICE_SETTINGS).toFormat("$0.00") }}
            </b-form-radio>

            <b-form-radio :value="usePriceOptionsActivity.USE_PRICE_CUSTOMER">
              {{ $trans('Customer') }}
              {{ getEngineerRateFor(activity, usePriceOptionsActivity.USE_PRICE_CUSTOMER).toFormat("$0.00") }}
            </b-form-radio>

            <b-form-radio :value="usePriceOptionsActivity.USE_PRICE_OTHER">
              <p class="flex">
                {{ $trans("Other") }}:&nbsp;&nbsp;
                <PriceInput
                  v-model="activity.engineer_rate_other"
                  :currency="activity.engineer_rate_other_currency"
                  @priceChanged="(dineroVal) => otherPriceChanged(dineroVal, activity)"
                />
              </p>
            </b-form-radio>
          </b-form-radio-group>
        </b-col>
        <b-col cols="1">
          <MarginInput
            :margin="activity.margin_perc"
            @inputChanged="(val) => marginChanged(activity, val)"
          />
        </b-col>
        <b-col cols="1">
          <VAT @vatChanged="(val) => changeVatType(activity, val)" />
        </b-col>
        <b-col cols="2">
          <Totals
            :total="activity.total_dinero"
            :margin="activity.margin_dinero"
            :vat="activity.vat_dinero"
          />
        </b-col>
      </b-row>
      <TotalRow
        :items_total="hours_total"
        :total="total"
        :total_vat="totalVAT"
      />

      <div class="use-on-invoice-container">
        <h3>{{ $trans("What to add as invoice lines")}}</h3>
        <b-form-group>
          <b-form-radio-group
            v-model="useOnInvoiceSelected"
            :options="useOnInvoiceOptions"
          ></b-form-radio-group>
        </b-form-group>
      </div>

    </b-container>
  </Collapse>
</template>

<script>
import Totals from "./Totals";
import Collapse from "../../../components/Collapse";
import invoiceMixin from "./mixin.js";
import {InvoiceLineModel} from "../../../models/orders/InvoiceLine";
import {
  HOURS_TYPE_ACTUAL_WORK,
  HOURS_TYPE_EXTRA_WORK,
  HOURS_TYPE_TRAVEL,
  HOURS_TYPE_WORK,
  INVOICE_LINE_TYPE_ACTIVITY,
  OPTION_ACTIVITY_ACTIVITY_TOTALS, OPTION_ACTIVITY_ACTUAL_WORK,
  OPTION_NONE,
  OPTION_USER_TOTALS, USE_PRICE_CUSTOMER, USE_PRICE_OTHER, USE_PRICE_SETTINGS, USE_PRICE_USER
} from "./constants";
import {toDinero} from "../../../utils";
import HeaderCell from "./Header";
import VAT from "./VAT";
import MarginInput from "./MarginInput";
import TotalRow from "./TotalRow";
import CostService, {
  COST_TYPE_ACTUAL_WORK,
  COST_TYPE_EXTRA_WORK,
  COST_TYPE_TRAVEL_HOURS,
  COST_TYPE_WORK_HOURS,
} from "../../../models/orders/Cost";
import PriceInput from "../../../components/PriceInput";

export default {
  name: "HoursComponent",
  emits: ['invoiceLinesCreated'],
  mixins: [invoiceMixin],
  components: {
    Totals,
    Collapse,
    HeaderCell,
    VAT,
    MarginInput,
    TotalRow,
    PriceInput,
  },
  watch: {
    engineer_models: {
      handler(newValue) {
        // console.log('engineer_models changed', newValue)
        this.updateTotals()
      },
      deep: true
    },
    customer: {
      handler(newValue) {
        // console.log('customer changed', newValue)
        this.updateTotals()
      },
      deep: true
    }
  },
  props: {
    type: {
      type: [String],
      default: null
    },
    hours_total: {
      type: [String],
      default: null
    },
    hours_total_secs: {
      type: [String],
      default: null
    },
    user_totals: {
      type: [Array],
      default: null
    },
    engineer_models: {
      type: [Array],
      default: null
    },
    customer: {
      type: [Object],
      default: null
    },
  },
  data () {
    return {
      isLoading: false,

      HOURS_TYPE_WORK,
      HOURS_TYPE_TRAVEL,
      HOURS_TYPE_EXTRA_WORK,
      HOURS_TYPE_ACTUAL_WORK,

      costService: new CostService(),

      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      invoice_default_margin: this.$store.getters.getInvoiceDefaultMargin,

      total: null,
      totalVAT: null,

      useOnInvoiceOptions: [
        { text: this.$trans('Total'), value: OPTION_ACTIVITY_ACTIVITY_TOTALS },
        { text: this.$trans('User totals'), value: OPTION_USER_TOTALS },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnInvoiceSelected: null,

      usePriceOptionsActivity: {
        USE_PRICE_USER,
        USE_PRICE_SETTINGS,
        USE_PRICE_CUSTOMER,
        USE_PRICE_OTHER,
      },
    }
  },
  created() {
    // map input to usable dataset
    let count = 0
    let user_totals
    switch (this.type) {
      case HOURS_TYPE_WORK:
        // filter out empty values
        user_totals = this.user_totals.filter((m) => m.work_secs !== null)
        this.costService.collection = user_totals.map((a) => (
          new this.costService.model({...a,
          ...this.getDefaultCostProps(a.user_id),
          hours_total: a.work,
          amount_duration: parseInt(a.work_secs),
          data_index: count++,
        })))
        break
      case HOURS_TYPE_TRAVEL:
        user_totals = this.user_totals.filter((m) => m.travel_total_secs !== null)
        this.costService.collection = user_totals.map((a) => (
          new this.costService.model({
          ...a,
          ...this.getDefaultCostProps(a.user_id),
          hours_total: a.travel_total,
          amount_duration: parseInt(a.work_secs),
          data_index: count++,
        })))
        break
      case HOURS_TYPE_EXTRA_WORK:
        user_totals = this.user_totals.filter((m) => m.extra_work_secs !== null)
        this.costService.collection = user_totals.map((a) => (
          new this.costService.model({
          ...a,
          ...this.getDefaultCostProps(a.user_id),
          hours_total: a.extra_work,
          amount_duration: parseInt(a.work_secs),
          data_index: count++,
        })))
        break
      case HOURS_TYPE_ACTUAL_WORK:
        user_totals = this.user_totals.filter((m) => m.actual_work_secs !== null)
        this.costService.collection = user_totals.map((a) => (
          new this.costService.model({
          ...a,
          ...this.getDefaultCostProps(a.user_id),
          hours_total: a.actual_work,
          amount_duration: parseInt(a.work_secs),
          data_index: count++,
        })))
        break
      default:
        throw `created set userTotals, unknown type ${this.type}`
    }

    this.updateTotals()
  },
  methods: {
    getDefaultCostProps(user_id) {
      // default props for cost model
      return {
        vat_currency: this.default_currency,
        margin_currency: this.default_currency,
        price_currency: this.default_currency,
        total_currency: this.default_currency,
        price_other: "0.00",
        price_other_currency: this.default_currency,
        vat_type: this.invoice_default_vat,
        margin_perc: this.invoice_default_margin,
        engineer_rate: this.getEngineerRate(user_id),
        engineer_rate_currency: this.getEngineerRateCurrency(user_id),
        engineer_rate_dinero: this.getEngineerRateDinero(user_id),
        engineer_rate_other: "0.00",
        engineer_rate_other_currency: this.default_currency,
        engineer_rate_other_dinero: toDinero("0.00", this.default_currency),
        use_price: this.usePriceOptionsActivity.USE_PRICE_USER,
        cost_type: this.getCostType(),
      }
    },
    getTitle() {
      switch (this.type) {
        case HOURS_TYPE_WORK:
          return this.$trans("Work hours")
        case HOURS_TYPE_TRAVEL:
          return this.$trans("Travel hours")
        case HOURS_TYPE_EXTRA_WORK:
          return this.$trans("Extra work")
        case HOURS_TYPE_ACTUAL_WORK:
          return this.$trans("Actual work")
        default:
          throw `getTitle(), unknown type ${this.type}`
      }
    },
    getCostType() {
      switch (this.type) {
        case HOURS_TYPE_WORK:
          return COST_TYPE_WORK_HOURS
        case HOURS_TYPE_TRAVEL:
          return COST_TYPE_TRAVEL_HOURS
        case HOURS_TYPE_EXTRA_WORK:
          return COST_TYPE_EXTRA_WORK
        case HOURS_TYPE_ACTUAL_WORK:
          return COST_TYPE_ACTUAL_WORK
        default:
          throw `getCostType(), unknown type ${this.type}`
      }
    },
    otherPriceChanged(dineroVal, model) {
      model.setPriceField('engineer_rate_other', dineroVal)
      this.updateTotals()
    },
    updateTotals() {
      // provide methods to get price and currency
      this.costService.updateTotals(
        this.getSelectedEngineerRate,
        this.getSelectedEngineerRateCurrency
      )

      this.total = this.costService.getItemsTotal()
      this.totalVAT = this.costService.getItemsTotalVAT()

      return true
    },
    getSelectedEngineerRate(activity) {
      const user = this.engineer_models.find((m) => m.id === activity.user_id)
      if (user) {
        switch (activity.use_price) {
          case this.usePriceOptionsActivity.USE_PRICE_USER:
            return toDinero(user.engineer.hourly_rate, user.engineer.hourly_rate_currency)
          case this.usePriceOptionsActivity.USE_PRICE_CUSTOMER:
            return this.customer.hourly_rate_engineer_dinero
          case this.usePriceOptionsActivity.USE_PRICE_SETTINGS:
            return this.getInvoiceDefaultHourlyRateDinero()
          case this.usePriceOptionsActivity.USE_PRICE_OTHER:
            return activity.engineer_rate_other_dinero
          default:
            throw `unknown use_price for engineer: ${activity.use_price}`
        }
      } else {
        console.error("getEngineerRateFor: model not found")
      }
    },
    getSelectedEngineerRateCurrency(activity) {
      const user = this.engineer_models.find((m) => m.id === activity.user_id)
      if (user) {
        switch (activity.use_price) {
          case this.usePriceOptionsActivity.USE_PRICE_USER:
            return user.engineer.hourly_rate_currency
          case this.usePriceOptionsActivity.USE_PRICE_CUSTOMER:
            return this.customer.hourly_rate_engineer_currency
          case this.usePriceOptionsActivity.USE_PRICE_SETTINGS:
            return this.default_currency
          case this.usePriceOptionsActivity.USE_PRICE_OTHER:
            return this.default_currency
          default:
            throw `unknown use_price for engineer: ${activity.use_price}`
        }
      } else {
        console.error("getEngineerRateFor: model not found")
      }
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
    getEngineerRateFor(obj, usePrice) {
      const user = this.engineer_models.find((m) => m.id === obj.user_id)
      if (user) {
        switch (usePrice) {
          case this.usePriceOptionsActivity.USE_PRICE_USER:
            return toDinero(user.engineer.hourly_rate, user.engineer.hourly_rate_currency)
          case this.usePriceOptionsActivity.USE_PRICE_CUSTOMER:
            return this.customer.hourly_rate_engineer_dinero
          case this.usePriceOptionsActivity.USE_PRICE_SETTINGS:
            return this.getInvoiceDefaultHourlyRateDinero()
          default:
            throw `unknown usePrice for engineer: ${usePrice}`
        }
      } else {
        console.error("getEngineerRateFor: model not found")
      }
    },
    createInvoiceLines() {
      switch (this.useOnInvoiceActivitySelected) {
        case OPTION_USER_TOTALS:
          let invoiceLines = this.userTotals.map((activity) => {
            this.createInvoiceLine(
              INVOICE_LINE_TYPE_ACTIVITY,
              `${this.$trans("Work hours")} ${this.getFullname(activity.user_id)}`,
              activity.total_hours,
              activity.vat,
              activity.total
            )
          })
          this.$emit('invoiceLinesCreated', invoiceLines)
          break
        case OPTION_ACTIVITY_ACTIVITY_TOTALS:
          this.createInvoiceLine(
            INVOICE_LINE_TYPE_ACTIVITY,
            `${this.$trans("Work hours")}`,
            this.activity_totals.hours_total,
            this.totalVAT,
            this.total
          )
          break
        case OPTION_ACTIVITY_ACTUAL_WORK:
          this.createInvoiceLine(
            INVOICE_LINE_TYPE_ACTIVITY,
            `${this.$trans("Work hours")}`,
            this.activity_totals.actual_work_totals.actual_work,
            this.actualWorkTotalVAT,
            this.actualWorkTotal
          )
          break
        case OPTION_NONE:
          console.debug("not adding any activity")
      }
    },
  }
}
</script>

<style scoped>

</style>
