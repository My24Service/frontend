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
      <b-row v-for="activity in userTotals" :key="activity.user_id" class="material_row">
        <b-col cols="3">
          {{ getFullname(activity.user_id) }}
        </b-col>
        <b-col cols="2">
          {{ activity.hours_total }}
        </b-col>
        <b-col cols="3">
          <EngineerPriceRadio
            :item="activity"
            :engineer_models="engineer_models"
            :customer="customer"
            @otherPriceChanged="(dineroVal) => otherPriceChanged(dineroVal, activity)"
            @radioChanged="(usePrice) => engineerPriceRadioChanged(activity, usePrice)"
          />
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
            :total="activity.total"
            :margin="activity.margin"
            :vat="activity.vat"
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
  OPTION_ACTIVITY_ACTIVITY_TOTALS, OPTION_ACTIVITY_ACTUAL_WORK, OPTION_ACTUAL_WORK_TOTALS,
  OPTION_NONE,
  OPTION_USER_TOTALS
} from "./constants";
import {toDinero} from "../../../utils";
import HeaderCell from "./Header";
import VAT from "./VAT";
import EngineerPriceRadio from "./EngineerPriceRadio";
import MarginInput from "./MarginInput";
import TotalRow from "./TotalRow";

export default {
  name: "ActivityComponent",
  emits: ['invoiceLinesCreated'],
  mixins: [invoiceMixin],
  components: {
    Totals,
    Collapse,
    HeaderCell,
    VAT,
    EngineerPriceRadio,
    MarginInput,
    TotalRow,
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
  created() {
    // map input to usable dataset
    let count = 0
    switch (this.type) {
      case HOURS_TYPE_WORK:
        this.userTotals = this.user_totals.map((a) => ({
          ...a,
          ...this.getDefaultItemProps(a.user_id),
          // use different field for total hours
          hours_total: a.work_total,
          data_index: count++,
        }))
        break
      case HOURS_TYPE_TRAVEL:
        this.userTotals = this.user_totals.map((a) => ({
          ...a,
          ...this.getDefaultItemProps(a.user_id),
          // use different field for total hours
          hours_total: a.travel_total,
          data_index: count++,
        }))
        break
      case HOURS_TYPE_EXTRA_WORK:
        this.userTotals = this.user_totals.map((a) => ({
          ...a,
          ...this.getDefaultItemProps(a.user_id),
          // not different, this has hours_total
          data_index: count++,
        }))
        break
      case HOURS_TYPE_ACTUAL_WORK:
        this.userTotals = this.user_totals.map((a) => ({
          ...a,
          ...this.getDefaultItemProps(a.user_id),
          data_index: count++,
        }))
        break
      default:
        throw `created set userTotals, unknown type ${this.type}`
    }

    this.updateTotals()
  },
  data () {
    return {
      isLoading: false,

      HOURS_TYPE_WORK,
      HOURS_TYPE_TRAVEL,
      HOURS_TYPE_EXTRA_WORK,
      HOURS_TYPE_ACTUAL_WORK,

      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      invoice_default_margin: this.$store.getters.getInvoiceDefaultMargin,

      userTotals: [],
      total: null,
      totalVAT: null,

      useOnInvoiceOptions: [
        { text: this.$trans('Total'), value: OPTION_ACTIVITY_ACTIVITY_TOTALS },
        { text: this.$trans('User totals'), value: OPTION_USER_TOTALS },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnInvoiceSelected: null,

    }
  },
  methods: {
    getDefaultItemProps(user_id) {
      // default props for items
      return {
        vat_type: this.invoice_default_vat,
        margin_perc: this.invoice_default_margin,
        engineer_rate: this.getEngineerRate(user_id),
        engineer_rate_currency: this.getEngineerRateCurrency(user_id),
        engineer_rate_dinero: this.getEngineerRateDinero(user_id),
        engineer_rate_other: "0.00",
        engineer_rate_other_currency: this.default_currency,
        engineer_rate_other_dinero: toDinero("0.00", this.default_currency),
        usePrice: this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_ENGINEER,
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
    otherPriceChanged(dineroVal, extra_work) {
      this.setEngineerRateOther(dineroVal, extra_work)
      this.updateTotals()
    },
    engineerPriceRadioChanged(activity, usePrice) {
      activity.usePrice = usePrice
      this.updateTotals()
    },
    updateTotals() {
      this.userTotals = this.userTotals.map((m) => this.updateHoursUserTotals(m))
      this.total = this.getItemsTotal(this.userTotals)
      this.totalVAT = this.getItemsTotalVAT(this.userTotals)

      return true
    },

    setEngineerRateOther(priceDinero, item) {
      item.engineer_rate_other_dinero = priceDinero
      item.engineer_rate_other = item.engineer_rate_other_dinero.toFormat('0.00')
      item.engineer_rate_other_currency = item.engineer_rate_other_dinero.getCurrency()

      return true
    },
    updateHoursUserTotals(item) {
      const price = this.getSelectedEngineerRate(item)
      const currency = this.getSelectedEngineerRateCurrency(item)
      const hours_parts = item.hours_total.split(':')
      let total = price.multiply(hours_parts[0])
      total = total.add(price.multiply(hours_parts[1]/60))
      let total_with_margin = total
      let margin = toDinero("0.00", currency)
      if (item.margin_perc > 0) {
        margin = total.multiply(item.margin_perc/100)
        total_with_margin = total.add(margin)
      }
      const vat = total_with_margin.multiply(parseInt(item.vat_type)/100)
      item.currency = currency
      item.total = total_with_margin
      item.vat = vat
      item.margin = margin

      return item
    },
    getSelectedEngineerRate(activity) {
      const user = this.engineer_models.find((m) => m.id === activity.user_id)
      if (user) {
        switch (activity.usePrice) {
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_ENGINEER:
            return toDinero(user.engineer.hourly_rate, user.engineer.hourly_rate_currency)
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_CUSTOMER:
            return this.customer.hourly_rate_engineer_dinero
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_SETTINGS:
            return this.getInvoiceDefaultHourlyRateDinero()
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_OTHER:
            return activity.engineer_rate_other_dinero
          default:
            throw `unknown usePrice for engineer: ${activity.usePrice}`
        }
      } else {
        console.error("getEngineerRateFor: model not found")
      }
    },
    getSelectedEngineerRateCurrency(activity) {
      const user = this.engineer_models.find((m) => m.id === activity.user_id)
      if (user) {
        switch (activity.usePrice) {
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_ENGINEER:
            return user.engineer.hourly_rate_currency
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_CUSTOMER:
            return this.customer.hourly_rate_engineer_currency
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_SETTINGS:
            return this.default_currency
          case this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_OTHER:
            return this.default_currency
          default:
            throw `unknown usePrice for engineer: ${activity.usePrice}`
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
  }
}
</script>

<style scoped>

</style>
