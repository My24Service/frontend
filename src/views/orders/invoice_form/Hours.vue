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
            <b-form-radio :value="usePriceOptions.USE_PRICE_USER">
              {{ $trans('Engineer') }}
              {{ getEngineerRateFor(activity, usePriceOptions.USE_PRICE_USER).toFormat("$0.00") }}
            </b-form-radio>

            <b-form-radio :value="usePriceOptions.USE_PRICE_SETTINGS">
              {{ $trans('Settings') }}
              {{ getEngineerRateFor(activity, usePriceOptions.USE_PRICE_SETTINGS).toFormat("$0.00") }}
            </b-form-radio>

            <b-form-radio :value="usePriceOptions.USE_PRICE_CUSTOMER">
              {{ $trans('Customer') }}
              {{ getEngineerRateFor(activity, usePriceOptions.USE_PRICE_CUSTOMER).toFormat("$0.00") }}
            </b-form-radio>

            <b-form-radio :value="usePriceOptions.USE_PRICE_OTHER">
              <p class="flex">
                {{ $trans("Other") }}:&nbsp;&nbsp;
                <PriceInput
                  v-model="activity.price_other"
                  :currency="activity.price_other_currency"
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
import HeaderCell from "./Header";
import VAT from "./VAT";
import MarginInput from "./MarginInput";
import TotalRow from "./TotalRow";
import CostService from "../../../models/orders/Cost";
import PriceInput from "../../../components/PriceInput";
import {toDinero} from "../../../utils";

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
      default_hourly_rate: this.$store.getters.getInvoiceDefaultHourlyRate,

      total: null,
      totalVAT: null,

      useOnInvoiceOptions: [
        { text: this.$trans('Total'), value: OPTION_ACTIVITY_ACTIVITY_TOTALS },
        { text: this.$trans('User totals'), value: OPTION_USER_TOTALS },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnInvoiceSelected: null,

      usePriceOptions: {
        USE_PRICE_USER,
        USE_PRICE_SETTINGS,
        USE_PRICE_CUSTOMER,
        USE_PRICE_OTHER,
      },
    }
  },
  created() {
    // set vars in service
    this.costService.invoice_default_margin = this.invoice_default_margin
    this.costService.invoice_default_vat = this.invoice_default_vat
    this.costService.default_currency = this.default_currency

    // map input to Cost model collection
    let user_totals
    const use_price = this.usePriceOptions.USE_PRICE_SETTINGS

    switch (this.type) {
      case HOURS_TYPE_WORK:
        // filter out empty values
        user_totals = this.user_totals.filter((m) => m.work_secs !== null)
        this.costService.collection = user_totals.map((activity) => (
          this.costService.newModelFromWorkHours(
            activity,
            this.getPrice({...activity, use_price}),
            this.getCurrency({...activity, use_price}),
            use_price
        )))
        break
      case HOURS_TYPE_TRAVEL:
        user_totals = this.user_totals.filter((m) => m.travel_total_secs !== null)
        this.costService.collection = user_totals.map((activity) => (
          this.costService.newModelFromTravelHours(
            activity,
            this.getPrice({...activity, use_price}),
            this.getCurrency({...activity, use_price}),
            use_price
        )))
        break
      case HOURS_TYPE_EXTRA_WORK:
        user_totals = this.user_totals.filter((m) => m.extra_work_secs !== null)
        this.costService.collection = user_totals.map((activity) => (
          this.costService.newModelFromExtraWork(
            activity,
            this.getPrice({...activity, use_price}),
            this.getCurrency({...activity, use_price}),
            use_price
        )))
        break
      case HOURS_TYPE_ACTUAL_WORK:
        user_totals = this.user_totals.filter((m) => m.actual_work_secs !== null)
        this.costService.collection = user_totals.map((activity) => (
          this.costService.newModelFromActualWork(
            activity,
            this.getPrice({...activity, use_price}),
            this.getCurrency({...activity, use_price}),
            use_price
        )))
        break
      default:
        throw `created set userTotals, unknown type ${this.type}`
    }

    this.updateTotals()
  },
  methods: {
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
    otherPriceChanged(dineroVal, model) {
      model.setPriceField('price_other', dineroVal)
      this.updateTotals()
    },
    updateTotals() {
      // provide methods to get price and currency
      this.costService.updateTotals(
        this.getPrice,
        this.getCurrency
      )

      this.total = this.costService.getItemsTotal()
      this.totalVAT = this.costService.getItemsTotalVAT()

      return true
    },
    getPrice(activity) {
      const user = this.engineer_models.find((m) => m.id === activity.user_id)
      if (user) {
        switch (activity.use_price) {
          case this.usePriceOptions.USE_PRICE_USER:
            return user.engineer.hourly_rate
          case this.usePriceOptions.USE_PRICE_CUSTOMER:
            return this.customer.hourly_rate_engineer
          case this.usePriceOptions.USE_PRICE_SETTINGS:
            return this.default_hourly_rate
          case this.usePriceOptions.USE_PRICE_OTHER:
            return activity.price_other
          default:
            throw `getPrice: unknown use_price for engineer: ${activity.use_price}`
        }
      } else {
        console.error("getPrice: model not found")
      }
    },
    getCurrency(activity) {
      const user = this.engineer_models.find((m) => m.id === activity.user_id)
      if (user) {
        switch (activity.use_price) {
          case this.usePriceOptions.USE_PRICE_USER:
            return user.engineer.hourly_rate_currency
          case this.usePriceOptions.USE_PRICE_CUSTOMER:
            return this.customer.hourly_rate_engineer_currency
          case this.usePriceOptions.USE_PRICE_SETTINGS:
            return this.default_currency
          case this.usePriceOptions.USE_PRICE_OTHER:
            return this.default_currency
          default:
            throw `getCurrency: unknown use_price for engineer: ${activity.use_price}`
        }
      } else {
        console.error("getCurrency: model not found")
      }
    },
    getEngineerRateFor(obj, usePrice) {
      const user = this.engineer_models.find((m) => m.id === obj.user_id)
      if (user) {
        switch (usePrice) {
          case this.usePriceOptions.USE_PRICE_USER:
            return user.engineer.hourly_rate_dinero
          case this.usePriceOptions.USE_PRICE_CUSTOMER:
            return this.customer.hourly_rate_engineer_dinero
          case this.usePriceOptions.USE_PRICE_SETTINGS:
            return toDinero(this.default_hourly_rate, this.default_currency)
          default:
            throw `getEngineerRateFor: unknown usePrice for engineer: ${usePrice}`
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